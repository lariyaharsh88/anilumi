/**
 * Hand-picked "anime like X" lists (data/similar-picks.json): each pick with the reason it fits, written by AniLumi,
 * shown first on /similar/[slug] above the automatic fan picks. "anime like solo leveling" is searched 8.1K times a
 * month in India (Keyword Planner, Nov 2026); the automatic list says what two shows share from tags, not why to
 * watch one next. Pure.
 */
import data from "@/data/similar-picks.json";

/** `name`: the English name people know, when Kitsu's is a literal translation ("Suzume", not "Sparrow's Door Tightening"). */
export type EditorPick = { s: string; why: string; name?: string };
export type EditorList = { about: string; picks: EditorPick[] };
const D = data as { checked: string; lists: Record<string, EditorList> };
export const EDITOR_PICKS_CHECKED = D.checked;
export const editorPicks = (slug: string): EditorList | null => D.lists[slug] ?? null;
export const editorPickSlugs = (): string[] => Object.keys(D.lists);
