/**
 * JSON for snapshot files with AniList image URLs shortened ("~/" for the CDN prefix), which roughly halves files
 * that are mostly image links. Pure.
 */
export const IMG_PREFIX = "https://s4.anilist.co/file/anilistcdn/";
const SHORT = "~/";

export const packJson = (v: unknown): string =>
  JSON.stringify(v, (_k, x) => (typeof x === "string" && x.startsWith(IMG_PREFIX) ? SHORT + x.slice(IMG_PREFIX.length) : x));

export const unpackJson = <T>(raw: string): T =>
  JSON.parse(raw, (_k, x) => (typeof x === "string" && x.startsWith(SHORT) ? IMG_PREFIX + x.slice(SHORT.length) : x)) as T;
