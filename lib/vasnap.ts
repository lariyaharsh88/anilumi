/**
 * Monthly snapshot of the most-followed voice actors (data/voice-actors.json, built by
 * scripts/fetch-voice-actors.mts): the hub list plus each profile in the shape getVoiceActor returns.
 * From Render's shared IPs AniList often refuses or rate-limits, and voice-actor pages used to answer 500.
 * Read from disk once per process rather than bundled, since it's a few megabytes. Server code only.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { PopularVa, VoiceActor } from "./anilist";

import { packJson, unpackJson } from "./snapjson";
export { IMG_PREFIX } from "./snapjson";

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
export const packSnapshot = (s: Snap): string => packJson(s);

/** Inverse of packSnapshot. Pure. */
export const unpackSnapshot = (raw: string): Snap => unpackJson<Snap>(raw);

export const popularFromSnapshot = (): PopularVa[] => load().hub;
export const voiceActorFromSnapshot = (id: number): VoiceActor | null => load().people[String(id)] ?? null;
