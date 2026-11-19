/**
 * The daily character guessing game's rules, safe for the browser (lib/guessgame.ts builds the pools on the server).
 * Everyone gets the same character per mode per day: the pool is shuffled once with a seed per mode, and day N of the
 * India calendar takes the Nth character, so a mode only repeats once it has gone through its whole pool. Pure.
 */

export type GuessMode = "all" | "naruto" | "one-piece" | "demon-slayer" | "jujutsu-kaisen";
/** A character in a pool, with only what the game compares or shows. */
export type GChar = {
  id: number;
  /** Display name, plus other names the autocomplete matches. */
  n: string; al?: string[];
  /** Series (all-anime mode): a franchise key and its display name. */
  s?: string; t?: string;
  g: string | null;
  /** M(ain) or S(upporting) in its series' cast. */
  r: "M" | "S" | null;
  /** Birthday month 1-12, height in cm, age (first number), Japanese voice actor. */
  m: number | null; h: number | null; a: number | null; v: string | null;
  /** AniList image file and our character page slug, when there is one (charImage / charPage give the URLs). */
  i: string | null; p: string | null;
};
export const charImage = (c: GChar) => (c.i ? (/^https?:/.test(c.i) ? c.i : `https://s4.anilist.co/file/anilistcdn/character/medium/${c.i}`) : null);
export const charPage = (c: GChar) => (c.p ? `/character/${c.p}` : null);
export type Attr = "series" | "gender" | "role" | "month" | "height" | "age" | "voice";
export type Verdict = "hit" | "near" | "miss" | "unknown";
export type Cell = { k: Attr; v: string; s: Verdict; dir?: "up" | "down" };

export const MAX_GUESSES = 8;
export const ATTR_LABEL: Record<Attr, string> = { series: "Series", gender: "Gender", role: "Role", month: "Birthday", height: "Height", age: "Age", voice: "Voice (JP)" };
export const attrsFor = (mode: GuessMode): Attr[] => (mode === "all" ? ["series", "gender", "role", "month", "height", "age", "voice"] : ["gender", "role", "month", "height", "age", "voice"]);

const IST_MS = 5.5 * 3600 * 1000;
const DAY_MS = 86400000;
/** Day number on the India calendar (IST): the game resets at midnight IST. */
export const istDay = (now = Date.now()) => Math.floor((now + IST_MS) / DAY_MS);
/** "2026-11-19" for an IST day number. */
export const istDate = (day: number) => new Date(day * DAY_MS).toISOString().slice(0, 10);
/** Milliseconds until the next midnight IST. */
export const msToNextDay = (now = Date.now()) => (istDay(now) + 1) * DAY_MS - IST_MS - now;

function hash(s: string) {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); }
  return h >>> 0;
}
function rng(seed: number) {
  let a = seed;
  return () => { a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
}
/** The pool in a fixed, mode-seeded order (sorted by id first, so the order doesn't depend on how the pool was built). */
export function dailyOrder<T extends { id: number }>(pool: T[], mode: string): T[] {
  const out = [...pool].sort((x, y) => x.id - y.id);
  const r = rng(hash(`anilumi-guess:${mode}`));
  for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(r() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
  return out;
}
/** The character for a mode on an IST day. */
export function dailyPick<T extends { id: number }>(pool: T[], mode: string, day: number): T {
  const order = dailyOrder(pool, mode);
  return order[((day % order.length) + order.length) % order.length];
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const exact = (k: Attr, g: string | null | undefined, a: string | null | undefined, shown: string | null | undefined): Cell =>
  g == null || a == null ? { k, v: shown ?? "?", s: "unknown" } : { k, v: shown ?? g, s: g === a ? "hit" : "miss" };
/** Numbers: a hit when equal, near within `close`, and an arrow pointing to where the answer is. */
function num(k: Attr, g: number | null, a: number | null, close: number, show: (n: number) => string): Cell {
  if (g == null || a == null) return { k, v: g == null ? "?" : show(g), s: "unknown" };
  if (g === a) return { k, v: show(g), s: "hit" };
  return { k, v: show(g), s: Math.abs(g - a) <= close ? "near" : "miss", dir: a > g ? "up" : "down" };
}

/** One guess's row: each attribute of the guess compared with the answer. */
export function compare(guess: GChar, answer: GChar, attrs: Attr[]): Cell[] {
  return attrs.map((k) => {
    switch (k) {
      case "series": return exact(k, guess.s ?? null, answer.s ?? null, guess.t ?? guess.s);
      case "gender": return exact(k, guess.g, answer.g, guess.g);
      case "role": return exact(k, guess.r, answer.r, guess.r === "M" ? "Main" : guess.r === "S" ? "Supporting" : null);
      case "voice": return exact(k, guess.v, answer.v, guess.v);
      case "month": return num(k, guess.m, answer.m, 1, (n) => MONTHS[n - 1] ?? "?");
      case "height": return num(k, guess.h, answer.h, 5, (n) => `${n} cm`);
      case "age": return num(k, guess.a, answer.a, 3, (n) => String(n));
    }
  });
}

const EMOJI: Record<Verdict, string> = { hit: "🟩", near: "🟨", miss: "🟥", unknown: "⬛" };
/** The Wordle-style result to share: one emoji row per guess, no names. */
export function shareText(title: string, day: number, rows: Cell[][], won: boolean, url: string): string {
  return `${title} ${istDate(day)}: ${won ? rows.length : "X"}/${MAX_GUESSES}\n${rows.map((r) => r.map((c) => EMOJI[c.s]).join("")).join("\n")}\n${url}`;
}

const norm = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
/** Autocomplete: characters whose name or other names contain every typed word, minus ones already guessed. */
export function suggest(pool: GChar[], q: string, used: Set<number>, limit = 8): GChar[] {
  const words = norm(q).split(" ").filter(Boolean);
  if (!words.length) return [];
  return pool.filter((c) => !used.has(c.id) && [c.n, ...(c.al ?? [])].some((name) => { const k = norm(name); return words.every((w) => k.includes(w)); })).slice(0, limit);
}
