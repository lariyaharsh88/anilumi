/**
 * Monthly snapshot of the most-followed voice actors (data/voice-actors.json, built by
 * scripts/fetch-voice-actors.mts): the hub list plus each profile in the shape getVoiceActor returns.
 * From Render's shared IPs AniList often refuses or rate-limits, and voice-actor pages used to answer 500.
 * Read from disk once per process rather than bundled, since it's a few megabytes. Server code only.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { PopularVa, VoiceActor } from "./anilist";

/** AniList image URLs are stored without this prefix to keep the file small. */
export const IMG_PREFIX = "https://s4.anilist.co/file/anilistcdn/";
const SHORT = "~/";

type Snap = { generated: string; hub: PopularVa[]; people: Record<string, VoiceActor> };
let snap: Snap | null = null;

function load(): Snap {
  if (snap) return snap;
  try {
    snap = unpackSnapshot(readFileSync(join(process.cwd(), "data", "voice-actors.json"), "utf8"));
  } catch {
    snap = { generated: "", hub: [], people: {} }; // no snapshot yet: everything falls back to live AniList
  }
  return snap;
}

/** JSON for the snapshot file, with image URLs shortened. Pure. */
export const packSnapshot = (s: Snap): string =>
  JSON.stringify(s, (_k, v) => (typeof v === "string" && v.startsWith(IMG_PREFIX) ? SHORT + v.slice(IMG_PREFIX.length) : v));

/** Inverse of packSnapshot. Pure. */
export const unpackSnapshot = (raw: string): Snap =>
  JSON.parse(raw, (_k, v) => (typeof v === "string" && v.startsWith(SHORT) ? IMG_PREFIX + v.slice(SHORT.length) : v)) as Snap;

export const popularFromSnapshot = (): PopularVa[] => load().hub;
export const voiceActorFromSnapshot = (id: number): VoiceActor | null => load().people[String(id)] ?? null;
