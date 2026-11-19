/**
 * Every film of the big kids' franchises and whether it's dubbed (data/franchise-films.json): Doraemon, Crayon
 * Shin-chan and Pokémon, each year's film with its Indian title, Hindi status (top-level fields) and, where
 * researched, Tamil and Telugu status (`ta`, `te`), with where and the sources. Researched 19 Nov 2026 from platform
 * pages, broadcaster and distributor announcements and news; fan wikis count only as support for TV-aired dubs
 * (confidence "medium"). Pure.
 */
import data from "@/data/franchise-films.json";

export type FilmStatus = "available" | "aired" | "none_found";
export type FilmDub = { status: FilmStatus; where: string[]; sources: string[]; confidence: "high" | "medium" };
export type Film = { year: number; en: string; in?: string | null; jp: string; live_action?: boolean; hindi: FilmStatus; where: string[]; sources: string[]; confidence: "high" | "medium"; note?: string; ta?: FilmDub; te?: FilmDub };
export type FilmFranchise = { slug: string; name: string; series: string; films: Film[] };
export type FilmLang = "hi" | "ta" | "te";

const D = data as unknown as { checked: string; franchises: FilmFranchise[] };
export const FILMS_CHECKED = D.checked;
export const filmFranchises = (): FilmFranchise[] => D.franchises;
export const filmFranchise = (slug: string): FilmFranchise | null => D.franchises.find((f) => f.slug === slug) ?? null;
export const FILM_LANG: Record<FilmLang, { name: string; hub: string; hubLabel: string }> = {
  hi: { name: "Hindi", hub: "/hindi-dub", hubLabel: "Hindi dubbed anime" },
  ta: { name: "Tamil", hub: "/tamil-dub", hubLabel: "Tamil dubbed anime" },
  te: { name: "Telugu", hub: "/telugu-dub", hubLabel: "Telugu dubbed anime" },
};
export const filmsPath = (slug: string, lang: FilmLang = "hi") => `${FILM_LANG[lang].hub}/movies/${slug}`;
/** A film's dub in one language: Hindi from the top-level fields, Tamil and Telugu from `ta`/`te` (none if unresearched). */
export const filmDub = (x: Film, lang: FilmLang): FilmDub =>
  lang === "hi" ? { status: x.hindi, where: x.where, sources: x.sources, confidence: x.confidence } : x[lang] ?? { status: "none_found", where: [], sources: [], confidence: "medium" };
/** Whether a franchise has been researched for a language (Hindi always; Tamil and Telugu where `ta`/`te` exist). */
export const hasLang = (f: FilmFranchise, lang: FilmLang) => lang === "hi" || f.films.some((x) => x[lang]);
/** Newest first: the film people are asking about is usually the latest. */
export const newestFirst = (films: Film[]) => [...films].sort((a, b) => b.year - a.year);
export const STATUS_LABEL = (lang: FilmLang): Record<FilmStatus, string> => ({ available: `In ${FILM_LANG[lang].name} now`, aired: `${FILM_LANG[lang].name} dub aired`, none_found: `No ${FILM_LANG[lang].name} dub found` });
export const HINDI_LABEL = STATUS_LABEL("hi");
