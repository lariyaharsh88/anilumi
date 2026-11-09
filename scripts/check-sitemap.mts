/**
 * Checks every URL in the sitemap the way a crawler sees it: HTTP 200 without a redirect, no noindex (meta tag or
 * X-Robots-Tag), and a canonical pointing at the URL itself. Prints the failures by kind; exits 1 if any.
 * Weekly in .github/workflows/sitemap.yml, and by hand:
 *   npx tsx scripts/check-sitemap.mts [base]     (base defaults to https://anilumi.in; e.g. http://localhost:3141)
 */
const base = (process.argv[2] || "https://anilumi.in").replace(/\/$/, "");
const CONC = Number(process.env.CONC) || 6;
const UA = "Mozilla/5.0 (compatible; AniLumi sitemap check; +https://anilumi.in/how-we-check)";
const local = (u: string) => base + new URL(u).pathname + new URL(u).search;

const index = await (await fetch(`${base}/sitemap.xml`)).text();
const children = [...index.matchAll(/<sitemap><loc>([^<]+)<\/loc>/g)].map(([, loc]) => loc);
if (!children.length) { console.log("::error::/sitemap.xml has no child sitemaps"); process.exit(1); }
const urls: string[] = [];
for (const c of children) {
  const xml = await (await fetch(local(c))).text();
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map(([, u]) => u.replace(/&amp;/g, "&"));
  console.log(`${new URL(c).pathname}: ${locs.length} URLs`);
  urls.push(...locs);
}
const dupes = urls.length - new Set(urls).size;
const problems: Record<string, string[]> = {};
const fail = (kind: string, u: string) => (problems[kind] ??= []).push(u);
if (dupes) problems["listed twice"] = [`${dupes} duplicate URLs`];

let next = 0;
await Promise.all(Array.from({ length: CONC }, async () => {
  while (next < urls.length) {
    const u = urls[next++];
    const res = await fetch(local(u), { redirect: "manual", headers: { "user-agent": UA }, signal: AbortSignal.timeout(90_000) }).catch(() => null);
    if (!res) { fail("no answer", u); continue; }
    if (res.status >= 300 && res.status < 400) { fail(`redirects (${res.status})`, u); continue; }
    if (res.status !== 200) { fail(`HTTP ${res.status}`, u); continue; }
    const xr = res.headers.get("x-robots-tag") || "";
    const type = res.headers.get("content-type") || "";
    if (/noindex/i.test(xr)) fail("noindex header", u);
    if (!type.includes("html")) continue; // feeds and images have no meta tags
    const html = await res.text();
    if (/<meta name="robots" content="[^"]*noindex/i.test(html)) fail("noindex tag", u);
    const canon = html.match(/<link rel="canonical" href="([^"]+)"/)?.[1];
    if (!canon) fail("no canonical", u);
    else if (new URL(canon, u).href.replace(/\/$/, "") !== u.replace(/\/$/, "")) fail("canonical elsewhere", `${u} -> ${canon}`);
  }
}));

const kinds = Object.keys(problems);
console.log(`\n${urls.length} URLs checked: ${kinds.length ? kinds.map((k) => `${problems[k].length} ${k}`).join(", ") : "all OK"}`);
for (const k of kinds) { console.log(`\n${k}:`); for (const u of problems[k].slice(0, 40)) console.log(`  ${u}`); }
if (kinds.length) process.exitCode = 1;
