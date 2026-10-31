/**
 * Monthly snapshot of the most-followed voice actors (data/voice-actors.json, built by
 * scripts/fetch-voice-actors.mts): the hub list plus each profile in the shape getVoiceActor returns.
 * From Render's shared IPs AniList often refuses or rate-limits, and voice-actor pages used to answer 500.
 * Bundled (Cloudflare Workers have no file system); parsed once per isolate, on first use. Server code only.
 */
import data from "@/data/voice-actors.json";
import type { PopularVa, VoiceActor } from "./anilist";

import { packJson, unpackJson, unpackInPlace } from "./snapjson";
export { IMG_PREFIX } from "./snapjson";

type Snap = { generated: string; hub: PopularVa[]; people: Record<string, VoiceActor> };
let snap: Snap | null = null;

function load(): Snap {
  if (snap) return snap;
  const d = data as unknown as Partial<Snap>;
  snap = d.people ? unpackInPlace(d as Snap) : { generated: "", hub: [], people: {} }; // empty: live AniList
  return snap;
}

/** JSON for the snapshot file, with image URLs shortened. Pure. */
export const packSnapshot = (s: Snap): string => packJson(s);

/** Inverse of packSnapshot. Pure. */
export const unpackSnapshot = (raw: string): Snap => unpackJson<Snap>(raw);

export const popularFromSnapshot = (): PopularVa[] => load().hub;
export const voiceActorFromSnapshot = (id: number): VoiceActor | null => load().people[String(id)] ?? null;
