/**
 * Monthly AniList snapshot for the most-followed anime (data/anime-al.json, built by scripts/fetch-anime-al.mts):
 * score and status counts (drop rates), tags (parents' guide), fan recommendations, key staff, episode length and
 * the direct sequel, plus each genre's median drop rate. From Render's shared IPs AniList often rate-limits, and a
 * failed call used to leave an anime page cached for a day without those sections. Read from disk once per
 * process. Server code only.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { unpackJson } from "./snapjson";
import type { AlTag, StatusCount } from "./insights";
import type { AlSequel, FanRec, KeyStaff } from "./anilist";

/** Tag as [name, rank, category, spoiler 0/1]; adult tags are never stored. */
type RawTag = [string, number, string, 0 | 1];
export type AlAnimeRaw = {
  d: number | null; g: string[]; s: number | null; sv: number; st: StatusCount[]; t: RawTag[];
  r: Omit<FanRec, "anime">[]; k: KeyStaff[]; q: AlSequel | null;
};
export type AlAnime = Omit<AlAnimeRaw, "t"> & { t: AlTag[] };
type Snap = { generated: string; anime: Record<string, AlAnimeRaw>; bench: Record<string, number> };

let snap: Snap | null = null;
function load(): Snap {
  if (snap) return snap;
  try {
    snap = unpackJson<Snap>(readFileSync(join(process.cwd(), "data", "anime-al.json"), "utf8"));
  } catch {
    snap = { generated: "", anime: {}, bench: {} }; // no snapshot yet: everything goes to live AniList
  }
  return snap;
}

export const toRawTags = (tags: AlTag[]): RawTag[] => tags.filter((x) => !x.isAdult).map((x) => [x.name, x.rank, x.category, x.isMediaSpoiler ? 1 : 0]);
const fromRawTags = (t: RawTag[]): AlTag[] => t.map(([name, rank, category, sp]) => ({ name, rank, category, isAdult: false, isMediaSpoiler: sp === 1 }));

/** Snapshot data for an AniList anime id, or null if it isn't one of the snapshot's titles. */
export function alAnime(anilistId: number): AlAnime | null {
  const raw = load().anime[String(anilistId)];
  return raw ? { ...raw, t: fromRawTags(raw.t) } : null;
}

/** Median drop rate of a genre's 50 most popular finished anime, from the snapshot. */
export const alBench = (genre: string): number | null => load().bench[genre] ?? null;
