/**
 * Which templated pages ask Google to index them. Thin or near-duplicate pages (old episode recaps, minor
 * characters) stay on the site for visitors and keep passing links ("noindex, follow"), but stay out of the
 * index and the sitemap, so the site isn't judged by its weakest pages. Pages Search Console already shows
 * (data/warm-priority.json) always stay indexed. Pure.
 */
import priority from "@/data/warm-priority.json";
import franchiseData from "@/data/franchises.json";
import aliasData from "@/data/aliases.json";
import { WATCH_ORDER_OVERRIDES } from "@/data/watch-orders";
import { topCharacterSlugs } from "./charsnap";

/** Most-favourited characters (AniList) whose pages are indexed. */
export const INDEXED_CHARACTERS = 300;
/** Aired episodes of an airing show that stay indexed, counting back from the latest. */
export const INDEXED_AIRED_EPISODES = 2;
/** A franchise watch order is indexed with an editor guide or at least this many parts ("watch A, then B" is thin). */
export const INDEXED_MIN_PARTS = 3;
/** "Anime like X" pages indexed for the most-followed titles (alias index rank). */
export const INDEXED_SIMILAR = 250;
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

let parts: Map<string, number> | null = null;
/** Entries in a franchise (data/franchises.json), when known. */
export const franchiseParts = (slug: string) => (parts ??= new Map((franchiseData as { franchises: { s: string; n: number }[] }).franchises.map((f) => [f.s, f.n]))).get(slug);

export function watchOrderIndexed(slug: string, liveParts: number): boolean {
  return slug in WATCH_ORDER_OVERRIDES || (franchiseParts(slug) ?? liveParts) >= INDEXED_MIN_PARTS || searchShown(`/watch-order/${slug}`);
}

let topSimilar: Set<string> | null = null;
/** The "anime like X" slugs listed and indexed: the most-followed titles. */
export const similarSlugs = () => [...(topSimilar ??= new Set((aliasData as { anime: { s: string }[] }).anime.slice(0, INDEXED_SIMILAR).map((x) => x.s)))];
export function similarIndexed(slug: string): boolean {
  if (!topSimilar) similarSlugs();
  return topSimilar!.has(slug) || searchShown(`/similar/${slug}`);
}

/** `robots` metadata for a page: undefined (indexable) or noindex, follow. */
export const robotsFor = (indexed: boolean) => (indexed ? undefined : NOINDEX);
