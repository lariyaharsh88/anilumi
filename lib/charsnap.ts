/**
 * The monthly AniList snapshot of the most-favourited characters (data/characters.json, built by
 * scripts/fetch-characters.mts). Character pages use it before any live AniList call, because AniList allows
 * only ~30 requests a minute and failed calls used to leave pages without voice actors or favourites. Pure.
 */
import data from "@/data/characters.json";
import { ageNum, heightCm, type AniListCharacter } from "./charfacts";
import { seriesCast, seriesSlugs, type SeriesChar } from "./seriessnap";

type Person = { id: number; n: string; i: string | null } | null;
export type SnapChar = {
  id: number; n: string; f: number; age: string | null; g: string | null; bt: string | null; m: number | null; d: number | null;
  l: [string, string][]; a: number; s: string; t: string; jp: Person; en: Person;
  /** Kitsu character page slug, when scripts/map-character-slugs.mts could match it. */
  k?: string;
  /** Other names ("Eren Jaeger"), never spoiler names. */
  al?: string[];
  /** AniList image file name, without CHAR_IMG. */
  i?: string;
};
const CHAR_IMG = "https://s4.anilist.co/file/anilistcdn/character/medium/";
const chars = (data as { characters: SnapChar[] }).characters;

const nameKey = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).sort().join(" ");
let byName: Map<string, SnapChar[]> | null = null;
let byAnime: Map<number, SnapChar[]> | null = null;
let pathById: Map<number, string> | null = null;

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

/** Our character page for an AniList character id, if the snapshot matched one (cast, voice-actor and birthday pages link through this). */
export function characterPathFor(anilistId: number): string | null {
  pathById ??= new Map(chars.filter((c) => c.k).map((c) => [c.id, `/character/${c.k}`]));
  return pathById.get(anilistId) ?? null;
}

/** AniList keeps the same file name at /large/ (230px wide) as at /medium/ (100px). */
export const snapImage = (c: SnapChar, size: "medium" | "large" = "medium"): string | null => (c.i ? (size === "large" ? CHAR_IMG.replace("/medium/", "/large/") : CHAR_IMG) + c.i : null);

let byK: Map<string, SnapChar> | null = null;
/** Snapshot entry for one of our character pages, by its slug. */
export function snapByPage(slug: string): SnapChar | null {
  byK ??= new Map(chars.filter((c) => c.k).map((c) => [c.k!, c]));
  return byK.get(slug) ?? null;
}

/** Most-favourited characters that have a page here, for the /characters hub. */
export const popularCharacters = (limit = 100): SnapChar[] => [...chars].filter((c) => c.k).sort((a, b) => b.f - a.f).slice(0, limit);

export const snapGenerated = (data as { generated: string }).generated;

function group<K>(xs: SnapChar[], key: (c: SnapChar) => K): Map<K, SnapChar[]> {
  const m = new Map<K, SnapChar[]>();
  for (const x of xs) m.set(key(x), [...(m.get(key(x)) || []), x]);
  return m;
}

export type TableRow = { c: SnapChar; age: string | null; ageN: number | null; height: string | null; cm: number | null };
let bySlug2: Map<string, SnapChar[]> | null = null;
let byId: Map<number, SnapChar> | null = null;

/** A full-cast entry (lib/seriessnap) in the popular snapshot's shape, keeping its page slug when it has one. Pure. */
export function fromSeries(x: SeriesChar, slug: string, a: number, t: string, known?: SnapChar): SnapChar {
  const [id, n, i, age, h, m, d, g, f, , va] = x;
  return known ?? { id, n, f, age, g, bt: null, m, d, l: h ? [["Height", h]] : [], a, s: slug, t, jp: va ? { id: va[0], n: va[1], i: null } : null, en: null, ...(i ? { i } : {}) };
}

/**
 * The characters of one anime (by its Kitsu slug), most-favourited first, with age and height parsed: the full
 * main and supporting cast when the series snapshot has it, plus anyone popular it missed. Null when there's too
 * little for a useful table: at least 4 characters with 3 known heights or ages.
 */
export function characterTable(animeSlug: string, src: SnapChar[] = chars, series = src === chars ? seriesCast(animeSlug) : null): TableRow[] | null {
  if (src === chars) { bySlug2 ??= group(chars, (c) => c.s); byId ??= new Map(chars.map((c) => [c.id, c])); }
  const popular = src === chars ? bySlug2!.get(animeSlug) || [] : src.filter((c) => c.s === animeSlug);
  const known = (id: number) => (src === chars ? byId!.get(id) : src.find((c) => c.id === id));
  const merged = new Map<number, SnapChar>();
  for (const x of series?.c || []) merged.set(x[0], fromSeries(x, animeSlug, series!.a, series!.t, known(x[0])));
  for (const c of popular) if (!merged.has(c.id)) merged.set(c.id, c);
  const rows = [...merged.values()].sort((a, b) => b.f - a.f).map((c) => {
    const height = c.l.find(([k]) => k.toLowerCase() === "height")?.[1] ?? null;
    return { c, age: c.age, ageN: ageNum(c.age), height, cm: heightCm(height) };
  });
  const count = (f: (r: TableRow) => unknown) => rows.filter(f).length;
  return rows.length >= 4 && (count((r) => r.cm) >= 3 || count((r) => r.ageN !== null) >= 3) ? rows : null;
}

/** Anime slugs that get a characters table (sitemap, anime page links). */
export const characterTableSlugs = (): string[] => [...new Set([...chars.map((c) => c.s), ...seriesSlugs()])].filter((s) => characterTable(s));
