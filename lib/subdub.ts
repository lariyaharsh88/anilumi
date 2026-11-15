/**
 * Sub vs dub (/sub-vs-dub): which popular anime have an English dub and where (data/where-to-watch.json), this
 * season's English dubs (data/dub-schedule.json) and how many shows past seasons dubbed, and how many of those were
 * simuldubs (data/season-dubs.json). Pure.
 */
import { allStreams, servicesIn, REGIONS, type Region, type Streams } from "./streams";
import { dubShows, premiereAt, type DubShow } from "./dubschedule";
import seasonData from "@/data/season-dubs.json";

const SEASONS = (seasonData as unknown as { seasons: Record<string, { en: { when: "simuldub" | "later" }[] }> }).seasons;

/** Services in a region whose audio includes `lang`, without repeats ("Crunchyroll", "Netflix"). */
export const dubServices = (e: Streams, r: Region, lang = "en") => [...new Set(servicesIn(e, r).filter((x) => x.audio.includes(lang)).map((x) => x.service))];

export type DubRow = { s: string; t: string; en: Partial<Record<Region, string[]>>; hindi: boolean; english: boolean };

/** Every researched franchise, most-watched first: where its English dub streams in each region, and whether a Hindi dub exists. */
export function dubRows(entries: Streams[] = allStreams()): DubRow[] {
  return entries.map((e) => {
    const en = Object.fromEntries(REGIONS.map((r) => [r, dubServices(e, r)]).filter(([, v]) => v.length)) as DubRow["en"];
    return { s: e.s, t: e.t, en, english: Object.keys(en).length > 0, hindi: REGIONS.some((r) => dubServices(e, r, "hi").length > 0) };
  });
}

/** How many of the franchises each service carries with an English dub in a region, most first. */
export function dubsByService(rows: DubRow[], r: Region = "US"): { service: string; count: number }[] {
  const n = new Map<string, number>();
  for (const row of rows) for (const s of row.en[r] ?? []) n.set(s, (n.get(s) ?? 0) + 1);
  return [...n].map(([service, count]) => ({ service, count })).sort((a, b) => b.count - a.count || a.service.localeCompare(b.service));
}

/** This season's English dubs, airing and finished first, then announced, each by premiere. */
export function seasonEnglishDubs(shows: DubShow[] = dubShows()): DubShow[] {
  const rank = { airing: 0, complete: 1, announced: 2 } as const;
  return shows.filter((e) => e.lang === "en").sort((a, b) => rank[a.status] - rank[b.status] || (premiereAt(a) || Infinity) - (premiereAt(b) || Infinity));
}

const SEASON_ORDER = ["winter", "spring", "summer", "fall"];
/** English dubs per past season, oldest first, with how many were simuldubs (same week as Japan). */
export function dubsPerSeason(seasons: Record<string, { en: { when: string }[] }> = SEASONS): { year: number; season: string; dubs: number; simuldubs: number }[] {
  return Object.entries(seasons)
    .map(([k, v]) => { const [y, s] = k.split("-"); return { year: Number(y), season: s, dubs: v.en.length, simuldubs: v.en.filter((x) => x.when === "simuldub").length }; })
    .filter((x) => x.dubs > 0)
    .sort((a, b) => a.year - b.year || SEASON_ORDER.indexOf(a.season) - SEASON_ORDER.indexOf(b.season));
}
