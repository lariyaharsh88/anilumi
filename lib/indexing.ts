/**
 * Which templated pages ask Google to index them. Thin or near-duplicate pages (old episode recaps, minor
 * characters) stay on the site for visitors and keep passing links ("noindex, follow"), but stay out of the
 * index and the sitemap, so the site isn't judged by its weakest pages. Pages Search Console still shows
 * (data/warm-priority.json) always stay indexed. Pure.
 *
 * 15 Nov 2026: Google showed the site ~15,000 times a day 28–31 Oct, then dropped it to ~20 a day from 1 Nov and left
 * 2,297 crawled pages unindexed, mostly templated sub-pages (character, episode list, next season, cast, how long).
 * The bars below were raised so the index is the few hundred pages with something of our own; `shown` is now pages
 * Google still shows after the drop, not every page it tried during the first week.
 */
import priority from "@/data/warm-priority.json";
import franchiseData from "@/data/franchises.json";
import { WATCH_ORDER_OVERRIDES } from "@/data/watch-orders";
import { snapshotCore } from "./wosnap";
import notes from "@/data/character-notes.json";
import vaNotes from "@/data/va-notes.json";
import { hindiDubPath, topHindiDub } from "./hindidub";

/** Aired episodes of an airing show that stay indexed, counting back from the latest: just the newest. Older
 * episode pages are the shared synopsis plus a date, which every database has. */
export const INDEXED_AIRED_EPISODES = 1;
/** A franchise watch order is indexed with an editor guide or at least this many parts ("watch A, then B" is thin). */
export const INDEXED_MIN_PARTS = 3;
/** Upcoming episodes stay indexed this far ahead ("episode 8 release date" is searched a week or two out). */
export const INDEXED_DAYS_AHEAD = 14;

/** True when an upcoming air time is close enough for its episode page to be indexed. */
export const airsSoon = (airIso: string | null, now = Date.now()) => Boolean(airIso) && new Date(airIso!).getTime() - now < INDEXED_DAYS_AHEAD * 86400_000;

const NOINDEX = { index: false, follow: true } as const;
/**
 * The robots rules for an indexed page: the root layout's own, repeated on every indexed page. A page that set
 * `robots: undefined` dropped the layout's tag altogether (Next.js replaces the key, it doesn't merge), so most
 * indexed pages went out without max-image-preview:large, which Google needs for large images in Discover.
 */
export const INDEX = { index: true, follow: true, googleBot: { index: true, follow: true, "max-image-preview": "large", "max-snippet": -1, "max-video-preview": -1 } } as const;

// `shown`: pages with impressions in the latest Search Console export. `paths` is the warm-up order, which also
// lists pages Google is re-checking; older files have only `paths`.
const shownList = () => (priority as { paths: string[]; shown?: string[] }).shown ?? (priority as { paths: string[] }).paths;
let shown: Set<string> | null = null;
/** Pages Google already shows in search (Search Console export). */
export const searchShown = (path: string) => (shown ??= new Set(shownList())).has(path);
export const searchShownPaths = (prefix: string) => shownList().filter((p) => p.startsWith(prefix));

/** Characters with verified notes (data/character-notes.json): role, debut, arcs, family. */
export const notedCharacters = () => Object.keys((notes as { characters: Record<string, unknown> }).characters);
let noted: Set<string> | null = null;
/**
 * A character page is indexed when it has verified notes or search already shows it. Pages with only the shared
 * AniList facts and a quoted bio (what every database has) stay for visitors, noindexed.
 */
export function characterIndexed(slug: string): boolean {
  noted ??= new Set(notedCharacters());
  return noted.has(slug) || searchShown(`/character/${slug}`);
}

/** Voice actors: the most-favourited (people search them by name) and any search already shows. */
export const INDEXED_VOICE_ACTORS = 20;
/** Voice actors with verified notes (data/va-notes.json): debut, awards, agency, signature roles. */
const vaNoted = new Set(Object.keys((vaNotes as { people: Record<string, unknown> }).people));
export const voiceActorIndexed = (path: string, rank: number | null) =>
  (rank !== null && rank < INDEXED_VOICE_ACTORS) || searchShown(path) || vaNoted.has(path.match(/\/voice-actor\/(\d+)/)?.[1] ?? "");

/** Genre lists: the main genres, plus any other search already shows. Pagination and sorts are never indexed. */
export const genreIndexed = (slug: string, main: boolean) => main || searchShown(`/genre/${slug}`);

/** "Best anime of <year>": the last ten years, plus older years search already shows. */
export const bestYearIndexed = (year: number, now = new Date()) => year > now.getFullYear() - 10 || searchShown(`/best/${year}`);

