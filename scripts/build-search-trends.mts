/**
 * Rebuilds data/search-trends.json (the "What India searches for" table on /trends) from Google Ads Keyword Planner
 * results saved as JSON ({ ideas: [{ keyword, avg_monthly_searches, monthly_search_volumes }] }), one file or many.
 * Keyword Planner has no free API key, so the files come from a Keyword Planner export or connector run, monthly
 * once Google publishes the previous month (early in the month).
 *
 *   node --import tsx scripts/build-search-trends.mts ideas-1.json ideas-2.json
 *
 * TOPICS is the table: each search, the label people see and the page that answers it. A search missing from the
 * files is left out, so seed Keyword Planner with these keywords.
 */
import { readFile, writeFile } from "node:fs/promises";

const TOPICS: [q: string, label: string, href: string][] = [
  ["anime hindi dubbed", "Anime in Hindi", "/hindi-dub"],
  ["naruto shippuden filler list", "Naruto Shippuden filler list", "/anime/naruto-shippuden/filler-list"],
  ["one piece filler list", "One Piece filler list", "/anime/one-piece/filler-list"],
  ["bleach filler list", "Bleach filler list", "/anime/bleach/filler-list"],
  ["new one piece episode", "New One Piece episode", "/anime/one-piece/next-season"],
  ["demon slayer season 5 release date", "Demon Slayer next season", "/anime/kimetsu-no-yaiba/next-season"],
  ["haikyuu season 5 release date", "Haikyuu next season", "/anime/haikyuu/next-season"],
  ["chainsaw man season 2 release date", "Chainsaw Man season 2", "/anime/chainsaw-man/next-season"],
  ["dragon ball watch order", "Dragon Ball watch order", "/watch-order/dragon-ball"],
  ["naruto watch order", "Naruto watch order", "/watch-order/naruto"],
  ["bleach watch order", "Bleach watch order", "/watch-order/bleach"],
  ["crunchyroll subscription price india", "Crunchyroll price in India", "/crunchyroll-price-india"],
  ["one punch man season 3 release date", "One Punch Man season 3", "/anime/one-punch-man/next-season"],
  ["highschool dxd season 5", "HighSchool DxD season 5", "/anime/high-school-dxd/next-season"],
  ["naruto shippuden hindi dubbed", "Naruto Shippuden in Hindi", "/anime/naruto/hindi-dub"],
  ["anime movies in hindi", "Anime movies in Hindi", "/hindi-dub/movies"],
  ["boruto filler list", "Boruto filler list", "/anime/boruto-naruto-next-generations/filler-list"],
];

type Idea = { keyword: string; avg_monthly_searches: number; monthly_search_volumes?: { year: number; month: string; monthly_searches: number }[] };
const files = process.argv.slice(2);
if (!files.length) throw new Error("Pass one or more Keyword Planner JSON files.");
const ideas = new Map<string, Idea>();
for (const f of files) for (const x of (JSON.parse(await readFile(f, "utf8")) as { ideas: Idea[] }).ideas) ideas.set(x.keyword, x);

const rows = TOPICS.flatMap(([q, label, href]) => {
  const x = ideas.get(q);
  const v = x?.monthly_search_volumes ?? [];
  if (!x || v.length < 2) { console.warn(`missing: ${q}`); return []; }
  return [{ q, label, href, avg: x.avg_monthly_searches, latest: v[v.length - 1].monthly_searches, yearAgo: v[0].monthly_searches }];
});
const span = ideas.get(rows[0]?.q ?? "")?.monthly_search_volumes ?? [];
if (!rows.length) throw new Error("None of the topics were in the files.");
const month = (m: { year: number; month: string }) => `${m.month.charAt(0)}${m.month.slice(1).toLowerCase()} ${m.year}`;
const out = {
  checked: new Date().toISOString().slice(0, 10),
  from: month(span[0]), to: month(span[span.length - 1]),
  source: "Google Ads Keyword Planner, India, all languages",
  rows: rows.sort((a, b) => b.latest - a.latest),
};
await writeFile("data/search-trends.json", JSON.stringify(out, null, 2) + "\n");
console.log(`data/search-trends.json: ${out.rows.length} searches, ${out.from} → ${out.to}`);
