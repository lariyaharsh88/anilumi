/**
 * Where acclaimed non-Ghibli anime films stream in the US, India and the UK (data/classic-films.json): Satoshi Kon,
 * Mamoru Hosoda, Makoto Shinkai and classics like Akira, researched 25 Nov 2026 from JustWatch and the platforms'
 * pages (Hindi audio from the platform or ANN). Keyword Planner, US, Nov 2026, a month: "makoto shinkai movies"
 * 9.9K, "where to watch your name" 5.4K, "satoshi kon movies" 3.6K, "mamoru hosoda movies" 2.9K, "where to watch
 * akira" 2.9K, "where to watch perfect blue" 2.4K, "where to watch paprika" 2.4K, "classic anime movies" 2.4K.
 * Pure given the data.
 */
import data from "@/data/classic-films.json";

export type Region = "US" | "IN" | "GB";
export type Service = { service: string; kind: "subscription" | "free" | "buy"; audio?: string[]; url: string | null; confidence?: string };
export type ClassicFilm = { t: string; year: number; director: string; kitsu: string; group: "satoshi-kon" | "hosoda" | "shinkai" | "classic"; regions: Partial<Record<Region, Service[]>>; sources: string[]; note?: string };
const D = data as unknown as { checked: string; films: ClassicFilm[] };
export const CLASSIC_CHECKED = D.checked;
export const REGIONS: Region[] = ["US", "IN", "GB"];
export const REGION_NAME: Record<Region, string> = { US: "the US", IN: "India", GB: "the UK" };

export const DIRECTORS = {
  "satoshi-kon": { name: "Satoshi Kon", group: "satoshi-kon", blurb: "Satoshi Kon made four feature films before his death in 2010, each bending dreams, memory and reality: Perfect Blue, Millennium Actress, Tokyo Godfathers and Paprika." },
  "mamoru-hosoda": { name: "Mamoru Hosoda", group: "hosoda", blurb: "Mamoru Hosoda's films mix family stories with fantasy and the internet, from The Girl Who Leapt Through Time to Belle and Scarlet; Mirai was nominated for the Oscar." },
  "makoto-shinkai": { name: "Makoto Shinkai", group: "shinkai", blurb: "Makoto Shinkai is known for luminous skies and long-distance love stories: Your Name became one of the highest-grossing anime films ever, followed by Weathering with You and Suzume." },
} as const;
export type DirectorSlug = keyof typeof DIRECTORS;
export const directorPath = (s: DirectorSlug) => `/anime-movies/${s}`;

export const classicFilms = (): ClassicFilm[] => [...D.films].sort((a, b) => a.year - b.year);
export const filmsBy = (s: DirectorSlug) => classicFilms().filter((f) => f.group === DIRECTORS[s].group);
/** Streaming and free services first; rent or buy only when nothing else exists (the data does the same). */
export const streams = (f: ClassicFilm, r: Region) => (f.regions[r] ?? []).filter((s) => s.kind !== "buy");
export const rentOnly = (f: ClassicFilm, r: Region) => !streams(f, r).length && (f.regions[r] ?? []).length > 0;
/** "HBO Max, Crunchyroll" without the "(Japanese Audio)" duplicates platforms keep for the same film. */
export const whereNames = (xs: Service[]) => [...new Set(xs.map((s) => s.service.replace(/\s*\([^)]*\)$/, "")))];
export const hindiIn = (f: ClassicFilm) => (f.regions.IN ?? []).filter((s) => s.audio?.includes("hi"));
/** A sentence for "where can I watch X": each country's streams, else rent/buy, else nothing found. */
export function whereSentence(f: ClassicFilm): string {
  return REGIONS.map((r) => {
    const s = streams(f, r);
    if (s.length) return `${whereNames(s).join(", ")} in ${REGION_NAME[r]}`;
    return rentOnly(f, r) ? `rent or buy only in ${REGION_NAME[r]}` : `no legal stream found in ${REGION_NAME[r]}`;
  }).join("; ");
}
