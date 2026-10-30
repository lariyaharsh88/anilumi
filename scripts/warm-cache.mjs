// Loads the most important pages once after a deploy, so the first real visitor (often Googlebot) gets a cached
// page instead of a 2-7 s render. Paced at one page every GAP seconds: anime pages still make a few AniList calls,
// and AniList allows ~30 a minute, so warming faster would cache pages with missing data.
// Usage: node scripts/warm-cache.mjs [baseUrl]   (env: LIMIT=120 GAP=10)
const base = (process.argv[2] || "https://anilumi.in").replace(/\/$/, "");
const LIMIT = Number(process.env.LIMIT) || 120;
const GAP = (Number(process.env.GAP) || 10) * 1000;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const xml = await (await fetch(`${base}/sitemap.xml`)).text();
const urls = [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)]
  .map(([, u]) => ({ loc: u.match(/<loc>([^<]+)<\/loc>/)?.[1], p: Number(u.match(/<priority>([^<]+)<\/priority>/)?.[1] || 0.5) }))
  .filter((u) => u.loc)
  .sort((a, b) => b.p - a.p)
  .slice(0, LIMIT);

async function warm(loc) {
  const t = Date.now();
  const res = await fetch(loc, { headers: { "User-Agent": "AniLumi cache warmer" } }).catch(() => null);
  const cache = res?.headers.get("x-nextjs-cache") || "-";
  console.log(`${res?.status ?? "ERR"} ${cache.padEnd(5)} ${String(Date.now() - t).padStart(5)} ms  ${loc.replace(base, "")}`);
  await sleep(cache === "HIT" ? 500 : GAP); // already cached: no render, no upstream calls
  return Boolean(res?.ok);
}

const retry = [];
for (const { loc } of urls) if (!(await warm(loc))) retry.push(loc);
// Pages that error on purpose when AniList is rate-limited (season previews) usually work a minute later.
if (retry.length) {
  console.log(`\nretrying ${retry.length} after a pause`);
  await sleep(60000);
  for (let i = retry.length - 1; i >= 0; i--) if (await warm(retry[i])) retry.splice(i, 1);
}
console.log(`\nwarmed ${urls.length - retry.length}, failed ${retry.length} of ${urls.length}`);
