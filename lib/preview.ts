/**
 * Season preview guide ("Winter 2027 anime"): every notable TV series, web series and film of a season
 * from AniList, which knows upcoming shows' studios, source material, premiere dates and prequels
 * long before Kitsu does. Grouping helpers are pure and unit-tested.
 */
import { anilist } from "./anilist";
import { kitsuByAniListIds, type Anime, type Season } from "./kitsu";

export type PreviewKind = "sequel" | "new" | "movie";
export type PreviewItem = {
  id: number;
  title: string;
  native: string | null;
  format: string;
  episodes: number | null;
  source: string | null;
  date: { year: number | null; month: number | null; day: number | null };
  popularity: number;
  genres: string[];
  studio: string | null;
  cover: string | null;
  prequel: { id: number; title: string } | null;
  kind: PreviewKind;
  anime: Anime | null;
  prequelAnime: Anime | null;
};

type Raw = {
  id: number;
  title: { romaji: string; english: string | null };
  format: string | null;
  episodes: number | null;
  source: string | null;
  startDate: { year: number | null; month: number | null; day: number | null };
  popularity: number;
  genres: string[];
  studios: { nodes: { name: string }[] };
  coverImage: { large: string | null };
  relations: { edges: { relationType: string; node: { id: number; type: string; format: string | null; title: { romaji: string; english: string | null } } }[] };
};

export const SOURCE: Record<string, string> = {
  MANGA: "Manga", LIGHT_NOVEL: "Light novel", WEB_NOVEL: "Web novel", NOVEL: "Novel", ORIGINAL: "Original", VIDEO_GAME: "Video game",
  VISUAL_NOVEL: "Visual novel", GAME: "Game", WEB_MANGA: "Web manga", MANGA_SPIN_OFF: "Manga", OTHER: "Other", MULTIMEDIA_PROJECT: "Multimedia",
};
export const FORMAT: Record<string, string> = { TV: "TV", TV_SHORT: "TV short", ONA: "Web", MOVIE: "Movie" };

/** Classify and shape one AniList entry. Sequel = has an anime prequel (not a music video). Pure. */
export function toPreview(r: Raw): Omit<PreviewItem, "anime" | "prequelAnime"> {
  const pre = r.relations.edges.find((e) => e.relationType === "PREQUEL" && e.node.type === "ANIME" && e.node.format !== "MUSIC");
  const kind: PreviewKind = r.format === "MOVIE" ? "movie" : pre ? "sequel" : "new";
  return {
    id: r.id,
    title: r.title.english || r.title.romaji,
    native: r.title.english ? r.title.romaji : null,
    format: FORMAT[r.format || ""] || "TV",
    episodes: r.episodes,
    source: r.source ? SOURCE[r.source] || null : null,
    date: r.startDate,
    popularity: r.popularity,
    genres: r.genres.slice(0, 3),
    studio: r.studios.nodes[0]?.name ?? null,
    cover: r.coverImage.large,
    prequel: pre ? { id: pre.node.id, title: pre.node.title.english || pre.node.title.romaji } : null,
    kind,
  };
}

/** "Jan 8" style key for a premiere date, or null when the day isn't announced. Pure. */
export function premiereKey(d: PreviewItem["date"]): string | null {
  if (!d.year || !d.month || !d.day) return null;
  return `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}`;
}

/** Premieres grouped by exact date, soonest first (shows without a day are left out). Pure. */
export function premiereCalendar<T extends { date: PreviewItem["date"] }>(items: T[]): { date: string; items: T[] }[] {
  const by = new Map<string, T[]>();
  for (const it of items) {
    const k = premiereKey(it.date);
    if (k) by.set(k, [...(by.get(k) || []), it]);
  }
  return [...by.entries()].sort(([a], [b]) => a.localeCompare(b)).map(([date, items]) => ({ date, items }));
}

const QUERY = `query($s:MediaSeason,$y:Int,$p:Int){Page(page:$p,perPage:50){pageInfo{hasNextPage} media(type:ANIME,season:$s,seasonYear:$y,isAdult:false,sort:POPULARITY_DESC,format_in:[TV,TV_SHORT,ONA,MOVIE]){id title{romaji english} format episodes source startDate{year month day} popularity genres studios(isMain:true){nodes{name}} coverImage{large} relations{edges{relationType node{id type format title{romaji english}}}}}}}`;

export async function getSeasonPreview(year: number, season: Season, minPopularity = 800): Promise<PreviewItem[]> {
  const pages = await Promise.all([1, 2].map((p) => anilist<{ Page: { media: Raw[] } }>(QUERY, { s: season.toUpperCase(), y: year, p }, 86400)));
  const raw = pages.flatMap((p) => p?.Page.media ?? []);
  const seen = new Set<number>();
  const items = raw.filter((r) => r.popularity >= minPopularity && !seen.has(r.id) && seen.add(r.id)).map(toPreview);
  if (!items.length) return [];
  const ids = [...new Set(items.flatMap((i) => [i.id, ...(i.prequel ? [i.prequel.id] : [])]))];
  const kitsu = await kitsuByAniListIds(ids).catch(() => new Map<number, Anime>());
  return items.map((i) => ({ ...i, anime: kitsu.get(i.id) ?? null, prequelAnime: i.prequel ? kitsu.get(i.prequel.id) ?? null : null }));
}
