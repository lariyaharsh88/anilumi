/**
 * "Strongest characters" rankings per series (data/strongest.json), built only from what happens in the story:
 * official titles and ranks (Emperors, Kage, special grade, Gods of Destruction), bounties and fight results, each
 * with its source and a spoiler flag. Keyword Planner, Nov 2026, a month: "strongest one piece characters" 9.9K US /
 * 8.1K India, "strongest naruto characters" 6.6K / 8.1K, "strongest dragon ball characters" 4.4K / 1.9K,
 * "strongest anime characters" 18.1K / 9.9K. Pure given the data.
 */
import data from "@/data/strongest.json";
import { snapByPage, snapImage } from "./charsnap";

export type RankedChar = { name: string; slug: string | null; why: string; spoiler: boolean; sources: string[]; confidence: "high" | "medium" };
export type Tier = { name: string; note?: string; chars: RankedChar[] };
export type Ranking = { name: string; anime: string; searches: { US: number; IN: number }; asOf: string; basis: string; notes: string; tiers: Tier[] };
const D = data as unknown as { checked: string; series: Record<string, Ranking> };
export const STRONGEST_CHECKED = D.checked;
export const rankingSlugs = () => Object.keys(D.series);
export const ranking = (slug: string): Ranking | null => D.series[slug] ?? null;
export const strongestPath = (slug: string) => `/strongest/${slug}`;
/** Everyone in order, tier by tier. */
export const ranked = (r: Ranking) => r.tiers.flatMap((t) => t.chars.map((c) => ({ ...c, tier: t.name })));
/** The character's portrait, from the monthly snapshot, when they have a page. */
export const portrait = (slug: string | null) => { const c = slug ? snapByPage(slug) : null; return c ? snapImage(c) : null; };
