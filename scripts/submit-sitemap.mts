/**
 * Tells search engines about the sitemap, daily and after each deploy (.github/workflows/sitemap.yml).
 *  1. Google: Search Console API, sitemaps.submit for https://anilumi.in/sitemap.xml on the domain property, then
 *     prints what Google reports (last read, errors, warnings, URLs submitted). Needs the repository secret
 *     GSC_SERVICE_ACCOUNT: a Google Cloud service account's JSON key, added as a user of the Search Console
 *     property. Skipped with a notice without it. (Google retired its anonymous sitemap "ping" in 2023.)
 *  2. IndexNow (lib/indexnow.ts): the URLs whose data changed in the last LOOKBACK_HOURS. Hourly and daily pages
 *     carry the sitemap's build time rather than a change, so they're skipped; new episodes go as they air
 *     (scripts/send-alerts.mts). URLs sent in the last 72 hours are skipped (the log at INDEXNOW_SENT_LOG, kept by
 *     actions/cache); the rest go CHUNK_SIZE at a time, GAP_SECONDS apart, at most MAX_CHUNKS groups a run. What
 *     doesn't fit waits for the next run: LOOKBACK_HOURS (72) keeps it in view for three daily runs.
 * By hand: GSC_SERVICE_ACCOUNT="$(cat key.json)" npx tsx scripts/submit-sitemap.mts
 */
import { createSign } from "node:crypto";
import { mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { setTimeout as sleep } from "node:timers/promises";
import { CHUNK_SIZE, SENT_WINDOW_MS, changedEntries, chunk, freshUrls, recordSent, submitIndexNow, type SentLog } from "../lib/indexnow";

const SITE = "https://anilumi.in";
const SITEMAP = `${SITE}/sitemap.xml`;
const PROPERTY = "sc-domain:anilumi.in";
// No longer than the sent log's window, or a URL sent once would come back into view and be sent again.
const LOOKBACK_HOURS = Math.min(Number(process.env.LOOKBACK_HOURS) || 72, SENT_WINDOW_MS / 3600_000);
const GAP_SECONDS = 90; // between groups
const MAX_CHUNKS = 5; // a run: 100 URLs, 6 minutes of pauses (the job's timeout is 15)
const SENT_LOG = process.env.INDEXNOW_SENT_LOG || join(tmpdir(), "anilumi-indexnow-sent.json");
let problems = 0;

/** OAuth access token for a service account (JWT bearer grant), scoped to Search Console. */
async function googleToken(sa: { client_email: string; private_key: string }): Promise<string> {
  const b64 = (o: unknown) => Buffer.from(JSON.stringify(o)).toString("base64url");
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${b64({ alg: "RS256", typ: "JWT" })}.${b64({ iss: sa.client_email, scope: "https://www.googleapis.com/auth/webmasters", aud: "https://oauth2.googleapis.com/token", iat: now, exp: now + 3600 })}`;
  const sig = createSign("RSA-SHA256").update(unsigned).sign(sa.private_key, "base64url");
  const res = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer", assertion: `${unsigned}.${sig}` }),
  });
  const j = (await res.json()) as { access_token?: string; error_description?: string };
  if (!j.access_token) throw new Error(`Google token refused: ${j.error_description || res.status}`);
  return j.access_token;
}

async function google() {
  const raw = process.env.GSC_SERVICE_ACCOUNT;
  if (!raw) { console.log("::notice::Google: GSC_SERVICE_ACCOUNT is not set; sitemap not submitted (Google still re-reads it on its own)."); return; }
  const token = await googleToken(JSON.parse(raw));
  const url = `https://www.googleapis.com/webmasters/v3/sites/${encodeURIComponent(PROPERTY)}/sitemaps/${encodeURIComponent(SITEMAP)}`;
  const put = await fetch(url, { method: "PUT", headers: { authorization: `Bearer ${token}` } });
  if (!put.ok) {
    problems++;
    // 403: the service account isn't a user of the property (Search Console → Settings → Users and permissions).
    console.log(`::error::Google: submit failed, HTTP ${put.status}: ${(await put.text()).slice(0, 300)}`);
    return;
  }
  console.log("Google: sitemap submitted");
  const info = (await (await fetch(url, { headers: { authorization: `Bearer ${token}` } })).json()) as {
    lastSubmitted?: string; lastDownloaded?: string; isPending?: boolean; errors?: string; warnings?: string; contents?: { type: string; submitted: string; indexed?: string }[];
  };
  console.log(`Google: last read ${info.lastDownloaded ?? "never"}, pending ${info.isPending ?? false}, ${info.errors ?? 0} errors, ${info.warnings ?? 0} warnings, ${(info.contents || []).map((c) => `${c.submitted} ${c.type}`).join(", ") || "no counts yet"}`);
  if (Number(info.errors) > 0) { problems++; console.log("::warning::Google reports sitemap errors: see Search Console → Sitemaps."); }
}

function readSentLog(): SentLog {
  try {
    const raw = JSON.parse(readFileSync(SENT_LOG, "utf8")) as Record<string, unknown>;
    return Object.fromEntries(Object.entries(raw).filter((e): e is [string, number] => typeof e[1] === "number"));
  } catch { return {}; } // first run, or the cache expired: nothing to skip
}
function writeSentLog(log: SentLog) {
  mkdirSync(dirname(SENT_LOG), { recursive: true });
  writeFileSync(SENT_LOG, JSON.stringify(log));
}

async function indexNow() {
  // The sitemap is an index of one sitemap per page type: read every child.
  const index = await (await fetch(SITEMAP, { signal: AbortSignal.timeout(60_000) })).text();
  const children = [...index.matchAll(/<sitemap><loc>([^<]+)<\/loc>/g)].map(([, loc]) => loc);
  const xml = children.length ? (await Promise.all(children.map((u) => fetch(u, { signal: AbortSignal.timeout(60_000) }).then((r) => r.text())))).join("\n") : index;
  const changed = [...new Set(changedEntries(xml, Date.now() - LOOKBACK_HOURS * 3600_000))];
  let log = recordSent(readSentLog(), [], Date.now()); // drops entries past the window
  const fresh = freshUrls(changed, log, Date.now());
  const groups = chunk(fresh, CHUNK_SIZE).slice(0, MAX_CHUNKS);
  console.log(`IndexNow: ${changed.length} changed in ${LOOKBACK_HOURS} h, ${changed.length - fresh.length} already sent, ${fresh.length} to send`);
  let sent = 0;
  for (const [i, urls] of groups.entries()) {
    if (i) await sleep(GAP_SECONDS * 1000);
    const status = await submitIndexNow(urls);
    if (status !== 200 && status !== 202) { problems++; console.log(`::warning::IndexNow: HTTP ${status} on group ${i + 1}; the rest wait for the next run`); break; }
    log = recordSent(log, urls, Date.now());
    writeSentLog(log); // after every group, so a run cut short still remembers what went
    sent += urls.length;
    console.log(`IndexNow: group ${i + 1}/${groups.length}, ${urls.length} URLs sent (HTTP ${status})`);
  }
  writeSentLog(log);
  if (fresh.length > sent) console.log(`IndexNow: ${fresh.length - sent} URLs left for the next run`);
}

await google().catch((e) => { problems++; console.log(`::error::Google: ${(e as Error).message}`); });
await indexNow().catch((e) => { problems++; console.log(`::warning::IndexNow: ${(e as Error).message}`); });
if (problems) process.exitCode = 1;
