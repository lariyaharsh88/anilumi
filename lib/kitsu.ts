/**
 * Thin, typed client for the free Kitsu JSON:API (https://kitsu.io/api/edge).
 * No API key required. Every call is cached by Next's fetch cache with ISR
 * revalidation so a popular page costs the upstream a handful of requests
 * per hour, not per visitor.
 */

import { WATCH_ORDER_OVERRIDES, type WatchOrderOverride } from "@/data/watch-orders";

const BASE = "https://kitsu.io/api/edge";
const SAFE_RATINGS = "G,PG,R"; // excludes R18 catalogue entries site-wide

export type ImageSet = {
  tiny?: string;
  small?: string;
  medium?: string;
  large?: string;
  original?: string;
} | null;

export type Anime = {
  id: string;
  slug: string;
  title: string;
  titleEn: string | null;
  titleJp: string | null;
  synopsis: string;
  rating: number | null; // 0-100
  userCount: number;
  favoritesCount: number;
  popularityRank: number | null;
  ratingRank: number | null;
  startDate: string | null;
  endDate: string | null;
  nextRelease: string | null;
  ageRating: string | null;
  ageRatingGuide: string | null;
  subtype: string; // TV, movie, OVA, ONA, special, music
  status: "current" | "finished" | "upcoming" | "tba" | "unreleased";
  poster: ImageSet;
  cover: ImageSet;
  episodeCount: number | null;
  episodeLength: number | null;
  totalLength: number | null; // minutes
  youtubeVideoId: string | null;
  nsfw: boolean;
  categories: Category[];
  streaming: StreamingLink[];
};

export type Category = { id: string; slug: string; title: string; count?: number; description?: string | null };
export type StreamingLink = { id: string; url: string; subs: string[]; dubs: string[]; site: string };
export type Episode = {
  id: string;
  number: number | null;
  title: string | null;
  airdate: string | null;
  synopsis: string | null;
  length: number | null;
  thumbnail: string | null;
};
export type CharacterRole = {
  id: string;
  role: string;
  name: string;
  slug: string;
  image: string | null;
};
export type Paged<T> = { items: T[]; total: number; limit: number; offset: number };

/* ----------------------------------------------------------------------- */

type JsonApiResource = {
  id: string;
  type: string;
  attributes: Record<string, unknown>;
  relationships?: Record<string, { data?: { id: string; type: string } | { id: string; type: string }[] | null }>;
};
type JsonApiDoc = { data: JsonApiResource | JsonApiResource[]; included?: JsonApiResource[]; meta?: { count?: number } };

async function kitsu(path: string, params: Record<string, string | number> = {}, revalidate = 3600): Promise<JsonApiDoc | null> {
  const qs = Object.entries(params)
    .map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`)
    .join("&");
  const url = `${BASE}${path}${qs ? `?${qs}` : ""}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/vnd.api+json", "User-Agent": "AniLumi/1.0 (+https://github.com/harshlariya98)" },
        next: { revalidate },
      });
      if (res.status === 404) return null;
      if (res.status === 429 || res.status >= 500) {
        await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
        continue;
      }
      if (!res.ok) return null;
      return (await res.json()) as JsonApiDoc;
    } catch {
      await new Promise((r) => setTimeout(r, 400 * (attempt + 1)));
    }
  }
  return null;
}

const str = (v: unknown): string | null => (typeof v === "string" && v.length ? v : null);
const num = (v: unknown): number | null => (typeof v === "number" ? v : typeof v === "string" && v !== "" && !isNaN(Number(v)) ? Number(v) : null);

