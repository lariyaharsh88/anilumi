/**
 * Airing snapshot: every airing anime with AniList's exact air times for its next few episodes, refreshed every
 * 3 hours by .github/workflows/airing.yml into the `airing-data` branch and read here at runtime (cached 30 min).
 * AniList rate-limits Render, so live calls failed exactly when "episode N release date" pages needed them.
 * Fails soft: an unreachable or stale (> 12 h) snapshot reads as empty and callers use live AniList.
 */
export const AIRING_URL = "https://raw.githubusercontent.com/lariyaharsh88/anilumi/airing-data/airing.json";
const STALE_MS = 12 * 3600_000;

/** a: AniList id · k/s: Kitsu id/slug · t: title · p: popularity · e: total episodes · n: [episode, unix seconds][] · d: start date */
export type AiringShow = { a: number; k: string | null; s: string | null; t: string; p: number; e: number | null; n: [number, number][]; d: string | null };
type Snap = { generated: string; shows: AiringShow[] };
type Index = { shows: AiringShow[]; byAniList: Map<number, AiringShow>; byKitsu: Map<string, AiringShow> };

const EMPTY: Index = { shows: [], byAniList: new Map(), byKitsu: new Map() };
let memo: { at: number; v: Index } | null = null;

/** Index the snapshot, or EMPTY when it's missing or older than 12 hours. Pure. */
export function indexAiring(snap: Partial<Snap> | null, now = Date.now()): Index {
  if (!snap?.shows || !snap.generated || now - new Date(snap.generated).getTime() > STALE_MS) return EMPTY;
  return {
    shows: snap.shows,
    byAniList: new Map(snap.shows.map((x) => [x.a, x])),
    byKitsu: new Map(snap.shows.filter((x) => x.k).map((x) => [x.k!, x])),
  };
}

export async function airing(): Promise<Index> {
  if (memo && Date.now() - memo.at < 10 * 60_000) return memo.v;
  const snap = await fetch(AIRING_URL, { next: { revalidate: 1800 }, signal: AbortSignal.timeout(5000) })
    .then((r) => (r.ok ? (r.json() as Promise<Snap>) : null))
    .catch(() => null);
  const v = indexAiring(snap);
  memo = { at: Date.now(), v };
  return v;
}

/** Episodes still to air, soonest first (past times dropped). Pure. */
export const upcomingOf = (show: AiringShow | undefined, now = Date.now()): { episode: number; at: string }[] =>
  (show?.n || []).filter(([, t]) => t * 1000 > now).map(([episode, t]) => ({ episode, at: new Date(t * 1000).toISOString() }));
