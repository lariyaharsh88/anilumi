/**
 * Verified career facts for the indexed voice actors (data/va-notes.json): debut role, awards won, agency and the
 * roles the sources call best known, from Wikipedia (en and ja), Anime News Network and agency profiles. Draft
 * until a person reviews the file. Pure.
 */
import data from "@/data/va-notes.json";

type Role = { character: string | null; anime: string; year: number | null };
export type VaNote = { name: string; debut: Role | null; awards: { award: string; year: number }[]; agency: string | null; signature: Role[]; also: string[]; confidence: "high" | "medium"; sources: string[]; notes?: string };
const DATA = data as unknown as { checked: string | null; reviewed: string | null; people: Record<string, VaNote> };
export const VA_CHECKED = DATA.checked;
export const VA_REVIEWED = DATA.reviewed;
export const vaNote = (anilistId: number): VaNote | null => DATA.people[String(anilistId)] ?? null;

/** "Momoka Kawakabe in Touka Gettan (2007)" / "Wowser (1988)" when only the title is agreed. Pure. */
export const roleLine = (r: Role) => `${r.character ? `${r.character} in ` : ""}${r.anime}${r.year ? ` (${r.year})` : ""}`;