function normalizeAnime(r: JsonApiResource, included: JsonApiResource[] = []): Anime {
  const a = r.attributes;
  const titles = (a.titles as Record<string, string>) || {};
  const byId = new Map(included.map((i) => [`${i.type}:${i.id}`, i]));
  const rel = (name: string) => {
    const d = r.relationships?.[name]?.data;
    return Array.isArray(d) ? d : d ? [d] : [];
  };
  const categories: Category[] = rel("categories")
    .map((ref) => byId.get(`categories:${ref.id}`))
    .filter(Boolean)
    .map((c) => ({ id: c!.id, slug: String(c!.attributes.slug), title: String(c!.attributes.title) }));
  const streaming: StreamingLink[] = rel("streamingLinks")
    .map((ref) => byId.get(`streamingLinks:${ref.id}`))
    .filter(Boolean)
    .map((s) => {
      const streamerRef = s!.relationships?.streamer?.data as { id: string } | undefined;
      const streamer = streamerRef ? byId.get(`streamers:${streamerRef.id}`) : undefined;
      const url = String(s!.attributes.url || "");
      const site = streamer ? String(streamer.attributes.siteName) : hostLabel(url);
      return { id: s!.id, url, subs: (s!.attributes.subs as string[]) || [], dubs: (s!.attributes.dubs as string[]) || [], site };
    })
    .filter((s) => s.url);
  return {
    id: r.id,
    slug: String(a.slug),
    title: str(a.canonicalTitle) || titles.en || titles.en_jp || "Untitled",
    titleEn: titles.en || null,
    titleJp: titles.ja_jp || null,
    synopsis: str(a.synopsis) || str(a.description) || "",
    rating: num(a.averageRating),
    userCount: num(a.userCount) || 0,
    favoritesCount: num(a.favoritesCount) || 0,
    popularityRank: num(a.popularityRank),
    ratingRank: num(a.ratingRank),
    startDate: str(a.startDate),
    endDate: str(a.endDate),
    nextRelease: str(a.nextRelease),
    ageRating: str(a.ageRating),
    ageRatingGuide: str(a.ageRatingGuide),
    subtype: str(a.subtype) || str(a.showType) || "TV",
    status: (str(a.status) as Anime["status"]) || "finished",
    poster: stableSet(a.posterImage),
    cover: stableSet(a.coverImage),
    episodeCount: num(a.episodeCount),
    episodeLength: num(a.episodeLength),
    totalLength: num(a.totalLength),
    youtubeVideoId: str(a.youtubeVideoId),
    nsfw: Boolean(a.nsfw),
    categories,
    streaming,
  };
}

/** Kitsu returns 15-minute signed Backblaze URLs for freshly uploaded art; the
 *  same path is served permanently from media.kitsu.app without a signature. */
export function stableUrl(u: unknown): string | undefined {
  if (typeof u !== "string" || !u) return undefined;
  if (u.includes("backblazeb2.com")) {
    try {
      const url = new URL(u);
      return `https://media.kitsu.app${url.pathname}`;
    } catch {
      return u;
    }
  }
  return u.split("?")[0];
}
function stableSet(v: unknown): ImageSet {
  if (!v || typeof v !== "object") return null;
  const o = v as Record<string, unknown>;
  const out: NonNullable<ImageSet> = {};
  for (const k of ["tiny", "small", "medium", "large", "original"] as const) {
    const s = stableUrl(o[k]);
    if (s) out[k] = s;
  }
  return Object.keys(out).length ? out : null;
}

function hostLabel(url: string) {
  try {
    return new URL(url).hostname.replace(/^www\./, "").split(".")[0];
  } catch {
    return "Stream";
  }
}

const LIST_FIELDS =
  "slug,canonicalTitle,titles,synopsis,averageRating,userCount,favoritesCount,popularityRank,ratingRank,startDate,endDate,nextRelease,ageRating,subtype,status,posterImage,episodeCount,episodeLength,totalLength,nsfw";

export type ListOpts = {
  sort?: string;
  limit?: number;
  offset?: number;
  filter?: Record<string, string>;
  revalidate?: number;
};

export async function listAnime(opts: ListOpts = {}): Promise<Paged<Anime>> {
  const { sort = "-userCount", limit = 20, offset = 0, filter = {}, revalidate = 3600 } = opts;
  const params: Record<string, string | number> = {
    "page[limit]": Math.min(limit, 20),
    "page[offset]": offset,
    sort,
    "fields[anime]": LIST_FIELDS,
    "filter[ageRating]": SAFE_RATINGS,
  };
  for (const [k, v] of Object.entries(filter)) params[`filter[${k}]`] = v;
  const doc = await kitsu("/anime", params, revalidate);
  if (!doc || !Array.isArray(doc.data)) return { items: [], total: 0, limit, offset };
  return {
    items: uniqueById(doc.data.map((r) => normalizeAnime(r)).filter((a) => !a.nsfw)),
    total: doc.meta?.count ?? 0,
    limit,
    offset,
  };
}

export async function getTrending(limit = 10): Promise<Anime[]> {
  const doc = await kitsu("/trending/anime", { limit, "fields[anime]": LIST_FIELDS }, 1800);
  if (!doc || !Array.isArray(doc.data)) return [];
  return doc.data.map((r) => normalizeAnime(r)).filter((a) => !a.nsfw && a.ageRating !== "R18");
}

