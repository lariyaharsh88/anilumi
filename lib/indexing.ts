/**
 * Which templated pages ask Google to index them. Thin or near-duplicate pages (old episode recaps, minor
 * characters) stay on the site for visitors and keep passing links ("noindex, follow"), but stay out of the
 * index and the sitemap, so the site isn't judged by its weakest pages. Pages Search Console already shows
 * (data/warm-priority.json) always stay indexed. Pure.
 */
import priority from "@/data/warm-priority.json";
import franchiseData from "@/data/franchises.json";
import { WATCH_ORDER_OVERRIDES } from "@/data/watch-orders";
import { topCharacterSlugs } from "./charsnap";
import { snapshotCore } from "./wosnap";

/** Most-favourited characters (AniList) whose pages are indexed. */
export const INDEXED_CHARACTERS = 300;
/** Aired episodes of an airing show that stay indexed, counting back from the latest. */
export const INDEXED_AIRED_EPISODES = 2;
/** A franchise watch order is indexed with an editor guide or at least this many parts ("watch A, then B" is thin). */
export const INDEXED_MIN_PARTS = 3;
/** "Next season" pages with no sequel news stay indexed for titles at least this followed (people search
 * "<popular show> season 2" whatever the answer; for obscure titles "not announced" is a thin page). */
export const NEXT_SEASON_MIN_MEMBERS = 100_000;
/** Upcoming episodes stay indexed this far ahead ("episode 8 release date" is searched a week or two out). */
export const INDEXED_DAYS_AHEAD = 14;

/** True when an upcoming air time is close enough for its episode page to be indexed. */
export const airsSoon = (airIso: string | null, now = Date.now()) => Boolean(airIso) && new Date(airIso!).getTime() - now < INDEXED_DAYS_AHEAD * 86400_000;

const NOINDEX = { index: false, follow: true } as const;

// `shown`: pages with impressions in the latest Search Console export. `paths` is the warm-up order, which also
// lists pages Google is re-checking; older files have only `paths`.
const shownList = () => (priority as { paths: string[]; shown?: string[] }).shown ?? (priority as { paths: string[] }).paths;
let shown: Set<string> | null = null;
/** Pages Google already shows in search (Search Console export). */
export const searchShown = (path: string) => (shown ??= new Set(shownList())).has(path);
export const searchShownPaths = (prefix: string) => shownList().filter((p) => p.startsWith(prefix));

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

/**
 * A watch order is worth indexing with an editor guide, or with at least INDEXED_MIN_PARTS entries of which two are
 * core (seasons or canon films): one season plus recaps and OVAs leaves nothing to order.
 */
export function watchOrderIndexed(slug: string, liveParts: number, liveCore?: number): boolean {
  if (slug in WATCH_ORDER_OVERRIDES || searchShown(`/watch-order/${slug}`)) return true;
  const core = liveCore ?? snapshotCore(slug);
  return (franchiseParts(slug) ?? liveParts) >= INDEXED_MIN_PARTS && (core === undefined || core >= 2);
}

/** "Anime like X" lists are generated, so only the ones search already shows are listed and indexed. */
export const similarSlugs = () => searchShownPaths("/similar/").map((p) => p.slice("/similar/".length));
export const similarIndexed = (slug: string) => searchShown(`/similar/${slug}`);

/** Character tables repeat what the character pages say: indexed only where search already shows them. */
export const characterTableIndexed = (slug: string) => searchShown(`/anime/${slug}/characters`);

/** "Next season" pages: indexed when there's news, or the title is popular enough that people ask anyway. */
export const nextSeasonIndexed = (path: string, hasNews: boolean, members: number) => hasNews || members >= NEXT_SEASON_MIN_MEMBERS || searchShown(path);

/** `robots` metadata for a page: undefined (indexable) or noindex, follow. */
export const robotsFor = (indexed: boolean) => (indexed ? undefined : NOINDEX);
