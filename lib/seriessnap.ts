/**
 * Monthly snapshot of each popular series' full main and supporting cast (data/series-characters.json, built by
 * scripts/fetch-series-characters.mts): age, height, birthday, gender, favourites and Japanese voice. Feeds the
 * /anime/[slug]/characters tables. Read from disk once per process. Server code only.
 */
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { unpackJson } from "./snapjson";

/** [id, name, image file, age, height, month, day, gender, favourites, M(ain)/S(upporting), [voice id, voice name]] */
export type SeriesChar = [number, string, string | null, string | null, string | null, number | null, number | null, string | null, number, "M" | "S", [number, string] | null];
type Snap = { generated: string; series: Record<string, { a: number; t: string; c: SeriesChar[] }> };

let snap: Snap | null = null;
function load(): Snap {
  if (snap) return snap;
  try {
    snap = unpackJson<Snap>(readFileSync(join(process.cwd(), "data", "series-characters.json"), "utf8"));
  } catch {
    snap = { generated: "", series: {} };
  }
  return snap;
}

export const seriesCast = (kitsuSlug: string) => load().series[kitsuSlug] ?? null;
export const seriesSlugs = () => Object.keys(load().series);
