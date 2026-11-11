/**
 * Hindi anime dub voice artists (data/hindi-voice-artists.json): who voices which character in the official Hindi
 * dubs, each role confirmed by an official credit, the studio's or artist's own post, or two independent reports.
 * Pure.
 */
import data from "@/data/hindi-voice-artists.json";

export type HindiRole = { character: string; anime: string; slug: string | null; dub: string; sources: string[] };
export type HindiArtist = { name: string; slug: string; knownAs?: string[]; bio: string; roles: HindiRole[]; links?: string[]; sources: string[]; confidence: "high" | "medium" };

const D = data as unknown as { checked: string | null; artists: HindiArtist[] };
export const HINDI_VOICES_CHECKED = D.checked;
export const hindiArtists = (): HindiArtist[] => [...D.artists].sort((a, b) => b.roles.length - a.roles.length || a.name.localeCompare(b.name));
export const hindiArtist = (slug: string): HindiArtist | null => D.artists.find((a) => a.slug === slug) ?? null;
export const hindiArtistPath = (a: { slug: string }) => `/hindi-voice-artist/${a.slug}`;

const key = (s: string) => s.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
/** The artist page for a name ("Rajesh Kava"), when we have one. */
export function hindiArtistByName(name: string): HindiArtist | null {
  const k = key(name);
  return D.artists.find((a) => key(a.name) === k || a.knownAs?.some((x) => key(x) === k)) ?? null;
}
