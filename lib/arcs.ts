/**
 * Story arcs of long-running shows (data/arcs.json): arc names and episode ranges in Kitsu's numbering, drafted
 * from published episode lists and cross-checked against two sources (`sources`). Shown as a draft until a person
 * reviews the file (`reviewed`). Facts only: names and numbers.
 */
import data from "@/data/arcs.json";

/** `to: null`: the arc is still airing. */
export type Arc = { name: string; from: number; to: number | null; filler?: boolean };
type Show = { arcs: Arc[]; sources?: string[]; confidence?: string; notes?: string };
const DATA = data as unknown as { checked: string | null; reviewed: string | null; shows: Record<string, Show> };

export const ARCS_CHECKED = DATA.checked;
export const ARCS_REVIEWED = DATA.reviewed;

/** Arcs for a Kitsu slug, in episode order, or null. */
export function arcsFor(slug: string): Arc[] | null {
  const s = DATA.shows[slug];
  return s?.arcs.length ? [...s.arcs].sort((a, b) => a.from - b.from) : null;
}

/** The arc an episode belongs to (gaps between arcs, e.g. one-off filler, belong to none). Pure. */
export function arcOf(arcs: Arc[] | null, n: number): Arc | null {
  return arcs?.find((a) => n >= a.from && n <= (a.to ?? Infinity)) ?? null;
}

export const arcSources = (slug: string): string[] => DATA.shows[slug]?.sources ?? [];

/** "31–44", "1156 onward" (still airing), or "70" for a one-episode arc. Pure. */
export const arcRange = (a: Arc) => (a.to === null ? `${a.from} onward` : a.from === a.to ? String(a.from) : `${a.from}–${a.to}`);

/** "Romance Dawn (1–3), Orange Town (4–8), …" for an FAQ answer; filler arcs marked. Pure. */
export function arcSummary(arcs: Arc[]): string {
  return arcs.map((a) => `${a.name}${a.filler ? " (filler)" : ""}, episode${a.from === a.to ? "" : "s"} ${arcRange(a)}`).join("; ");
}
