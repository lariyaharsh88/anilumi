/** Birthday pages from the data/birthdays.json snapshot (see scripts/fetch-birthdays.mts). Pure. */
import data from "@/data/birthdays.json";

export type BdChar = { id: number; n: string; i: string | null; m: number; d: number; f: number; s: string | null; t: string };
export type BdPerson = { id: number; n: string; j: string | null; i: string | null; m: number; d: number; y: number | null; f: number; l: string | null };

export const MONTHS = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
export const DAYS_IN = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
export const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

export const bdPath = (m: number, d: number) => `/birthdays/${MONTHS[m - 1]}/${d}`;
export const bdLabel = (m: number, d: number) => `${cap(MONTHS[m - 1])} ${d}`;
export const monthPath = (m: number) => `/birthdays/${MONTHS[m - 1]}`;

/** "october" → 10, or null. */
export const parseMonth = (month: string): number | null => (MONTHS.includes(month.toLowerCase()) && month === month.toLowerCase() ? MONTHS.indexOf(month) + 1 : null);

/** "/birthdays/march/30" params → {m: 3, d: 30}, or null when the date doesn't exist. */
export function parseBdParams(month: string, day: string): { m: number; d: number } | null {
  const m = MONTHS.indexOf(month.toLowerCase()) + 1;
  const d = Number(day);
  if (!m || !Number.isInteger(d) || d < 1 || d > DAYS_IN[m - 1] || String(d) !== day) return null;
  return { m, d };
}

/** Every calendar day, Jan 1 → Dec 31 (Feb 29 included). */
export const allDays = () => MONTHS.flatMap((_, mi) => Array.from({ length: DAYS_IN[mi] }, (_, di) => ({ m: mi + 1, d: di + 1 })));

const chars = data.characters as BdChar[];
const people = data.people as BdPerson[];
export const bdGenerated = data.generated as string;

export function birthdaysOn(m: number, d: number, src: { characters: BdChar[]; people: BdPerson[] } = { characters: chars, people }) {
  return {
    characters: src.characters.filter((c) => c.m === m && c.d === d).sort((x, y) => y.f - x.f),
    people: src.people.filter((p) => p.m === m && p.d === d).sort((x, y) => y.f - x.f),
  };
}

/** Everyone born in a month, most-favourited first. Pure. */
export function birthdaysIn(m: number, src: { characters: BdChar[]; people: BdPerson[] } = { characters: chars, people }) {
  return {
    characters: src.characters.filter((c) => c.m === m).sort((x, y) => y.f - x.f),
    people: src.people.filter((p) => p.m === m).sort((x, y) => y.f - x.f),
  };
}

/** Today's month/day in Japan, where the shows air. */
export function todayJst(now = new Date()): { m: number; d: number } {
  const p = new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Tokyo", month: "numeric", day: "numeric" }).formatToParts(now);
  return { m: Number(p.find((x) => x.type === "month")!.value), d: Number(p.find((x) => x.type === "day")!.value) };
}

/** Next n days after (m, d), wrapping at year end. */
export function nextDays(m: number, d: number, n: number) {
  const days = allDays();
  const i = days.findIndex((x) => x.m === m && x.d === d);
  return Array.from({ length: n }, (_, k) => days[(i + 1 + k) % days.length]);
}

/** "Yeager, Eren" and "Eren Yeager" → the same key (accents dropped, word order ignored). Pure. */
const nameKey = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().split(/[^a-z0-9]+/).filter(Boolean).sort().join(" ");

/**
 * A character's birthday from the snapshot, matched by name. When several characters share a name, the one
 * whose anime is among `animeSlugs` (the character's Kitsu appearances) wins; otherwise no guess. Pure.
 */
export function birthdayFor(name: string, animeSlugs: string[] = [], src: BdChar[] = chars): BdChar | null {
  const k = nameKey(name);
  if (!k) return null;
  const hits = src.filter((c) => nameKey(c.n) === k);
  if (hits.length <= 1) return hits[0] ?? null;
  return hits.find((c) => c.s && animeSlugs.includes(c.s)) ?? null;
}
