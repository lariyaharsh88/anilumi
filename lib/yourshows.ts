import type { WatchItem } from "./watchlist";

export type NextEp = { href: string; title: string; poster: string | null; episode: number; at: string; behind?: number };
/** Kitsu id → [episode, unix seconds][] from the airing snapshot, for every airing show. */
export type AirTimes = Record<string, [number, number][]>;

/** Episodes stay on the home page strips for 2 hours after they air ("Out now"). */
export const JUST_AIRED_MS = 2 * 3600_000;

/**
 * The visitor's saved airing shows (browser-only list, lib/watchlist.ts) with their next or just-aired episode.
 * Air times come from today's snapshot: the list keeps the date from when the show was saved, which goes stale.
 * Shows the snapshot doesn't cover fall back to that saved date while it's still ahead. Pure.
 */
export function yourShows(list: WatchItem[], times: AirTimes, now: number): NextEp[] {
  return list
    .flatMap((w): NextEp[] => {
      const href = `/anime/${encodeURIComponent(w.slug)}`; // as animePath; lib/kitsu.ts would pull its fetch code into the bundle
      const next = (times[w.id] || []).find(([, t]) => t * 1000 > now - JUST_AIRED_MS);
      if (next) {
        const [episode, t] = next;
        const aired = t * 1000 <= now ? episode : episode - 1;
        const behind = typeof w.progress === "number" && aired > w.progress ? aired - w.progress : undefined;
        return [{ href, title: w.title, poster: w.poster, episode, at: new Date(t * 1000).toISOString(), behind }];
      }
      if (w.status === "current" && w.nextRelease && new Date(w.nextRelease).getTime() > now) {
        return [{ href, title: w.title, poster: w.poster, episode: 0, at: w.nextRelease }];
      }
      return [];
    })
    .sort((a, b) => a.at.localeCompare(b.at));
}
