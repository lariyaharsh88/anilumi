/**
 * Tells search engines about the sitemap, daily and after each deploy (.github/workflows/sitemap.yml).
 *  1. Google: Search Console API, sitemaps.submit for https://anilumi.in/sitemap.xml on the domain property, then
 *     prints what Google reports (last read, errors, warnings, URLs submitted). Needs the repository secret
 *     GSC_SERVICE_ACCOUNT: a Google Cloud service account's JSON key, added as a user of the Search Console
 *     property. Skipped with a notice without it. (Google retired its anonymous sitemap "ping" in 2023.)
 *  2. IndexNow (Bing, Yandex, Seznam, Naver; Bing also feeds DuckDuckGo): the URLs whose sitemap lastmod
 *     changed in the last LOOKBACK_HOURS. No account; the key is the public file /<key>.txt.
 * By hand: GSC_SERVICE_ACCOUNT="$(cat key.json)" npx tsx scripts/submit-sitemap.mts
 */
import { createSign } from "node:crypto";

const SITE = "https://anilumi.in";
const SITEMAP = `${SITE}/sitemap.xml`;
const PROPERTY = "sc-domain:anilumi.in";
const INDEXNOW_KEY = "68544ff79b7f30720459e815497d5462";
const LOOKBACK_HOURS = Number(process.env.LOOKBACK_HOURS) || 26;
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

async function indexNow() {
  const xml = await (await fetch(SITEMAP, { signal: AbortSignal.timeout(60_000) })).text();
  const since = Date.now() - LOOKBACK_HOURS * 3600_000;
  const urls = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)]
    .map(([, u]) => ({ loc: u.match(/<loc>([^<]+)<\/loc>/)?.[1], mod: Date.parse(u.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] || "") }))
    .filter((u) => u.loc && u.mod >= since)
    .map((u) => u.loc!)
    .slice(0, 10_000);
  if (!urls.length) { console.log("IndexNow: nothing changed"); return; }
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: "anilumi.in", key: INDEXNOW_KEY, keyLocation: `${SITE}/${INDEXNOW_KEY}.txt`, urlList: urls }),
  });
  // 200/202: accepted. 403: key file not reachable. 422: URLs don't match the host.
  if (res.status === 200 || res.status === 202) console.log(`IndexNow: ${urls.length} changed URLs sent (HTTP ${res.status})`);
  else { problems++; console.log(`::warning::IndexNow: HTTP ${res.status} ${(await res.text()).slice(0, 200)}`); }
}

await google().catch((e) => { problems++; console.log(`::error::Google: ${(e as Error).message}`); });
await indexNow().catch((e) => { problems++; console.log(`::warning::IndexNow: ${(e as Error).message}`); });
if (problems) process.exitCode = 1;
