/**
 * Monthly snapshot of the most-followed anime's casts (data/casts.json, built by scripts/fetch-casts.mts).
 * Read from disk once per process rather than bundled, since it's a couple of megabytes. Server code only.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { Cast, CastEntry, Va } from "./anilist";

type P = [number, string, string | null, string | null] | null;
type Raw = { t: number; e: { r: "M" | "S" | "B"; c: [number, string, string | null, string | null, number]; jp: P; en: P; o: number }[] };
let casts: Record<string, Raw> | null = null;

function load(): Record<string, Raw> {
  if (casts) return casts;
  try {
    casts = (JSON.parse(readFileSync(join(process.cwd(), "data", "casts.json"), "utf8")) as { casts: Record<string, Raw> }).casts;
  } catch {
    casts = {}; // no snapshot yet: everything falls back to live AniList
  }
  return casts;
}

const ROLE = { M: "MAIN", S: "SUPPORTING", B: "BACKGROUND" } as const;
const va = (p: P): Va | null => (p ? { id: p[0], name: p[1], native: p[2], image: p[3] } : null);

/** The snapshot cast for an AniList anime id (first `perPage` characters), or null if it isn't in the snapshot. */
export function castFromSnapshot(anilistId: number, perPage = 25): Cast | null {
  const raw = load()[String(anilistId)];
  if (!raw || perPage > 25) return null;
  const entries: CastEntry[] = raw.e.slice(0, perPage).map((x) => ({
    character: { id: x.c[0], name: x.c[1], native: x.c[2], image: x.c[3], favourites: x.c[4] },
    role: ROLE[x.r],
    jp: va(x.jp),
    en: va(x.en),
    otherDubs: x.o,
  }));
  return { anilistId, total: raw.t, entries };
}
