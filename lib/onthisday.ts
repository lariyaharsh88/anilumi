/**
 * "On this day in anime": popular anime that premiered on a given month/day (AniList's startDate_like
 * matches the YYYYMMDD date with a wildcard year), plus a deterministic anime of the day from the most
 * popular titles in the alias index. Dates follow Japan time, like the birthday pages.
 */
import data from "@/data/aliases.json";
import type { AliasEntry } from "./aliases";
import { anilist } from "./anilist";
import { kitsuByAniListIds, getAnimeBySlug, type Anime } from "./kitsu";
import { MONTHS } from "./birthdays";

export const otdPath = (m: number, d: number) => `/on-this-day/${MONTHS[m - 1]}/${d}`;

/** "%1028" for October 28. Pure. */
export const dateLike = (m: number, d: number) => `%${String(m).padStart(2, "0")}${String(d).padStart(2, "0")}`;

export type Premiere = { year: number; format: string; title: string; popularity: number; anime: Anime | null };
type Raw = { id: number; title: { romaji: string; english: string | null }; startDate: { year: number | null }; format: string | null; popularity: number };

const FORMAT: Record<string, string> = { TV: "TV series", TV_SHORT: "TV short", MOVIE: "Movie", OVA: "OVA", ONA: "Web series", SPECIAL: "Special" };

/** Keep known-year entries with some following, most popular first. Pure. */
export function toPremieres(rows: Raw[], kitsu: Map<number, Anime>, minPopularity = 2000): Premiere[] {
  return rows
    .filter((r) => r.startDate.year && r.popularity >= minPopularity)
    // Belt and braces: the query already drops Ecchi; Kitsu R18 / nsfw flags catch anything mislabelled.
    .filter((r) => { const k = kitsu.get(r.id); return !k || (!k.nsfw && k.ageRating !== "R18"); })
    .map((r) => ({ year: r.startDate.year!, format: FORMAT[r.format || ""] || "Anime", title: r.title.english || r.title.romaji, popularity: r.popularity, anime: kitsu.get(r.id) ?? null }));
}

export async function premieresOn(m: number, d: number, limit = 24): Promise<Premiere[]> {
  const res = await anilist<{ Page: { media: Raw[] } }>(
    `query($d:String,$n:Int){Page(perPage:$n){media(type:ANIME,startDate_like:$d,sort:POPULARITY_DESC,isAdult:false,genre_not_in:["Ecchi","Hentai"]){id title{romaji english} startDate{year} format popularity}}}`,
    { d: dateLike(m, d), n: limit },
    86400 * 7,
  );
  const rows = res?.Page.media ?? [];
  if (!rows.length) return [];
  const kitsu = await kitsuByAniListIds(rows.map((r) => r.id)).catch(() => new Map<number, Anime>());
  return toPremieres(rows, kitsu);
}

/** Day number since 1 Jan 2000 (Japan time) for a month/day/year. Pure. */
export function dayNumber(y: number, m: number, d: number): number {
  return Math.floor((Date.UTC(y, m - 1, d) - Date.UTC(2000, 0, 1)) / 86400000);
}

/**
 * Which of the top `pool` titles is anime of the day. Stepping by 7 (coprime with 300) visits every
 * title once before repeating, so popular shows don't come back for most of a year. Pure.
 */
export function pickOfDay<T>(top: T[], day: number, step = 7): T | null {
  if (!top.length) return null;
  return top[(((day * step) % top.length) + top.length) % top.length];
}

export async function animeOfTheDay(y: number, m: number, d: number, pool = 300): Promise<Anime | null> {
  const top = (data as { anime: AliasEntry[] }).anime.slice(0, pool);
  // A home-page pick should suit everyone: skip ecchi and adult-rated titles (next day's slot instead).
  for (let k = 0; k < 4; k++) {
    const pick = pickOfDay(top, dayNumber(y, m, d) + k * 1000);
    const a = pick ? await getAnimeBySlug(pick.s).catch(() => null) : null;
    if (a && !a.nsfw && a.ageRating !== "R18" && !a.categories.some((c) => c.slug === "ecchi")) return a;
  }
  return null;
}

/** Today's year/month/day in Japan. */
export function nowJst(now = new Date()): { y: number; m: number; d: number } {
  const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tokyo", year: "numeric", month: "numeric", day: "numeric" }).formatToParts(now).map((x) => [x.type, x.value]));
  return { y: Number(p.year), m: Number(p.month), d: Number(p.day) };
}
