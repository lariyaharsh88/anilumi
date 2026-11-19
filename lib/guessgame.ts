/**
 * Pools for the daily character guessing game (/guess-the-anime-character), built on the server from the character
 * snapshots and handed to the page as compact rows (lib/guessgame-core.ts has the rules). "guess the anime character"
 * 320 a month and "anime character guess" 320 (Keyword Planner, India, Nov 2026); "guess the anime" 4.4K in the US;
 * the per-series modes cover "naruto quiz" 1K, "one piece quiz" 880 and "demon slayer quiz" 1.3K. Server code only.
 */
import { fanName } from "./charnames";
import data from "@/data/characters.json";
import { characterPathFor, type SnapChar } from "./charsnap";
import { seriesCast, roleIn } from "./seriessnap";
import { ageNum, heightCm } from "./charfacts";
import type { GChar, GuessMode } from "./guessgame-core";

export type GuessModeDef = { mode: GuessMode; path: string; name: string; series: string[]; anime: string | null; emoji: string };
export const GUESS_MODES: GuessModeDef[] = [
  { mode: "all", path: "/guess-the-anime-character", name: "Anime", series: [], anime: null, emoji: "🎯" },
  { mode: "naruto", path: "/guess-the-anime-character/naruto", name: "Naruto", series: ["naruto", "naruto-shippuden"], anime: "naruto", emoji: "🍥" },
  { mode: "one-piece", path: "/guess-the-anime-character/one-piece", name: "One Piece", series: ["one-piece"], anime: "one-piece", emoji: "🏴‍☠️" },
  { mode: "demon-slayer", path: "/guess-the-anime-character/demon-slayer", name: "Demon Slayer", series: ["kimetsu-no-yaiba"], anime: "kimetsu-no-yaiba", emoji: "🗡️" },
  { mode: "jujutsu-kaisen", path: "/guess-the-anime-character/jujutsu-kaisen", name: "Jujutsu Kaisen", series: ["jujutsu-kaisen"], anime: "jujutsu-kaisen", emoji: "🌀" },
];
export const guessMode = (mode: string) => GUESS_MODES.find((m) => m.mode === mode) ?? null;

