/**
 * JSON for snapshot files with AniList image URLs shortened ("~/" for the CDN prefix), which roughly halves files
 * that are mostly image links. Pure.
 */
export const IMG_PREFIX = "https://s4.anilist.co/file/anilistcdn/";
const SHORT = "~/";

export const packJson = (v: unknown): string =>
  JSON.stringify(v, (_k, x) => (typeof x === "string" && x.startsWith(IMG_PREFIX) ? SHORT + x.slice(IMG_PREFIX.length) : x));

/** packJson's shortening undone in place on an already-parsed (e.g. bundled) value. Returns it. */
export function unpackInPlace<T>(v: T): T {
  const walk = (x: unknown): unknown => {
    if (typeof x === "string") return x.startsWith(SHORT) ? IMG_PREFIX + x.slice(SHORT.length) : x;
    if (Array.isArray(x)) { for (let i = 0; i < x.length; i++) x[i] = walk(x[i]); return x; }
    if (x && typeof x === "object") { for (const k of Object.keys(x)) (x as Record<string, unknown>)[k] = walk((x as Record<string, unknown>)[k]); return x; }
    return x;
  };
  return walk(v) as T;
}

export const unpackJson = <T>(raw: string): T =>
  JSON.parse(raw, (_k, x) => (typeof x === "string" && x.startsWith(SHORT) ? IMG_PREFIX + x.slice(SHORT.length) : x)) as T;
