/**
 * Every Studio Ghibli feature film and where it streams in the US, India and the UK (data/ghibli-films.json),
 * researched 23 Nov 2026 from JustWatch's country pages and the platforms' own title pages (Netflix India's pages list
 * the audio languages). Keyword Planner (Nov 2026, a month): Spirited Away 368K in the US, Akira 450K (not Ghibli),
 * Ponyo 201K, Princess Mononoke 165K; "anime movies" 135K in India. Pure.
 */
import data from "@/data/ghibli-films.json";

export type GhibliRegion = "US" | "IN" | "GB";
export type GhibliService = { service: string; kind: "subscription" | "free" | "buy"; audio?: string[]; url: string | null };
export type GhibliFilm = { t: string; year: number; director: string; kitsu: string; regions: Partial<Record<GhibliRegion, GhibliService[]>>; sources: string[]; note?: string };
const D = data as unknown as { checked: string; films: GhibliFilm[] };
export const GHIBLI_CHECKED = D.checked;
export const ghibliFilms = (): GhibliFilm[] => [...D.films].sort((a, b) => a.year - b.year);
/** Services in a region, without the separate "(Japanese Audio)" listings HBO Max keeps for the same film. */
export const ghibliWhere = (f: GhibliFilm, r: GhibliRegion): string[] => [...new Set((f.regions[r] ?? []).map((s) => s.service.replace(/\s*\(.*\)$/, "")))];
export const ghibliHindi = (f: GhibliFilm) => (f.regions.IN ?? []).some((s) => s.audio?.includes("hi"));