export async function getAnimeBySlug(slug: string): Promise<Anime | null> {
  const doc = await kitsu(
    "/anime",
    {
      "filter[slug]": slug,
      include: "categories,streamingLinks.streamer",
      "fields[categories]": "slug,title",
      "fields[streamingLinks]": "url,subs,dubs,streamer",
      "fields[streamers]": "siteName",
    },
    86400,
  );
  if (!doc || !Array.isArray(doc.data) || !doc.data.length) return null;
  const a = normalizeAnime(doc.data[0], doc.included);
  return a.nsfw || a.ageRating === "R18" ? null : a;
}

export async function getEpisodes(animeId: string, page = 1, limit = 20): Promise<Paged<Episode>> {
  const offset = (page - 1) * limit;
  const doc = await kitsu(
    `/anime/${animeId}/episodes`,
    { "page[limit]": limit, "page[offset]": offset, sort: "number", "fields[episodes]": "number,canonicalTitle,titles,airdate,synopsis,length,thumbnail" },
    21600,
  );
  if (!doc || !Array.isArray(doc.data)) return { items: [], total: 0, limit, offset };
  return {
    items: doc.data.map((e) => {
      const t = (e.attributes.titles as Record<string, string>) || {};
      const thumb = e.attributes.thumbnail as { original?: string } | null;
      return {
        id: e.id,
        number: num(e.attributes.number),
        title: str(e.attributes.canonicalTitle) || t.en_us || t.en_jp || null,
        airdate: str(e.attributes.airdate),
        synopsis: str(e.attributes.synopsis),
        length: num(e.attributes.length),
        thumbnail: stableUrl(thumb?.original) || null,
      };
    }),
    total: doc.meta?.count ?? 0,
    limit,
    offset,
  };
}

export async function getCharacters(animeId: string, limit = 12): Promise<CharacterRole[]> {
  const doc = await kitsu(
    `/anime/${animeId}/characters`,
    // sort=role puts "main" before "supporting"; Kitsu's resized character derivatives are corrupted, so only the original is used.
    { include: "character", "page[limit]": limit, sort: "role", "fields[characters]": "slug,canonicalName,image", "fields[mediaCharacters]": "role,character" },
    86400,
  );
  if (!doc || !Array.isArray(doc.data)) return [];
  const byId = new Map((doc.included || []).map((i) => [i.id, i]));
  return doc.data
    .map((mc) => {
      const ref = mc.relationships?.character?.data as { id: string } | undefined;
      const c = ref ? byId.get(ref.id) : undefined;
      if (!c) return null;
      const img = c.attributes.image as { medium?: string; original?: string } | null;
      return { id: c.id, role: String(mc.attributes.role || "supporting"), name: String(c.attributes.canonicalName), slug: String(c.attributes.slug), image: stableUrl(img?.original) || null };
    })
    .filter((x): x is CharacterRole => Boolean(x))
    .sort((a, b) => (a.role === "main" ? -1 : 1) - (b.role === "main" ? -1 : 1));
}

export async function getCategories(limit = 40): Promise<Category[]> {
  const doc = await kitsu("/categories", { "page[limit]": limit, sort: "-totalMediaCount", "fields[categories]": "slug,title,totalMediaCount,description" }, 86400);
  if (!doc || !Array.isArray(doc.data)) return [];
  return doc.data.map((c) => ({ id: c.id, slug: String(c.attributes.slug), title: String(c.attributes.title), count: num(c.attributes.totalMediaCount) || 0, description: str(c.attributes.description) }));
}

export async function getCategory(slug: string): Promise<Category | null> {
  const doc = await kitsu("/categories", { "filter[slug]": slug, "fields[categories]": "slug,title,totalMediaCount,description" }, 86400);
  if (!doc || !Array.isArray(doc.data) || !doc.data.length) return null;
  const c = doc.data[0];
  return { id: c.id, slug: String(c.attributes.slug), title: String(c.attributes.title), count: num(c.attributes.totalMediaCount) || 0, description: str(c.attributes.description) };
}

export async function searchAnime(q: string, limit = 20): Promise<Anime[]> {
  if (!q.trim()) return [];
  const { items } = await listAnime({ filter: { text: q.trim() }, limit, sort: "-userCount", revalidate: 600 });
  return items;
}

