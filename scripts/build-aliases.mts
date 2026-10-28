/**
 * Builds data/aliases.json: alternative titles (synonyms, abbreviations, romaji/English names) for the
 * most popular anime on Kitsu, so search understands "snk", "mha", "jjk" and typos like "one peice".
 * Synonyms come from manami-project/anime-offline-database (ODbL 1.0 / DbCL 1.0; attribution shown on
 * the search page and About page). Re-run occasionally: npx tsx scripts/build-aliases.mts
 */
import { writeFileSync } from "node:fs";

const TOP = Number(process.env.TOP) || 1500;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export const norm = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");

type K = { id: string; slug: string; title: string; names: string[] };
const top: K[] = [];
for (let offset = 0; offset < TOP; offset += 20) {
  const url = `https://kitsu.io/api/edge/anime?sort=-userCount&page[limit]=20&page[offset]=${offset}&filter[ageRating]=G,PG,R&fields[anime]=slug,canonicalTitle,titles,abbreviatedTitles,nsfw`;
  const res = await fetch(url, { headers: { Accept: "application/vnd.api+json" } });
  if (!res.ok) { await sleep(2000); offset -= 20; continue; }
  const j = (await res.json()) as { data: { id: string; attributes: { slug: string; canonicalTitle: string; titles: Record<string, string>; abbreviatedTitles: string[] | null; nsfw: boolean } }[] };
  for (const d of j.data) {
    if (d.attributes.nsfw) continue;
    const t = d.attributes.titles || {};
    top.push({ id: d.id, slug: d.attributes.slug, title: d.attributes.canonicalTitle, names: [d.attributes.canonicalTitle, t.en, t.en_jp, t.en_us, ...(d.attributes.abbreviatedTitles || [])].filter(Boolean) as string[] });
  }
  process.stdout.write(`kitsu ${top.length}\r`);
  await sleep(150);
}

console.log("\ndownloading anime-offline-database…");
const aod = (await (await fetch("https://github.com/manami-project/anime-offline-database/releases/latest/download/anime-offline-database-minified.json")).json()) as { data: { sources: string[]; title: string; synonyms: string[] }[] };
const byKitsu = new Map<string, string[]>();
for (const e of aod.data) {
  const k = e.sources.map((s) => s.match(/kitsu\.(?:app|io)\/anime\/(\d+)/)?.[1]).find(Boolean);
  if (k) byKitsu.set(k, [e.title, ...e.synonyms]);
}

// Latin-script names only (search box input), 2–60 chars, no duplicates after normalisation.
const latin = (s: string) => /^[\x20-\x7EÀ-ɏ‘-”×☆★]+$/.test(s);
const out = top.map((k, rank) => {
  const seen = new Set<string>();
  const n: string[] = [];
  for (const name of [...k.names, ...(byKitsu.get(k.id) || [])]) {
    const key = norm(name);
    if (!latin(name) || key.length < 2 || key.length > 60 || seen.has(key)) continue;
    seen.add(key);
    n.push(key);
  }
  return { i: k.id, s: k.slug, t: k.title, r: rank, n };
});
writeFileSync(new URL("../data/aliases.json", import.meta.url), JSON.stringify({ source: "manami-project/anime-offline-database (ODbL 1.0 / DbCL 1.0) + Kitsu", generated: new Date().toISOString().slice(0, 10), anime: out }));
const withAod = out.filter((o) => byKitsu.has(o.i)).length;
console.log(`wrote ${out.length} anime (${withAod} matched in anime-offline-database), ${out.reduce((n, o) => n + o.n.length, 0)} names`);
