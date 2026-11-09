/**
 * AniLumi's own spoiler-free summaries for the most important anime pages (data/summaries.json), written fresh and
 * fact-checked against two sources, in place of Kitsu's synopsis (the same text as every other database). Draft
 * until a person reviews the file. Pure.
 */
import data from "@/data/summaries.json";

type Entry = { summary: string; sources: string[]; confidence: "high" | "medium"; notes?: string };
const DATA = data as unknown as { checked: string | null; reviewed: string | null; anime: Record<string, Entry> };
export const SUMMARIES_CHECKED = DATA.checked;
export const SUMMARIES_REVIEWED = DATA.reviewed;
export const summaryFor = (slug: string): Entry | null => DATA.anime[slug] ?? null;