/* ---------------- Seasons ---------------- */

export const SEASONS = ["winter", "spring", "summer", "fall"] as const;
export type Season = (typeof SEASONS)[number];

export function seasonOf(d = new Date()): { season: Season; year: number } {
  const m = d.getUTCMonth();
  const season: Season = m < 3 ? "winter" : m < 6 ? "spring" : m < 9 ? "summer" : "fall";
  return { season, year: d.getUTCFullYear() };
}

export function shiftSeason(season: Season, year: number, delta: number): { season: Season; year: number } {
  let i = SEASONS.indexOf(season) + delta;
  let y = year;
  while (i < 0) { i += 4; y -= 1; }
  while (i > 3) { i -= 4; y += 1; }
  return { season: SEASONS[i], year: y };
}

export async function getSeason(year: number, season: Season, page = 1, limit = 20) {
  return listAnime({ filter: { season, seasonYear: String(year) }, sort: "-userCount", limit, offset: (page - 1) * limit, revalidate: 3600 });
}

/* ---------------- Helpers ---------------- */

export const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export function uniqueById<T extends { id: string }>(items: T[]): T[] {
  const seen = new Set<string>();
  return items.filter((x) => (seen.has(x.id) ? false : (seen.add(x.id), true)));
}

export function animePath(a: Pick<Anime, "slug">) {
  return `/anime/${encodeURIComponent(a.slug)}`;
}

export function posterUrl(a: Pick<Anime, "poster">, size: "small" | "medium" | "large" | "original" = "medium") {
  return a.poster?.[size] || a.poster?.original || a.poster?.large || a.poster?.medium || null;
}

export function fmtDate(iso: string | null, opts: Intl.DateTimeFormatOptions = { year: "numeric", month: "short", day: "numeric" }) {
  if (!iso) return null;
  const d = new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", iso.length === 10 ? { ...opts, timeZone: "UTC" } : opts);
}

export function statusLabel(s: Anime["status"]) {
  return { current: "Airing", finished: "Finished", upcoming: "Upcoming", tba: "TBA", unreleased: "Unreleased" }[s] || s;
}

export function subtypeLabel(s: string) {
  const map: Record<string, string> = { TV: "TV Series", movie: "Movie", OVA: "OVA", ONA: "ONA", special: "Special", music: "Music" };
  return map[s] || s;
}

export function weekdayOf(iso: string | null): string | null {
  if (!iso) return null;
  const d = new Date(iso);
  if (isNaN(d.getTime())) return null;
  return d.toLocaleDateString("en-US", { weekday: "long", timeZone: "Asia/Tokyo" });
}

/* ---------------- Franchise graph / watch order ---------------- */

export type RelationRole = "sequel" | "prequel" | "side_story" | "spinoff" | "alternative_version" | "alternative_setting" | "summary" | "full_story" | "parent_story" | "other" | "character" | "adaptation";
export type Relation = { role: RelationRole; anime: Anime };

export async function getRelations(animeId: string): Promise<Relation[]> {
  const doc = await kitsu(
    `/anime/${animeId}/media-relationships`,
    { include: "destination", "page[limit]": 20, "fields[anime]": LIST_FIELDS, "fields[mediaRelationships]": "role,destination" },
    86400,
  );
  if (!doc || !Array.isArray(doc.data)) return [];
  const byId = new Map((doc.included || []).filter((i) => i.type === "anime").map((i) => [i.id, i]));
  return doc.data
    .map((r) => {
      const dest = r.relationships?.destination?.data as { id: string; type: string } | undefined;
      if (!dest || dest.type !== "anime") return null;
      const res = byId.get(dest.id);
      if (!res) return null;
      const anime = normalizeAnime(res);
      if (anime.nsfw || anime.ageRating === "R18") return null;
      return { role: String(r.attributes.role) as RelationRole, anime };
    })
    .filter((x): x is Relation => Boolean(x));
}

export type WatchEntry = {
  anime: Anime;
  step: number;
  kind: "main" | "movie" | "side" | "recap" | "spinoff" | "alt";
  note: string;
  optional: boolean;
  attachedTo?: string; // id of main entry this hangs off
};

export type WatchOrder = { root: Anime; entries: WatchEntry[]; mainCount: number; totalMinutes: number; releaseOrder: Anime[]; intro: string | null };

