/**
 * Deep profiles for the most-searched characters (data/character-deep.json): qualities with examples, backstory and
 * the arc-by-arc journey (both spoilers, shown behind toggles), and what readers take from them (our editorial
 * take, labelled as such). Written fresh and fact-checked against two sources. Pure.
 */
import data from "@/data/character-deep.json";

export type CharacterDeep = {
  qualities: { trait: string; detail: string }[];
  backstory: string;
  journey: { stage: string; summary: string }[];
  lessons: { lesson: string; why: string }[];
  sources: string[];
  confidence: "high" | "medium";
};
const D = data as unknown as { checked: string | null; characters: Record<string, CharacterDeep> };
export const DEEP_CHECKED = D.checked;
export const characterDeep = (slug: string): CharacterDeep | null => D.characters[slug] ?? null;
