/**
 * Every film of the big kids' franchises and whether it's in Hindi (data/franchise-films.json): Doraemon, Crayon
 * Shin-chan and Pokémon, each year's film with its Indian title, Hindi status, where and the sources. Researched
 * 19 Nov 2026 from platform pages, broadcaster and distributor announcements and news; fan wikis count only as
 * support for TV-aired dubs (confidence "medium"). Pure.
 */
import data from "@/data/franchise-films.json";

export type FilmHindi = "available" | "aired" | "none_found";
export type Film = { year: number; en: string; in?: string | null; jp: string; live_action?: boolean; hindi: FilmHindi; where: string[]; sources: string[]; confidence: "high" | "medium"; note?: string };
export type FilmFranchise = { slug: string; name: string; series: string; films: Film[] };

const D = data as unknown as { checked: string; franchises: FilmFranchise[] };
export const FILMS_CHECKED = D.checked;
export const filmFranchises = (): FilmFranchise[] => D.franchises;
export const filmFranchise = (slug: string): FilmFranchise | null => D.franchises.find((f) => f.slug === slug) ?? null;
export const filmsPath = (slug: string) => `/hindi-dub/movies/${slug}`;
/** Newest first: the film people are asking about is usually the latest. */
export const newestFirst = (films: Film[]) => [...films].sort((a, b) => b.year - a.year);
export const HINDI_LABEL: Record<FilmHindi, string> = { available: "In Hindi now", aired: "Hindi dub aired", none_found: "No Hindi dub found" };
