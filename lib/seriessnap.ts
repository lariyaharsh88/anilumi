/**
 * Monthly snapshot of each popular series' full main and supporting cast (data/series-characters.json, built by
 * scripts/fetch-series-characters.mts): age, height, birthday, gender, favourites and Japanese voice. Feeds the
 * /anime/[slug]/characters tables. Bundled (Cloudflare Workers have no file system); parsed once per isolate, on first use. Server code only.
 */
import data from "@/data/series-characters.json";
import { unpackInPlace } from "./snapjson";

/** [id, name, image file, age, height, month, day, gender, favourites, M(ain)/S(upporting), [voice id, voice name]] */
export type SeriesChar = [number, string, string | null, string | null, string | null, number | null, number | null, string | null, number, "M" | "S", [number, string] | null];
type Snap = { generated: string; series: Record<string, { a: number; t: string; c: SeriesChar[] }> };

let snap: Snap | null = null;
function load(): Snap {
  if (snap) return snap;
  const d = data as unknown as Partial<Snap>;
  snap = d.series ? unpackInPlace(d as Snap) : { generated: "", series: {} };
  return snap;
}

export const seriesCast = (kitsuSlug: string) => load().series[kitsuSlug] ?? null;
export const seriesSlugs = () => Object.keys(load().series);
