/**
 * Monthly snapshot of every multi-entry franchise's watch order (data/watch-order-snap.json, written by
 * scripts/fetch-franchises.mts). The anime page tries the live order first (fresh, but one Kitsu call per season)
 * and falls back to this when the live walk misses its time budget, so the watch-order card never shrinks to
 * just the direct prequel/sequel. Bundled (Workers have no file system); parsed once per isolate. Server code only.
 */
import data from "@/data/watch-order-snap.json";
import type { Anime, WatchEntry, WatchOrder } from "./kitsu";

/** [id, slug, title, subtype, startDate, episodeCount, kind, attachedTo id or ""] */
export type SnapRow = [string, string, string, string | null, string | null, number | null, WatchEntry["kind"], string];
type Snap = { generated: string | null; orders: { m: number; e: SnapRow[] }[]; idx: Record<string, number> };
const snap = data as unknown as Snap;

/** The franchise order containing this anime, with just the fields the watch-order card shows. */
export function snapshotOrder(animeId: string): WatchOrder | null {
  const i = snap.idx?.[animeId];
  const o = i === undefined ? null : snap.orders[i];
  if (!o || o.e.length < 2) return null;
  const entries: WatchEntry[] = o.e.map(([id, slug, title, subtype, startDate, episodeCount, kind, attachedTo]) => ({
    anime: { id, slug, title, subtype, startDate, episodeCount } as unknown as Anime,
    step: 0,
    kind,
    note: "",
    optional: kind !== "main",
    ...(attachedTo ? { attachedTo } : {}),
  }));
  entries.forEach((e, k) => { e.step = k + 1; });
  const mains = entries.filter((e) => e.kind === "main");
  return { root: (mains[0] ?? entries[0]).anime, entries, mainCount: mains.length, totalMinutes: o.m, releaseOrder: [], intro: null };
}

/** Page slugs of every entry in the snapshot order that holds this anime (empty when it has none). */
export function orderSlugs(animeId: string): string[] {
  const i = snap.idx[animeId];
  return i === undefined ? [] : snap.orders[i].e.map((r) => r[1]);
}
