/**
 * Sends due push alerts (lib/pushplan.ts) to the browsers that follow them (push_subs, from app/api/push).
 * Run by .github/workflows/push-alerts.yml: `episodes` hourly, `birthdays` once a day. Needs MONGODB_URI and
 * VAPID_PRIVATE_KEY; the public key is data/vapid.json. Without them it says so and exits cleanly.
 */
import { MongoClient } from "mongodb";
import webpush from "web-push";
import { AIRING_URL, indexAiring } from "../lib/airing";
import { birthdayChars } from "../lib/birthdays";
import { characterPathFor } from "../lib/charsnap";
import { VAPID_PUBLIC_KEY } from "../lib/push";
import { dueBirthdays, dueEpisodes, type Alert } from "../lib/pushplan";

const mode = process.argv[2];
if (mode !== "episodes" && mode !== "birthdays") throw new Error("usage: send-push.mts episodes|birthdays");
const { MONGODB_URI, VAPID_PRIVATE_KEY } = process.env;
if (!MONGODB_URI || !VAPID_PRIVATE_KEY || !VAPID_PUBLIC_KEY) {
  console.log("::notice::Push alerts are off: MONGODB_URI, VAPID_PRIVATE_KEY or data/vapid.json is missing.");
  process.exit(0);
}
webpush.setVapidDetails("https://anilumi.in", VAPID_PUBLIC_KEY, VAPID_PRIVATE_KEY);

let alerts: Alert[];
if (mode === "episodes") {
  const snap = await fetch(AIRING_URL, { signal: AbortSignal.timeout(20_000) }).then((r) => r.json());
  alerts = dueEpisodes(indexAiring(snap).shows);
} else {
  alerts = dueBirthdays(birthdayChars(), characterPathFor);
}

const client = await new MongoClient(MONGODB_URI, { serverSelectionTimeoutMS: 15_000 }).connect();
const d = client.db(process.env.MONGODB_DB || "anilumi");
const subs = d.collection<{ _id: string; endpoint: string; keys: { p256dh: string; auth: string }; topics: string[] }>("push_subs");
const sent = d.collection<{ _id: string; at: Date; n: number }>("push_sent");
await Promise.all([subs.createIndex({ topics: 1 }), sent.createIndex({ at: 1 }, { expireAfterSeconds: 30 * 86400 })]);

// Only alerts someone follows; claim each key first so a rerun or overlapping run never sends twice.
const followed = new Set(await subs.distinct("topics"));
let ok = 0, gone = 0, failed = 0;
for (const a of alerts.filter((x) => followed.has(x.topic))) {
  const claimed = await sent.insertOne({ _id: a.key, at: new Date(), n: 0 }).then(() => true, (e) => (e.code === 11000 ? false : Promise.reject(e)));
  if (!claimed) continue;
  const payload = JSON.stringify({ title: a.title, body: a.body, url: a.url, icon: a.icon, tag: a.key });
  let n = 0;
  for await (const s of subs.find({ topics: a.topic })) {
    try {
      await webpush.sendNotification({ endpoint: s.endpoint, keys: s.keys }, payload, { TTL: 6 * 3600 });
      ok++; n++;
    } catch (e) {
      const code = (e as { statusCode?: number }).statusCode;
      if (code === 404 || code === 410) { await subs.deleteOne({ _id: s._id }); gone++; } // unsubscribed or expired
      else { failed++; console.warn(`push failed (${code ?? "network"}) for ${a.key}`); }
    }
  }
  await sent.updateOne({ _id: a.key }, { $set: { n } });
  console.log(`${a.key}: sent to ${n}`);
}
console.log(`${mode}: ${alerts.length} due, ${followed.size} followed topics; ${ok} sent, ${gone} expired removed, ${failed} failed`);
await client.close();
if (failed && !ok) process.exit(1);
