/**
 * Which templated pages ask Google to index them. Thin or near-duplicate pages (old episode recaps, minor
 * characters) stay on the site for visitors and keep passing links ("noindex, follow"), but stay out of the
 * index and the sitemap, so the site isn't judged by its weakest pages. Pages Search Console already shows
 * (data/warm-priority.json) always stay indexed. Pure.
 */
import priority from "@/data/warm-priority.json";
import { topCharacterSlugs } from "./charsnap";

/** Most-favourited characters (AniList) whose pages are indexed. */
export const INDEXED_CHARACTERS = 300;
/** Aired episodes of an airing show that stay indexed, counting back from the latest. */
export const INDEXED_AIRED_EPISODES = 2;
/** Upcoming episodes stay indexed this far ahead ("episode 8 release date" is searched a week or two out). */
export const INDEXED_DAYS_AHEAD = 14;

/** True when an upcoming air time is close enough for its episode page to be indexed. */
export const airsSoon = (airIso: string | null, now = Date.now()) => Boolean(airIso) && new Date(airIso!).getTime() - now < INDEXED_DAYS_AHEAD * 86400_000;

const NOINDEX = { index: false, follow: true } as const;

let shown: Set<string> | null = null;
/** Pages Google already shows in search (Search Console export). */
export const searchShown = (path: string) => (shown ??= new Set((priority as { paths: string[] }).paths)).has(path);
export const searchShownPaths = (prefix: string) => (priority as { paths: string[] }).paths.filter((p) => p.startsWith(prefix));

let topChars: Set<string> | null = null;
export function characterIndexed(slug: string): boolean {
  topChars ??= new Set(topCharacterSlugs(INDEXED_CHARACTERS));
  return topChars.has(slug) || searchShown(`/character/${slug}`);
}

/** The next episode, episodes airing within two weeks and the latest aired ones of an airing show; older recaps
 * are mostly the shared synopsis, and pages weeks ahead (or with no date) are only a placeholder. */
export function episodeIndexed(e: { path: string; n: number; upcoming: boolean; next: boolean; airIso: string | null; airing: boolean; lastAired: number }): boolean {
  return (e.upcoming && (e.next || airsSoon(e.airIso))) || (!e.upcoming && e.airing && e.n > e.lastAired - INDEXED_AIRED_EPISODES) || searchShown(e.path);
}

/** `robots` metadata for a page: undefined (indexable) or noindex, follow. */
export const robotsFor = (indexed: boolean) => (indexed ? undefined : NOINDEX);
