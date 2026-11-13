/**
 * Deep profiles for the most-searched characters (data/character-deep.json): qualities with examples, backstory and
 * the arc-by-arc journey (both spoilers, shown behind toggles), and what readers take from them (our editorial
 * take, labelled as such). Written fresh and fact-checked against two sources. Pure.
 */
import data from "@/data/character-deep.json";

type Spoiler = { spoiler: boolean };
export type EpisodeRef = { animeSlug: string; episode: number | null };
export type CharacterDeep = {
  qualities: { trait: string; detail: string }[];
  backstory: string;
  journey: { stage: string; summary: string }[];
  lessons: { lesson: string; why: string }[];
  /** Second pass: who they're tied to, how strong they are, their best fights, key episodes, ages over the story. */
  relationships?: ({ name: string; slug: string | null; relation: string; detail: string } & Spoiler)[];
  strength?: ({ rank: string; summary: string } & Spoiler) | null;
  fights?: ({ title: string; summary: string } & EpisodeRef & Spoiler)[];
  keyEpisodes?: ({ why: string } & EpisodeRef & Spoiler)[];
  ages?: ({ when: string; age: string | number } & Spoiler)[];
  sources: string[];
  confidence: "high" | "medium";
};
const D = data as unknown as { checked: string | null; characters: Record<string, CharacterDeep> };
export const DEEP_CHECKED = D.checked;
export const characterDeep = (slug: string): CharacterDeep | null => D.characters[slug] ?? null;
/** Split a list into what can be shown and what goes behind a spoiler toggle. Pure. */
export const bySpoiler = <T extends Spoiler>(xs: T[] = []) => ({ open: xs.filter((x) => !x.spoiler), hidden: xs.filter((x) => x.spoiler) });
