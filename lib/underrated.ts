/**
 * Underrated anime (data/underrated.json, scripts/fetch-underrated.mts): first seasons and stand-alone films that
 * AniList members rate 78+ on average but under 120,000 have watched, against well over half a million for the hits
 * (data/anime-al.json). "underrated anime" is 5.4K searches a month in the US and 3.6K in India (Keyword Planner,
 * Nov 2026). Pure given the data.
 */
import data from "@/data/underrated.json";
import al from "@/data/anime-al.json";

export type Gem = { id: number; k: string; t: string; r: string | null; f: string; e: number | null; y: number | null; s: number; p: number; g: string[]; c: string; i: string | null; tags: string[] };
const D = data as unknown as { generated: string; minScore: number; maxPopularity: number; minPopularity: number; titles: Gem[] };
export const GEMS_UPDATED = D.generated;
export const GEM_RULES = { minScore: D.minScore, maxPopularity: D.maxPopularity, minPopularity: D.minPopularity };

// AniList keeps some English titles in capitals ("THE FIRST SLAM DUNK", "PLUTO"); shown in title case.
const SMALL = new Set(["a", "an", "and", "the", "of", "in", "on", "to", "with", "for"]);
const titleCase = (t: string) => (/[a-z]/.test(t) || !/[A-Z]{4}/.test(t) ? t : t.toLowerCase().replace(/\b[a-z]+/g, (w, i: number) => (i > 0 && SMALL.has(w) ? w : w[0].toUpperCase() + w.slice(1))));

/** Best rated first; among equals, the fewer people have seen it the higher it goes. */
export const gems = (): Gem[] => D.titles.map((g) => ({ ...g, t: titleCase(g.t) })).sort((a, b) => b.s - a.s || a.p - b.p);
export const gemsIn = (genre: string, n = 6) => gems().filter((g) => g.g.includes(genre)).slice(0, n);
export const gemMovies = (n = 8) => gems().filter((g) => g.f === "MOVIE").slice(0, n);

/** How many members the tenth most-watched anime in our AniList snapshot has: the yardstick for "few have seen it". */
export function hitPopularity(rank = 10): number {
  const pops = Object.values((al as unknown as { anime: Record<string, { st?: { amount: number }[] }> }).anime).map((a) => (a.st ?? []).reduce((n, x) => n + x.amount, 0)).sort((a, b) => b - a);
  return pops[rank - 1] ?? 0;
}
export const formatLabel = (f: string) => (f === "MOVIE" ? "Film" : f === "ONA" ? "Web series" : "TV");