function kindOf(role: RelationRole, a: Anime): WatchEntry["kind"] {
  if (role === "summary") return "recap";
  if (role === "spinoff" || role === "character") return "spinoff";
  if (role === "alternative_version" || role === "alternative_setting") return "alt";
  if (a.subtype === "movie") return "movie";
  return "side";
}

const NOTES: Record<WatchEntry["kind"] | "skipped", string> = {
  main: "Core story – watch in this order.",
  movie: "Movie – canon side content, best watched here.",
  side: "Side story / OVA – optional but adds context.",
  recap: "Recap – skip unless you need a refresher.",
  spinoff: "Spin-off – optional, different tone or cast.",
  alt: "Alternative version – retells the same events; skip if you watched the series.",
  skipped: "Safe to skip – see the guide notes above.",
};

/** Walk prequel/sequel links to assemble the franchise, max 12 hops each way. */
export async function buildWatchOrder(start: Anime, fetchRelations: (id: string) => Promise<Relation[]> = getRelations, overrides: Record<string, WatchOrderOverride> = WATCH_ORDER_OVERRIDES): Promise<WatchOrder> {
  const relCache = new Map<string, Relation[]>();
  const rels = async (a: Anime) => {
    if (!relCache.has(a.id)) relCache.set(a.id, await fetchRelations(a.id));
    return relCache.get(a.id)!;
  };

  // 1. find the first entry by following prequels
  let root = start;
  const seen = new Set<string>([start.id]);
  for (let i = 0; i < 12; i++) {
    const prev = (await rels(root)).find((r) => r.role === "prequel" && !seen.has(r.anime.id));
    if (!prev) break;
    seen.add(prev.anime.id);
    root = prev.anime;
  }

  // 2. follow sequels from the root
  const main: Anime[] = [root];
  const visited = new Set<string>([root.id]);
  for (let i = 0; i < 12; i++) {
    const cur = main[main.length - 1];
    const candidates = (await rels(cur)).filter((r) => r.role === "sequel" && !visited.has(r.anime.id));
    if (!candidates.length) break;
    candidates.sort((x, y) => (x.anime.startDate || "9").localeCompare(y.anime.startDate || "9"));
    const next = candidates[0].anime;
    visited.add(next.id);
    main.push(next);
  }

  // 3. attach side content to the main entry it is linked from
  const entries: WatchEntry[] = [];
  let step = 1;
  for (const m of main) {
    entries.push({ anime: m, step: step++, kind: "main", note: NOTES.main, optional: false });
    const extras = (await rels(m))
      .filter((r) => !["sequel", "prequel", "adaptation", "parent_story", "full_story"].includes(r.role) && !visited.has(r.anime.id))
      .sort((x, y) => (x.anime.startDate || "9").localeCompare(y.anime.startDate || "9"));
    for (const r of extras) {
      visited.add(r.anime.id);
      const kind = kindOf(r.role, r.anime);
      entries.push({ anime: r.anime, step: step++, kind, note: NOTES[kind], optional: kind !== "main", attachedTo: m.id });
    }
  }

  // 4. editorial overrides (data/watch-orders.ts). Keyed by any slug in the franchise, so
  //    a key still matches when Kitsu roots the graph at a prequel film or OVA.
  const ov = overrides[root.slug] ?? entries.map((e) => overrides[e.anime.slug]).find(Boolean);
  if (ov?.demote?.length) {
    for (const slug of ov.demote) {
      const i = entries.findIndex((e) => e.anime.slug === slug && e.kind === "main");
      if (i < 0) continue;
      const [d] = entries.splice(i, 1);
      d.kind = d.anime.subtype === "movie" ? "movie" : "side";
      d.optional = true;
      d.note = NOTES[d.kind];
      const anchor = entries.findIndex((e, j) => j >= i && e.kind === "main");
      const at = anchor < 0 ? entries.findIndex((e) => e.kind === "main") : anchor;
      d.attachedTo = at < 0 ? undefined : entries[at].anime.id;
      entries.splice(at < 0 ? entries.length : at + 1, 0, d);
    }
  }
  if (ov?.skip?.length) for (const e of entries) if (ov.skip.includes(e.anime.slug)) { e.kind = "recap"; e.note = NOTES.skipped; e.optional = true; }
  if (ov?.mainOrder?.length) {
    const rank = (e: WatchEntry) => { const i = ov.mainOrder!.indexOf(e.anime.slug); return i < 0 ? 1e6 + e.step : i; };
    const mains = entries.filter((e) => e.kind === "main").sort((x, y) => rank(x) - rank(y));
    const rest = entries.filter((e) => e.kind !== "main");
    entries.length = 0;
    for (const m of mains) { entries.push(m); entries.push(...rest.filter((r) => r.attachedTo === m.anime.id)); }
    entries.push(...rest.filter((r) => !mains.some((m) => m.anime.id === r.attachedTo)));
  }
  entries.forEach((e, i) => (e.step = i + 1));

  const minutes = (a: Anime) => a.totalLength || (a.episodeCount && a.episodeLength ? a.episodeCount * a.episodeLength : 0);
  const totalMinutes = entries.filter((e) => e.kind === "main" || e.kind === "movie").reduce((n, e) => n + minutes(e.anime), 0);
  const releaseOrder = [...entries.map((e) => e.anime)].sort((x, y) => (x.startDate || "9").localeCompare(y.startDate || "9"));
  const firstMain = entries.find((e) => e.kind === "main")?.anime ?? root;
  return { root: firstMain, entries, mainCount: entries.filter((e) => e.kind === "main").length, totalMinutes, releaseOrder, intro: ov?.intro || null };
}

