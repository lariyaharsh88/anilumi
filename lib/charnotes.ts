/**
 * Verified facts for the most-searched characters (data/character-notes.json): role, first appearance in the anime
 * and the source, key arcs, affiliations and family, each cross-checked against the series wiki and Wikipedia.
 * Draft until a person reviews the file. Pure.
 */
import data from "@/data/character-notes.json";
import { arcsFor, type Arc } from "./arcs";

export type CharacterNote = {
  name: string; role: string | null;
  debut: { anime: string | null; episode: number | null; episodeTitle: string | null; source: "manga" | "light novel" | null; chapter: number | null; volume: number | null } | null;
  arcs: string[]; affiliations: string[]; relatives: { name: string; relation: string }[];
  confidence: "high" | "medium"; sources: string[]; notes?: string;
  /** Spoiler-free: what they can do as introduced. */
  abilities?: string | null;
  /** "Does X die?": shown only behind a spoiler toggle. */
  fate?: { status: "alive" | "dies" | "revived" | "unclear"; detail: string; basis: string } | null;
  /** Official Hindi dub voice, only when credited by an official or first-hand source. */
  hindiVoice?: { name: string; dub: string; sources: string[] } | null;
};
const DATA = data as unknown as { checked: string | null; reviewed: string | null; characters: Record<string, CharacterNote> };
export const NOTES_CHECKED = DATA.checked;
export const NOTES_REVIEWED = DATA.reviewed;

export const characterNote = (slug: string): CharacterNote | null => DATA.characters[slug] ?? null;

const bare = (s: string) => s.toLowerCase().replace(/\barc\b/g, "").replace(/^the\s+/, "").replace(/[^a-z0-9]+/g, " ").trim();
/** The note's arc names matched to the show's arc list (data/arcs.json), for links to the episode list. */
export function linkedArcs(note: CharacterNote, showSlug: string | null | undefined): { name: string; arc: Arc | null }[] {
  const arcs = showSlug ? arcsFor(showSlug) : null;
  return note.arcs.map((name) => ({ name: name.replace(/\s+arc$/i, ""), arc: arcs?.find((a) => bare(a.name) === bare(name)) ?? null }));
}

/** "Episode 1 of Attack on Titan" link target, when the debut is in the character's main show. */
export const debutInShow = (note: CharacterNote, showTitle: string | null | undefined) =>
  Boolean(note.debut?.anime && note.debut.episode && showTitle && bare(note.debut.anime) === bare(showTitle));