const chars = (data as { characters: SnapChar[] }).characters;
/** Image file under AniList's medium character folder, and our page slug: the browser adds the prefixes (smaller pages). */
const img = (file: string | null | undefined) => (!file ? null : file.replace(/^https?:\/\/[^]*\/character\/(medium|large)\//, ""));
const page = (id: number) => characterPathFor(id)?.replace(/^\/character\//, "") ?? null;

/** One franchise per series in the all-anime mode (JoJo's parts, Naruto and Shippuden), with an English name. */
const FRANCHISE: [RegExp, string, string][] = [
  [/jojo/, "jojo", "JoJo's Bizarre Adventure"], [/^naruto/, "naruto", "Naruto"], [/^dragon-ball/, "dragon-ball", "Dragon Ball"],
  [/^kimetsu-no-yaiba/, "kimetsu-no-yaiba", "Demon Slayer"], [/^boku-no-hero-academia/, "boku-no-hero-academia", "My Hero Academia"],
  [/^kaguya-sama/, "kaguya-sama", "Kaguya-sama: Love Is War"], [/^kono-subarashii/, "konosuba", "KonoSuba"], [/^re-zero/, "re-zero", "Re:Zero"],
  [/^sousou-no-frieren/, "frieren", "Frieren"], [/^bungou-stray-dogs/, "bungou-stray-dogs", "Bungo Stray Dogs"], [/^5-toubun/, "quintuplets", "The Quintessential Quintuplets"],
  [/^yahari-ore/, "oregairu", "My Teen Romantic Comedy SNAFU"], [/^mushoku-tensei/, "mushoku-tensei", "Mushoku Tensei"], [/^ansatsu-kyoushitsu/, "ansatsu-kyoushitsu", "Assassination Classroom"],
  [/^yakusoku-no-neverland/, "neverland", "The Promised Neverland"], [/^enen-no-shouboutai/, "fire-force", "Fire Force"], [/^berserk/, "berserk", "Berserk"],
  [/^seishun-buta-yarou/, "bunny-girl", "Bunny Girl Senpai"], [/^mahou-shoujo-madoka/, "madoka", "Madoka Magica"], [/^koe-no-katachi/, "a-silent-voice", "A Silent Voice"],
  [/^kanojo-okarishimasu/, "rent-a-girlfriend", "Rent-a-Girlfriend"], [/^hunter-x-hunter/, "hunter-x-hunter", "Hunter x Hunter"], [/^fruits-basket/, "fruits-basket", "Fruits Basket"],
  [/^oshi-no-ko/, "oshi-no-ko", "Oshi no Ko"], [/^bleach/i, "bleach", "Bleach"], [/^blue-lock/i, "blue-lock", "Blue Lock"], [/^attack-on-titan|^shingeki/, "attack-on-titan", "Attack on Titan"],
  [/^spy-x-family/, "spy-x-family", "Spy x Family"], [/^jujutsu-kaisen/, "jujutsu-kaisen", "Jujutsu Kaisen"], [/^one-piece/, "one-piece", "One Piece"],
];
function franchise(slug: string, title: string): { s: string; t: string } {
  const hit = FRANCHISE.find(([re]) => re.test(slug));
  return hit ? { s: hit[1], t: hit[2] } : { s: slug.toLowerCase(), t: title };
}
const facts = (c: GChar) => [c.m, c.h, c.a, c.v].filter((x) => x != null).length;
const heightOf = (c: SnapChar) => heightCm(c.l.find(([k]) => k.toLowerCase() === "height")?.[1]);

let cache: Map<GuessMode, GChar[]> | null = null;

/** All-anime mode: the 300 most-favourited characters with a gender and at least three other facts. */
function allPool(): GChar[] {
  return [...chars].sort((x, y) => y.f - x.f).flatMap((c): GChar[] => {
    const role = roleIn(c.s, c.id);
    const row: GChar = { id: c.id, n: fanName(c), ...(c.al?.length ? { al: c.al.filter((x) => /^[\x20-\x7e]+$/.test(x)).slice(0, 2) } : {}), ...franchise(c.s, c.t), g: c.g, r: role === "main" ? "M" : role === "supporting" ? "S" : null, m: c.m, h: heightOf(c), a: ageNum(c.age), v: c.jp?.n ?? null, i: img(c.i), p: page(c.id) };
    return row.g && facts(row) >= 3 ? [row] : [];
  }).slice(0, 300);
}

/** A series mode: its full snapshot cast with a gender and two other facts, at least 150 favourites, top 60. */
function seriesPool(slugs: string[]): GChar[] {
  const byId = new Map(chars.map((c) => [c.id, c]));
  const seen = new Map<number, { row: GChar; fav: number }>();
  for (const slug of slugs) {
    for (const [id, name, file, age, height, month, , gender, fav, role, voice] of seriesCast(slug)?.c ?? []) {
      if (seen.has(id) || fav < 150) continue;
      const snap = byId.get(id);
      const row: GChar = { id, n: fanName({ id, n: name }), ...(snap?.al?.length ? { al: snap.al.filter((x) => /^[\x20-\x7e]+$/.test(x)).slice(0, 2) } : {}), g: gender, r: role, m: month, h: heightCm(height), a: ageNum(age), v: voice?.[1] ?? null, i: img(file), p: page(id) };
      if (row.g && facts(row) >= 2) seen.set(id, { row, fav });
    }
  }
  return [...seen.values()].sort((x, y) => y.fav - x.fav).slice(0, 60).map((x) => x.row);
}

/** The pool for a mode (built once per isolate). */
export function guessPool(mode: GuessMode): GChar[] {
  cache ??= new Map();
  let pool = cache.get(mode);
  if (!pool) {
    const def = guessMode(mode);
    pool = !def || mode === "all" ? allPool() : seriesPool(def.series);
    cache.set(mode, pool);
  }
  return pool;
}
