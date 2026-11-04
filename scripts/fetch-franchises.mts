/**
 * Builds data/franchises.json: the canonical watch-order URL (editorial key, else the first main entry) of each
 * franchise among the most-followed anime, with its entry count, so the sitemap lists one watch-order page per
 * franchise instead of one per season (duplicates split ranking) and skips standalone shows. Also writes
 * data/watch-order-snap.json: each multi-entry franchise's full order (compact), so an anime page's watch-order card
 * is complete even when the live walk (one Kitsu call per season) misses its time budget (lib/wosnap.ts).
 * Runs monthly in .github/workflows/refresh-data.yml after the search aliases; by hand:
 * npx tsx scripts/fetch-franchises.mts   (TOP=1500)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { listAnime, buildWatchOrder, getRelations, watchOrderSlug, franchiseName, type Anime, type Relation, type WatchOrder } from "../lib/kitsu";
import type { SnapRow } from "../lib/wosnap";

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
const orders = new Map<string, WatchOrder>(); // franchise slug → its full order, for the snapshot
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
    if (!prev || prev.u < users) {
      bySlug.set(s, { s, t: franchiseName(wo), n: wo.entries.length, u: users });
      if (wo.entries.length > 1) orders.set(s, wo);
    }
  } catch (e) {
    console.warn(`${a.slug}: ${(e as Error).message}`);
  }
  if (done % 50 === 0) process.stdout.write(`franchises ${bySlug.size} from ${done}/${anime.length} titles\r`);
}

const franchises = [...bySlug.values()].sort((x, y) => y.u - x.u);
writeFileSync(new URL("../data/franchises.json", import.meta.url), JSON.stringify({ generated: new Date().toISOString().slice(0, 10), franchises }));
console.log(`\nwrote ${franchises.length} franchises (${franchises.filter((f) => f.n > 1).length} with more than one entry), ${relCache.size} relation lookups`);

// Compact orders: one row per entry, and every entry's id → its franchise, so any season's page finds the order.
const snapOrders: { m: number; e: SnapRow[] }[] = [];
const idx: Record<string, number> = {};
for (const wo of orders.values()) {
  const i = snapOrders.length;
  snapOrders.push({ m: wo.totalMinutes, e: wo.entries.map((x) => [x.anime.id, x.anime.slug, x.anime.title, x.anime.subtype ?? null, x.anime.startDate ?? null, x.anime.episodeCount ?? null, x.kind, x.attachedTo ?? ""]) });
  for (const x of wo.entries) idx[x.anime.id] ??= i;
}
writeFileSync(new URL("../data/watch-order-snap.json", import.meta.url), JSON.stringify({ generated: new Date().toISOString().slice(0, 10), orders: snapOrders, idx }));
console.log(`wrote ${snapOrders.length} watch orders (${Object.keys(idx).length} titles) to data/watch-order-snap.json`);
