/**
 * "Powers explained" and "all transformations" pages for the characters people search that way (data/character-
 * powers.json): abilities, forms in story order, limits, and who has beaten them, each with first appearances and
 * sources, later-arc entries flagged as spoilers. Keyword Planner, Nov 2026, a month: "gojo powers" 3.6K US / 1.3K
 * India, "who can beat gojo" 590 / 210, "goku transformations" 2.4K / 390, "naruto transformations" 590 / 140.
 * Pure given the data.
 */
import data from "@/data/character-powers.json";

type Src = { sources?: string[]; spoiler: boolean };
export type Ability = Src & { name: string; what: string; firstEpisode: number | null; firstChapter: number | null };
export type Form = Ability & { group: string; arc?: string | null };
export type Powers = {
  name: string; series: string; summary: string; abilities: Ability[]; forms: Form[];
  limits: (Src & { what: string })[]; beaten: (Src & { who: string; how: string; where?: string | null })[]; notes?: string;
};
const D = data as unknown as { checked: string; characters: Record<string, Powers> };
export const POWERS_CHECKED = D.checked;
export const powersFor = (slug: string): Powers | null => D.characters[slug] ?? null;
export const powersSlugs = () => Object.keys(D.characters);
export const powersPath = (slug: string) => `/character/${slug}/powers`;

/** What people search for each: Goku and Naruto by their forms, Gojo by his powers. */
export const leadsWithForms = (p: Powers) => p.forms.filter((f) => f.group === "main").length >= 4;
/** "Episode 12 / chapter 3", whichever the sources gave. */
export const firstSeen = (x: { firstEpisode: number | null; firstChapter: number | null }) =>
  [x.firstEpisode ? `episode ${x.firstEpisode}` : null, x.firstChapter ? `chapter ${x.firstChapter}` : null].filter(Boolean).join(" · ") || null;
