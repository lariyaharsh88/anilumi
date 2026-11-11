/**
 * One spoiler-free line per character (data/character-lines.json, keyed by AniList character id): who they are when
 * the story starts, for birthday pages and the birthday-twin tool. Written from AniList plus one more source. Pure.
 */
import data from "@/data/character-lines.json";

const D = data as unknown as { checked: string | null; characters: Record<string, string> };
export const LINES_CHECKED = D.checked;
export const characterLine = (anilistId: number): string | null => D.characters[String(anilistId)] ?? null;