export function runtimeMinutes(a: Anime): number {
  return a.totalLength || (a.episodeCount && a.episodeLength ? a.episodeCount * a.episodeLength : 0);
}

export function fmtMinutes(min: number): string {
  if (!min) return "–";
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  if (h >= 48) return `${Math.floor(h / 24)}d ${h % 24}h`;
  return h ? `${h}h${m ? ` ${m}m` : ""}` : `${m}m`;
}

/* ---------------- Episodes by number ---------------- */

function normalizeEpisode(e: JsonApiResource): Episode {
  const t = (e.attributes.titles as Record<string, string>) || {};
  const thumb = e.attributes.thumbnail as { original?: string } | null;
  return {
    id: e.id,
    number: num(e.attributes.number),
    title: str(e.attributes.canonicalTitle) || t.en_us || t.en_jp || null,
    airdate: str(e.attributes.airdate),
    synopsis: str(e.attributes.synopsis),
    length: num(e.attributes.length),
    thumbnail: stableUrl(thumb?.original) || null,
  };
}

const EP_FIELDS = "number,canonicalTitle,titles,airdate,synopsis,length,thumbnail";

export async function getEpisodeByNumber(animeId: string, n: number): Promise<Episode | null> {
  const doc = await kitsu(`/anime/${animeId}/episodes`, { "filter[number]": n, "page[limit]": 1, "fields[episodes]": EP_FIELDS }, 21600);
  if (!doc || !Array.isArray(doc.data) || !doc.data.length) return null;
  return normalizeEpisode(doc.data[0]);
}

/**
 * Number of the most recent episode that has actually aired. Long-running shows on Kitsu
 * carry hundreds of placeholder episodes with no air date, so we binary-search for the
 * last dated episode (≈11 cached requests for a 1,400-episode series).
 */
export type LastAired = { count: number; lastAired: number; lastAiredDate: string | null; reliable: boolean };

/** True when the last dated episode is recent enough that "last + 1" is really the next episode. */
function reliableTail(lastAiredDate: string | null): boolean {
  if (!lastAiredDate) return false;
  return Date.now() - new Date(`${lastAiredDate}T00:00:00Z`).getTime() < 45 * 86400000;
}

/** Pure binary search: largest index i in [0, count) with aired(at(i)); -1 if none. Assumes aired is monotone (true…true false…false). */
export async function findLastAiredIndex(count: number, at: (i: number) => Promise<Episode | null>, aired: (e: Episode | null) => boolean): Promise<{ index: number; episode: Episode | null }> {
  if (!count) return { index: -1, episode: null };
  const last = await at(count - 1);
  if (aired(last)) return { index: count - 1, episode: last };
  const first = await at(0);
  if (!aired(first)) return { index: -1, episode: null };
  let lo = 0, hi = count - 1, best = first;
  for (let i = 0; i < 20 && hi - lo > 1; i++) {
    const mid = Math.floor((lo + hi) / 2);
    const e = await at(mid);
    if (aired(e)) { lo = mid; best = e; } else hi = mid;
  }
  return { index: lo, episode: best };
}