/** Genre trend charts: only where search already shows them (the /trends hub stays). */
export const trendIndexed = (genre: string) => searchShown(`/trends/${genre}`);

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
/**
 * Searched by name ("pokemon watch order" 1.3K a month, Google India, Nov 2026) and indexed by its own page, but the
 * monthly snapshot counts one core part (the films are missing), so the sitemap left it out.
 */
const WATCH_ORDERS_SEARCHED = new Set(["pokemon"]);
export function watchOrderIndexed(slug: string, liveParts: number, liveCore?: number): boolean {
  if (slug in WATCH_ORDER_OVERRIDES || WATCH_ORDERS_SEARCHED.has(slug) || searchShown(`/watch-order/${slug}`)) return true;
  // Without an editor guide the list is Kitsu's links: worth a search result only when there's a real order to
  // explain (three or more core seasons and films). "Watch season 1, then season 2" is thin.
  const core = liveCore ?? snapshotCore(slug);
  return (franchiseParts(slug) ?? liveParts) >= INDEXED_MIN_PARTS && (core === undefined || core >= 3);
}

/** "Anime like X" lists are generated, so only the ones search already shows are listed and indexed. */
/**
 * "Anime like X" searched by name, kept indexed whatever Search Console shows since the 1 Nov drop. Google India,
 * Nov 2026 ("anime like" / "anime similar to"): Solo Leveling 8.1K, Death Note 2.9K + 2.9K, Demon Slayer 2.4K +
 * 320, Black Clover 1.6K, Naruto 1K, Naruto Shippuden 1K, Attack on Titan 1K, Your Name 880 + 480, Spy x Family
 * 880, One Piece 590, Jujutsu Kaisen 590 + 480, Haikyuu 480, Tokyo Ghoul 320.
 */
const SIMILAR_SEARCHED = ["solo-leveling", "death-note", "kimetsu-no-yaiba", "black-clover-tv", "naruto", "naruto-shippuden", "attack-on-titan", "kimi-no-na-wa", "spy-x-family", "one-piece", "jujutsu-kaisen", "haikyuu", "tokyo-ghoul"];
export const similarSlugs = () => [...new Set([...SIMILAR_SEARCHED, ...searchShownPaths("/similar/").map((p) => p.slice("/similar/".length))])];
export const similarIndexed = (slug: string) => SIMILAR_SEARCHED.includes(slug) || searchShown(`/similar/${slug}`);
/** A per-anime Hindi dub page: the most-watched dubs (lib/hindidub.ts), plus any Google already shows. */
export const hindiDubIndexed = (slug: string) => topHindiDub(slug) || searchShown(hindiDubPath(slug));

/** Character tables repeat what the character pages say: indexed only where search already shows them. */
export const characterTableIndexed = (slug: string) => searchShown(`/anime/${slug}/characters`);

/** "Next season" pages: indexed only with an answer (a sequel announced, dated, airing or out, or official news);
 *  "not announced" pages were thin and Google left them unindexed (15 Nov audit). */
export const nextSeasonIndexed = (hasNews: boolean) => hasNews;

/**
 * Episode lists: titles and dates any database has (Google dropped most). Indexed only with our own filler list;
 * an airing show's latest episodes are on its anime page, and its short list was thin (15 Nov audit). Page 1 only.
 */
export const episodeListIndexed = (o: { airing: boolean; curated: boolean; page: number }) => o.page === 1 && o.curated;

/**
 * 15 Nov audit: cast pages (the character pages' voice credits again) and "how long to watch" (Google answers it
 * itself: 4,517 impressions, 4 clicks) are never indexed; their answers belong on the anime page.
 */
export const castIndexed = () => false;
export const howLongIndexed = () => false;

/** Parents' guides are built from viewer tags for any title, so they're indexed only where a platform publishes an
 *  official rating (the part no tag list can give). */
export const parentsGuideIndexed = (official: boolean) => official;

/** `robots` metadata for a page: undefined (indexable) or noindex, follow. */
export const robotsFor = (indexed: boolean) => (indexed ? INDEX : NOINDEX);

/**
 * Anime pages: Kitsu lists ~20,000 titles, most with nothing beyond the shared database text. Indexed: titles with at
 * least ANIME_MIN_MEMBERS followers (about the top 200, the ones the sitemap lists; was 3,000, about the top 3,500),
 * anything airing or announced, anything with our own content (summary, guide, where-to-watch or dub research), and
 * anything search still shows. The rest stay reachable for visitors.
 */
export const ANIME_MIN_MEMBERS = 60_000;
export const animeIndexed = (a: { slug: string; userCount: number; status: string }, ownContent: boolean) =>
  a.userCount >= ANIME_MIN_MEMBERS || a.status === "current" || a.status === "upcoming" || ownContent || searchShown(`/anime/${a.slug}`);
