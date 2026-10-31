// Loads the most important pages once after a deploy, so the first real visitor (often Googlebot) gets a cached
// page instead of a 5-40 s render on Render's free tier. Order: pages Google already shows most (data/warm-priority.json,
// from a Search Console export), then today's and the coming days' birthday pages, then the sitemap by priority.
// One page at a time with a GAP-second pause: most pages read monthly snapshots now, so AniList's ~30/minute
// limit is rarely touched.
// Usage: node scripts/warm-cache.mjs [baseUrl]   (env: LIMIT=500 GAP=3)
import { readFileSync } from "node:fs";

const base = (process.argv[2] || "https://anilumi.in").replace(/\/$/, "");
const LIMIT = Number(process.env.LIMIT) || 500;
const GAP = (Number(process.env.GAP) || 3) * 1000;
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

const xml = await (await fetch(`${base}/sitemap.xml`)).text();
const bySitemap = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)]
  .map(([, u]) => ({ loc: u.match(/<loc>([^<]+)<\/loc>/)?.[1], p: Number(u.match(/<priority>([^<]+)<\/priority>/)?.[1] || 0.5) }))
  .filter((u) => u.loc)
  .sort((a, b) => b.p - a.p)
  .map((u) => u.loc.replace(base, "") || "/");
const urls = [...new Set(["/", "/birthdays", ...days, ...priority, ...bySitemap])].slice(0, LIMIT).map((p) => base + p);

async function warm(loc) {
  const t = Date.now();
  const res = await fetch(loc, { headers: { "User-Agent": "AniLumi cache warmer" }, signal: AbortSignal.timeout(90000) }).catch(() => null);
  const cache = res?.headers.get("x-nextjs-cache") || "-";
  console.log(`${res?.status ?? "ERR"} ${cache.padEnd(5)} ${String(Date.now() - t).padStart(5)} ms  ${loc.replace(base, "")}`);
  await sleep(cache === "HIT" ? 300 : GAP); // already cached: no render, no upstream calls
  return Boolean(res?.ok) || res?.status === 404; // a 404 is a real answer, not a warm-up failure
}

const retry = [];
for (const loc of urls) if (!(await warm(loc))) retry.push(loc);
// Pages that error on purpose when AniList is rate-limited (season previews) usually work a minute later.
if (retry.length) {
  console.log(`\nretrying ${retry.length} after a pause`);
  await sleep(60000);
  for (let i = retry.length - 1; i >= 0; i--) if (await warm(retry[i])) retry.splice(i, 1);
}
console.log(`\nwarmed ${urls.length - retry.length}, failed ${retry.length} of ${urls.length}`);