export async function getLastAired(animeId: string): Promise<LastAired> {
  const head = await kitsu(`/anime/${animeId}/episodes`, { "page[limit]": 1, "fields[episodes]": "number" }, 21600);
  const count = head?.meta?.count ?? 0;
  const at = async (offset: number): Promise<Episode | null> => {
    const doc = await kitsu(`/anime/${animeId}/episodes`, { "page[limit]": 1, "page[offset]": offset, sort: "number", "fields[episodes]": "number,airdate" }, 21600);
    return doc && Array.isArray(doc.data) && doc.data[0] ? normalizeEpisode(doc.data[0]) : null;
  };
  const aired = (e: Episode | null) => Boolean(e?.airdate) && !isFuture(e!.airdate);
  const { index, episode } = await findLastAiredIndex(count, at, aired);
  if (index < 0) return { count, lastAired: 0, lastAiredDate: null, reliable: false };
  return { count, lastAired: episode?.number ?? index + 1, lastAiredDate: episode?.airdate ?? null, reliable: reliableTail(episode?.airdate ?? null) };
}

export function episodePath(a: Pick<Anime, "slug">, n: number) {
  return `${animePath(a)}/episode/${n}`;
}

export function isFuture(iso: string | null): boolean {
  if (!iso) return false;
  const d = new Date(iso.length === 10 ? `${iso}T23:59:59+09:00` : iso);
  return d.getTime() > Date.now();
}

/* ---------------- Optional MyAnimeList (Jikan) enrichment ----------------
 * Kitsu's episode air dates lag badly for long-running shows (One Piece stops at ep. 743),
 * so numbered "next episode" pages can't be derived from Kitsu alone. When JIKAN_ENRICH=1,
 * we look up the MAL id via Kitsu's mappings and read the latest aired episode from Jikan.
 * Fails soft: any error or a 4 s timeout simply returns null. */

export async function getMalId(animeId: string): Promise<string | null> {
  const doc = await kitsu(`/anime/${animeId}/mappings`, { "fields[mappings]": "externalSite,externalId" }, 86400 * 7);
  if (!doc || !Array.isArray(doc.data)) return null;
  const m = doc.data.find((x) => x.attributes.externalSite === "myanimelist/anime");
  return m ? String(m.attributes.externalId) : null;
}

export async function getMalLastAired(animeId: string): Promise<LastAired | null> {
  if (process.env.JIKAN_ENRICH !== "1") return null;
  try {
    const malId = await getMalId(animeId);
    if (!malId) return null;
    const get = async (page: number) => {
      const res = await fetch(`https://api.jikan.moe/v4/anime/${malId}/episodes?page=${page}`, { next: { revalidate: 21600 }, signal: AbortSignal.timeout(Number(process.env.JIKAN_TIMEOUT_MS) || 4000) });
      if (!res.ok) {
        if (process.env.JIKAN_DEBUG === "1") console.warn(`[jikan] ${malId} page ${page}: HTTP ${res.status}`);
        return null;
      }
      return (await res.json()) as { pagination?: { last_visible_page?: number }; data?: { mal_id: number; aired: string | null }[] };
    };
    const first = await get(1);
    const lastPage = first?.pagination?.last_visible_page || 1;
    const tail = lastPage > 1 ? await get(lastPage) : first;
    const eps = (tail?.data || []).filter((e) => e.aired && !isFuture(e.aired));
    const last = eps[eps.length - 1];
    if (!last) return null;
    const date = last.aired!.slice(0, 10);
    return { count: last.mal_id, lastAired: last.mal_id, lastAiredDate: date, reliable: reliableTail(date) };
  } catch (err) {
    if (process.env.JIKAN_DEBUG === "1") console.warn(`[jikan] ${animeId}: ${(err as Error).name}: ${(err as Error).message}`);
    return null;
  }
}

/** Kitsu first; MAL as a fallback when Kitsu's tail is stale and enrichment is enabled. */
export async function getLastAiredBest(animeId: string): Promise<LastAired> {
  const k = await getLastAired(animeId);
  if (k.reliable) return k;
  const m = await getMalLastAired(animeId);
  return m && m.lastAired >= k.lastAired ? m : k;
}

/* ---------------- Characters ---------------- */

export type Character = { id: string; slug: string; name: string; nameJp: string | null; description: string; image: string | null };
export type Appearance = { role: string; anime: Anime };

