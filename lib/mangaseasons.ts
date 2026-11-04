/**
 * Which source chapters (manga) or volumes (light novels) each TV season adapts (data/manga-seasons.json),
 * researched from the series wikis and Wikipedia's episode lists and cross-checked against a second source.
 * Shown as a draft until a person reviews the file. Facts only: numbers and short notes.
 */
import data from "@/data/manga-seasons.json";

export type Adaptation = {
  franchise?: string; medium: "manga" | "light novel"; unit: "chapter" | "volume";
  from: number; to: number; continue: number | null; notes?: string; sources?: string[]; confidence?: string;
};
const DATA = data as unknown as { checked: string | null; reviewed: string | null; seasons: Record<string, Adaptation> };
export const ADAPT_CHECKED = DATA.checked;
export const ADAPT_REVIEWED = DATA.reviewed;

export const adaptationFor = (slug: string): Adaptation | null => DATA.seasons[slug] ?? null;

const span = (x: Adaptation) => (x.from === x.to ? `${x.unit} ${x.from}` : `${x.unit}s ${x.from}–${x.to}`);

/** "manga chapters 1–33", "light novel volumes 1–3". Pure. */
export const adaptedRange = (x: Adaptation) => `${x.medium} ${span(x)}`;

/** "ch. 1–33" / "vol. 1–3" for tight spaces. Pure. */
export const shortRange = (x: Adaptation) => `${x.unit === "chapter" ? "ch." : "vol."} ${x.from === x.to ? x.from : `${x.from}–${x.to}`}`;

/** "Continue from chapter 34" or null. Pure. */
export const continueAt = (x: Adaptation) => (x.continue ? `${x.unit} ${x.continue}` : null);
