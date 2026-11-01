/**
 * Builds data/franchises.json: the canonical watch-order URL (editorial key, else the first main entry) of each
 * franchise among the most-followed anime, with its entry count, so the sitemap lists one watch-order page per
 * franchise instead of one per season (duplicates split ranking) and skips standalone shows.
 * Runs monthly in .github/workflows/refresh-data.yml after the search aliases; by hand:
 * npx tsx scripts/fetch-franchises.mts   (TOP=1500)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { listAnime, buildWatchOrder, getRelations, watchOrderSlug, franchiseName, type Anime, type Relation } from "../lib/kitsu";

const TOP = Number(process.env.TOP) || 1500;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const aliases = JSON.parse(readFileSync(new URL("../data/aliases.json", import.meta.url), "utf8")) as { anime: { i: string }[] };
const ids = [...new Set(aliases.anime.map((a) => a.i))].slice(0, TOP);

// Full Anime records, 20 per request.
const anime: Anime[] = [];
for (let i = 0; i < ids.length; i += 20) {
  const page = await listAnime({ filter: { id: ids.slice(i, i + 20).join(",") }, limit: 20 }).catch(() => ({ items: [] as Anime[] }));
  anime.push(...page.items);
  await sleep(250);
}
const rank = new Map(ids.map((id, i) => [id, i]));
anime.sort((a, b) => (rank.get(a.id) ?? 1e9) - (rank.get(b.id) ?? 1e9));

// One relations lookup per title across every franchise walk.
const relCache = new Map<string, Promise<Relation[]>>();
const relations = (id: string) => {
  if (!relCache.has(id)) relCache.set(id, sleep(150).then(() => getRelations(id)).catch(() => []));
  return relCache.get(id)!;
};

type Row = { s: string; t: string; n: number; u: number };
const bySlug = new Map<string, Row>();
const seen = new Set<string>(); // titles already placed in a franchise
let done = 0;
for (const a of anime) {
  done++;
  if (seen.has(a.id)) continue;
  try {
    const wo = await buildWatchOrder(a, relations);
    for (const e of wo.entries) seen.add(e.anime.id);
    const s = watchOrderSlug(wo);
    const users = Math.max(...wo.entries.map((e) => e.anime.userCount || 0));
    const prev = bySlug.get(s);
    if (!prev || prev.u < users) bySlug.set(s, { s, t: franchiseName(wo), n: wo.entries.length, u: users });
  } catch (e) {
    console.warn(`${a.slug}: ${(e as Error).message}`);
  }
  if (done % 50 === 0) process.stdout.write(`franchises ${bySlug.size} from ${done}/${anime.length} titles\r`);
}

const franchises = [...bySlug.values()].sort((x, y) => y.u - x.u);
writeFileSync(new URL("../data/franchises.json", import.meta.url), JSON.stringify({ generated: new Date().toISOString().slice(0, 10), franchises }));
console.log(`\nwrote ${franchises.length} franchises (${franchises.filter((f) => f.n > 1).length} with more than one entry), ${relCache.size} relation lookups`);