function normalizeCharacter(c: JsonApiResource): Character {
  const img = c.attributes.image as { original?: string } | null;
  const names = (c.attributes.names as Record<string, string>) || {};
  return {
    id: c.id,
    slug: String(c.attributes.slug),
    name: str(c.attributes.canonicalName) || names.en || "Unknown",
    nameJp: names.ja_jp || null,
    description: (str(c.attributes.description) || "").replace(/\[\/?(b|i|u|spoiler|url[^\]]*)\]/gi, "").trim(),
    image: stableUrl(img?.original) || null,
  };
}

export async function getCharacterBySlug(slug: string): Promise<Character | null> {
  const doc = await kitsu("/characters", { "filter[slug]": slug, "fields[characters]": "slug,canonicalName,names,description,image" }, 86400);
  if (!doc || !Array.isArray(doc.data) || !doc.data.length) return null;
  return normalizeCharacter(doc.data[0]);
}

export async function getCharacterAppearances(characterId: string): Promise<Appearance[]> {
  const doc = await kitsu(`/characters/${characterId}/media-characters`, { include: "media", "page[limit]": 20, "fields[mediaCharacters]": "role,media", "fields[anime]": LIST_FIELDS }, 86400);
  if (!doc || !Array.isArray(doc.data)) return [];
  const byId = new Map((doc.included || []).filter((i) => i.type === "anime").map((i) => [i.id, i]));
  const out: Appearance[] = [];
  for (const mc of doc.data) {
    const ref = mc.relationships?.media?.data as { id: string; type: string } | undefined;
    if (!ref || ref.type !== "anime") continue;
    const res = byId.get(ref.id);
    if (!res) continue;
    const anime = normalizeAnime(res);
    if (anime.nsfw) continue;
    out.push({ role: String(mc.attributes.role || "supporting"), anime });
  }
  return uniqueById(out.map((o) => ({ ...o, id: o.anime.id }))).sort((x, y) => (x.anime.startDate || "9").localeCompare(y.anime.startDate || "9"));
}

/* ---------------- Studios / producers ---------------- */

export type Producer = { id: string; slug: string; name: string };
export type Production = { role: "studio" | "producer" | "licensor"; producer: Producer };

export async function getProductions(animeId: string): Promise<Production[]> {
  const doc = await kitsu(`/anime/${animeId}/anime-productions`, { include: "producer", "fields[animeProductions]": "role,producer", "fields[producers]": "slug,name" }, 86400);
  if (!doc || !Array.isArray(doc.data)) return [];
  const byId = new Map((doc.included || []).map((i) => [i.id, i]));
  return doc.data
    .map((p) => {
      const ref = p.relationships?.producer?.data as { id: string } | undefined;
      const pr = ref ? byId.get(ref.id) : undefined;
      if (!pr) return null;
      return { role: String(p.attributes.role) as Production["role"], producer: { id: pr.id, slug: String(pr.attributes.slug), name: String(pr.attributes.name) } };
    })
    .filter((x): x is Production => Boolean(x));
}

export async function getProducerBySlug(slug: string): Promise<Producer | null> {
  const doc = await kitsu("/producers", { "filter[slug]": slug, "fields[producers]": "slug,name" }, 86400);
  if (!doc || !Array.isArray(doc.data) || !doc.data.length) return null;
  const p = doc.data[0];
  return { id: p.id, slug: String(p.attributes.slug), name: String(p.attributes.name) };
}

/** Up to 120 titles the producer worked on as the animation studio, most popular first. */
export async function getStudioAnime(producerId: string): Promise<{ items: Anime[]; total: number }> {
  const first = await kitsu(`/producers/${producerId}/anime-productions`, { include: "anime", "filter[role]": "studio", "page[limit]": 20, "page[offset]": 0, "fields[animeProductions]": "role,anime", "fields[anime]": LIST_FIELDS }, 86400);
  const total = first?.meta?.count ?? 0;
  const rest = await Promise.all([20, 40, 60, 80, 100].filter((o) => o < total).map((offset) => kitsu(`/producers/${producerId}/anime-productions`, { include: "anime", "filter[role]": "studio", "page[limit]": 20, "page[offset]": offset, "fields[animeProductions]": "role,anime", "fields[anime]": LIST_FIELDS }, 86400)));
  const items = [first, ...rest].flatMap((doc) => (doc?.included || []).filter((i) => i.type === "anime").map((i) => normalizeAnime(i))).filter((a) => !a.nsfw);
  return { items: uniqueById(items).sort((x, y) => y.userCount - x.userCount), total };
}
