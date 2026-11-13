// Builds every page before real visitors or Google ask for it: loads the whole sitemap through anilumi.in (the edge
// cache and the Workers app), so each page is rendered once and stored (edge cache, saved copy, app page cache).
// Order: pages Google already shows most (data/warm-priority.json, from a Search Console export), today's and the
// coming days' birthday pages, then the sitemap by priority. CONC pages at a time; a page that was already cached
// costs no render, so a full pass over a warm site takes minutes. Runs from .github/workflows/warm-cache.yml.
// SCOPE=top (the 6-hourly pass) stops after those first pages: warming the whole long tail every 6 hours re-rendered
// ~2,000 pages nobody had asked for each time their cache expired, which cost more Worker CPU than visitors did.
// A full pass (SCOPE=all) runs after each release, when every page's cache starts empty.
// Usage: node scripts/warm-cache.mjs [baseUrl]   (env: SCOPE=all|top LIMIT=all CONC=3 GAP=1)
import { readFileSync } from "node:fs";

const base = (process.argv[2] || "https://anilumi.in").replace(/\/$/, "");
const LIMIT = Number(process.env.LIMIT) || Infinity;
const CONC = Number(process.env.CONC) || 3;
const GAP = (Number(process.env.GAP) || 1) * 1000;
const TOP_ONLY = process.env.SCOPE === "top";
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

let priority = [];
try {
  priority = JSON.parse(readFileSync(new URL("../data/warm-priority.json", import.meta.url), "utf8")).paths;
} catch { /* no list: sitemap order only */ }

// Birthday pages for today and the next 3 days in Japan: "october 31 anime birthdays" is searched on the day.
const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
const days = Array.from({ length: 4 }, (_, i) => {
  const p = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric" }).formatToParts(new Date(Date.now() + i * 86400000));
  const m = Number(p.find((x) => x.type === "month").value), d = Number(p.find((x) => x.type === "day").value);
  return `/birthdays/${MONTHS[m - 1]}/${d}`;
});

// /sitemap.xml is an index of one sitemap per page type: read each child.
const index = await (await fetch(`${base}/sitemap.xml`)).text();
const children = [...index.matchAll(/<sitemap><loc>([^<]+)<\/loc>/g)].map(([, loc]) => base + new URL(loc).pathname);
const xml = children.length ? (await Promise.all(children.map((u) => fetch(u).then((r) => r.text())))).join("\n") : index;
const bySitemap = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)]
  .map(([, u]) => ({ loc: u.match(/<loc>([^<]+)<\/loc>/)?.[1], p: Number(u.match(/<priority>([^<]+)<\/priority>/)?.[1] || 0.5) }))
  .filter((u) => u.loc)
  .sort((a, b) => b.p - a.p)
  .map((u) => { const x = new URL(u.loc); return x.pathname + x.search; }); // sitemap lists anilumi.in; base may be the origin
const urls = [...new Set(["/", "/birthdays", ...days, ...priority, ...(TOP_ONLY ? [] : bySitemap)])].slice(0, LIMIT).map((p) => base + p);

const tally = { cached: 0, built: 0, failed: 0 };
const slow = [];
async function warm(loc) {
  const t = Date.now();
  const res = await fetch(loc, { headers: { "User-Agent": "AniLumi cache warmer" }, signal: AbortSignal.timeout(90000) }).catch(() => null);
  await res?.arrayBuffer().catch(() => null);
  const ms = Date.now() - t;
  const hit = /HIT|STALE/.test(`${res?.headers.get("x-edge-cache") || ""} ${res?.headers.get("x-opennext-cache") || ""}`);
  const ok = Boolean(res?.ok) || res?.status === 404; // a 404 is a real answer, not a warm-up failure
  if (!ok) tally.failed++;
  else if (hit) tally.cached++;
  else { tally.built++; if (ms > 5000) slow.push(`${ms} ms ${loc.replace(base, "")}`); }
  if (!ok || !hit) console.log(`${res?.status ?? "ERR"} ${hit ? "cached" : "built "} ${String(ms).padStart(6)} ms  ${loc.replace(base, "")}`);
  if (!hit) await sleep(GAP); // a fresh render called upstream APIs: give them a breather
  return ok;
}

/** Run the list CONC at a time; returns the URLs that failed. */
async function pass(list) {
  const failed = [];
  let next = 0;
  await Promise.all(Array.from({ length: CONC }, async () => {
    while (next < list.length) {
      const loc = list[next++];
      if (!(await warm(loc))) failed.push(loc);
    }
  }));
  return failed;
}

const started = Date.now();
let retry = await pass(urls);
// Pages whose data is still being fetched in the background (AniList queue) usually work a few minutes later.
if (retry.length) {
  console.log(`\nretrying ${retry.length} after a pause`);
  await sleep(120000);
  tally.failed -= retry.length;
  retry = await pass(retry);
}
console.log(`\n${urls.length} pages in ${Math.round((Date.now() - started) / 60000)} min: ${tally.cached} already cached, ${tally.built} built now, ${retry.length} failed`);
if (slow.length) console.log(`slowest builds:\n  ${slow.sort((a, b) => parseInt(b) - parseInt(a)).slice(0, 15).join("\n  ")}`);
