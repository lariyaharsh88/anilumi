/**
 * The monthly AniList snapshot of the most-favourited characters (data/characters.json, built by
 * scripts/fetch-characters.mts). Character pages use it before any live AniList call, because AniList allows
 * only ~30 requests a minute and failed calls used to leave pages without voice actors or favourites. Pure.
 */
import data from "@/data/characters.json";
import type { AniListCharacter } from "./charfacts";

type Person = { id: number; n: string; i: string | null } | null;
export type SnapChar = {
  id: number; n: string; f: number; age: string | null; g: string | null; bt: string | null; m: number | null; d: number | null;
  l: [string, string][]; a: number; s: string; t: string; jp: Person; en: Person;
  /** Kitsu character page slug, when scripts/map-character-slugs.mts could match it. */
  k?: string;
};
const chars = (data as { characters: SnapChar[] }).characters;

const nameKey = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).sort().join(" ");
let byName: Map<string, SnapChar[]> | null = null;
let byAnime: Map<number, SnapChar[]> | null = null;

let bySlug: Map<string, SnapChar[]> | null = null;
const words = (s: string) => new Set(nameKey(s).split(" ").filter((w) => w.length > 1));

/**
 * Snapshot entry for a Kitsu character: same name (any word order) in one of their anime. Failing that, within
 * the same anime, a name whose words all appear in the other ("Luffy Monkey" ⊂ "Monkey D. Luffy").
 */
export function snapFor(name: string, animeSlugs: string[], src: SnapChar[] = chars): SnapChar | null {
  if (src === chars) { byName ??= group(chars, (c) => nameKey(c.n)); bySlug ??= group(chars, (c) => c.s); }
  const hits = src === chars ? byName!.get(nameKey(name)) || [] : src.filter((c) => nameKey(c.n) === nameKey(name));
  const inShow = hits.find((c) => animeSlugs.includes(c.s));
  if (inShow) return inShow;
  const mine = words(name);
  if (mine.size < 2) return null;
  const pool = src === chars ? animeSlugs.flatMap((s) => bySlug!.get(s) || []) : src.filter((c) => animeSlugs.includes(c.s));
  const near = pool.filter((c) => { const theirs = words(c.n); if (theirs.size < 2) return false; const [a, b] = theirs.size <= mine.size ? [theirs, mine] : [mine, theirs]; return [...a].every((w) => b.has(w)); });
  return near.length === 1 ? near[0] : null;
}

/** Everyone in the snapshot from the same anime, most-favourited first. Exact rank: anyone above them is in it too. */
export function showRanking(c: SnapChar, src: SnapChar[] = chars): SnapChar[] {
  if (src === chars) byAnime ??= group(chars, (x) => x.a);
  const list = src === chars ? byAnime!.get(c.a) || [] : src.filter((x) => x.a === c.a);
  return [...list].sort((x, y) => y.f - x.f);
}

/** Snapshot entry in the shape the live AniList fetch returns. */
export const snapToAniList = (c: SnapChar): AniListCharacter => ({
  age: c.age, gender: c.g, bloodType: c.bt, dateOfBirth: c.m && c.d ? { month: c.m, day: c.d } : null,
  lines: c.l.map(([label, value]) => ({ label, value })), favourites: c.f,
});

/** Kitsu page slugs of the most-favourited snapshot characters, for the sitemap. */
export const topCharacterSlugs = (limit = 1000): string[] =>
  [...chars].filter((c) => c.k).sort((a, b) => b.f - a.f).slice(0, limit).map((c) => c.k!);

export const snapGenerated = (data as { generated: string }).generated;

function group<K>(xs: SnapChar[], key: (c: SnapChar) => K): Map<K, SnapChar[]> {
  const m = new Map<K, SnapChar[]>();
  for (const x of xs) m.set(key(x), [...(m.get(key(x)) || []), x]);
  return m;
}
