/**
 * Sends due alerts (lib/pushplan.ts) by browser push (push_subs, from app/api/push) and email (confirmed
 * leads, through Resend). Run by .github/workflows/alerts.yml:
 *   episodes  hourly: new episodes and premieres, push + email
 *   birthdays daily:  character birthdays, push
 *   digest    Friday: the weekly digest email
 *   confirm-pending (by hand only): one confirmation email to signups from before email was switched on
 * Each alert is claimed in alerts_sent before sending, so reruns never repeat it. A channel without its
 * secrets (VAPID_PRIVATE_KEY + data/vapid.json, RESEND_API_KEY) is skipped with a notice.
 */
import { MongoClient, type Db } from "mongodb";
import webpush from "web-push";
import { AIRING_URL, indexAiring } from "../lib/airing";
import { birthdayChars } from "../lib/birthdays";
import { characterPathFor } from "../lib/charsnap";
import { emailEnabled, sendMails } from "../lib/email";
import { confirmMail, digestMail, episodeMail, type LeadDoc } from "../lib/emails";
import { getNews } from "../lib/news";
import { VAPID_PUBLIC_KEY } from "../lib/push";
import { buildDigest, dueBirthdays, dueEpisodes, type Alert } from "../lib/pushplan";

const mode = process.argv[2];
if (!["episodes", "birthdays", "digest", "confirm-pending"].includes(mode)) throw new Error("usage: send-alerts.mts episodes|birthdays|digest|confirm-pending");
const { MONGODB_URI, VAPID_PRIVATE_KEY } = process.env;
if (!MONGODB_URI) { console.log("::notice::Alerts are off: MONGODB_URI is missing."); process.exit(0); }
const pushOn = Boolean(VAPID_PRIVATE_KEY && VAPID_PUBLIC_KEY);
if (pushOn) webpush.setVapidDetails("https://anilumi.in", VAPID_PUBLIC_KEY!, VAPID_PRIVATE_KEY!);
if (!pushOn) console.log("::notice::Push is off: VAPID_PRIVATE_KEY or data/vapid.json is missing.");
if (!emailEnabled()) console.log("::notice::Email is off: RESEND_API_KEY is missing.");

const client = await new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 15_000 }).connect();
const d = client.db(process.env.MONGODB_DB || "anilumi");
const sent = d.collection<{ _id: string; at: Date; n: number }>("alerts_sent");
await sent.createIndex({ at: 1 }, { expireAfterSeconds: 30 * 86400 });
let failures = 0, successes = 0;

/** Claim a key; false when an earlier run already has it. */
const claim = (key: string) => sent.insertOne({ _id: key, at: new Date(), n: 0 }).then(() => true, (e) => (e.code === 11000 ? false : Promise.reject(e)));
const record = (key: string, n: number) => sent.updateOne({ _id: key }, { $set: { n } });

async function push(db: Db, alerts: Alert[]) {
  if (!pushOn) return;
  const subs = db.collection<{ _id: string; endpoint: string; keys: { p256dh: string; auth: string }; topics: string[] }>("push_subs");
  const followed = new Set(await subs.distinct("topics"));
  for (const a of alerts.filter((x) => followed.has(x.topic))) {
    if (!(await claim(`push:${a.key}`))) continue;
    const payload = JSON.stringify({ title: a.title, body: a.body, url: a.url, icon: a.icon, tag: a.key });
    let n = 0;
    for await (const s of subs.find({ topics: a.topic })) {
      try {
        await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, payload, { TTL: 6 * 3600 });
        n++; successes++;
      } catch (e) {
        const code = (e as { statusCode?: number }).statusCode;
        if (code === 404 || code === 410) await subs.deleteOne({ _id: s._id }); // unsubscribed or expired
        else { failures++; console.warn(`push failed (${code ?? "network"}) for ${a.key}`); }
      }
    }
    await record(`push:${a.key}`, n);
    console.log(`push ${a.key}: ${n}`);
  }
}

const leads = d.collection<LeadDoc & { status: string }>("leads");

async function mail(key: string, mails: ReturnType<typeof episodeMail>[]) {
  if (!emailEnabled() || !mails.length || !(await claim(key))) return;
  const r = await sendMails(mails, key);
  successes += r.sent; failures += r.errors.length;
  for (const e of r.errors) console.warn(`email failed for ${key}: ${e}`);
  await record(key, r.sent);
  console.log(`email ${key}: ${r.sent}/${mails.length}`);
}

if (mode === "episodes") {
  const snap = await fetch(AIRING_URL, { signal: AbortSignal.timeout(20_000) }).then((r) => r.json());
  const alerts = dueEpisodes(indexAiring(snap).shows);
  await push(d, alerts);
  for (const a of alerts) {
    const animeId = a.topic.slice(2);
    const to = await leads.find({ kind: "alert", animeId, status: "confirmed" }).toArray();
    await mail(`mail:${a.key}`, to.map((l) => episodeMail(l, a)));
  }
  console.log(`episodes: ${alerts.length} due`);
} else if (mode === "birthdays") {
  const alerts = dueBirthdays(birthdayChars(), characterPathFor);
  await push(d, alerts);
  console.log(`birthdays: ${alerts.length} due`);
} else if (mode === "digest") {
  const snap = await fetch(AIRING_URL, { signal: AbortSignal.timeout(20_000) }).then((r) => r.json());
  const news = await getNews().catch(() => []);
  const digest = buildDigest(indexAiring(snap).shows, news.map((n) => ({ title: n.title, url: n.url, source: n.source })));
  const to = await leads.find({ kind: "digest", status: "confirmed" }).toArray();
  if (digest.episodes.length + digest.premieres.length === 0) console.log("::warning::Digest is empty (stale airing snapshot?); not sending.");
  else await mail(`mail:digest:${new Date().toISOString().slice(0, 10)}`, to.map((l) => digestMail(l, digest)));
  console.log(`digest: ${to.length} subscribers, ${digest.premieres.length} premieres, ${digest.episodes.length} episodes, ${digest.news.length} news`);
} else if (mode === "confirm-pending") {
  // Signups from before email existed: one confirmation each, never repeated (confirmSentAt).
  const pending = await leads.find({ status: "pending", confirmSentAt: { $exists: false } }).toArray();
  if (emailEnabled() && pending.length) {
    await leads.updateMany({ _id: { $in: pending.map((l) => (l as unknown as { _id: unknown })._id) } } as never, { $set: { confirmSentAt: new Date() } });
    const r = await sendMails(pending.map(confirmMail), `confirm-pending:${new Date().toISOString().slice(0, 13)}`);
    successes += r.sent; failures += r.errors.length;
    for (const e of r.errors) console.warn(`email failed: ${e}`);
  }
  console.log(`confirm-pending: ${pending.length} pending signups`);
}

console.log(`done: ${successes} sent, ${failures} failed`);
await client.close();
if (failures && !successes) process.exit(1);
