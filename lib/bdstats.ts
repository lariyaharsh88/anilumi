/**
 * Birthday pages in depth: the date's characters as comparison rows, and the numbers behind them (roles, genders,
 * oldest and tallest, blood types, series) for the "at a glance" section and FAQ. From the monthly character
 * snapshot; characters missing from it are skipped. Pure given the data.
 */
import { snapById } from "./charsnap";
import { compareRow, type CompareRow } from "./charcompare";
import type { BdChar } from "./birthdays";

export const birthdayRows = (chars: { id: number }[], limit = Infinity): CompareRow[] =>
  chars.flatMap((c) => { const s = snapById(c.id); return s ? [compareRow(s)] : []; }).slice(0, limit);

export type BdStats = {
  count: number; main: number; supporting: number; female: number; male: number; series: number; fans: number;
  oldest: CompareRow | null; youngest: CompareRow | null; tallest: CompareRow | null; shortest: CompareRow | null;
  blood: { type: string; names: string[] } | null;
};

const pick = (rows: CompareRow[], v: (r: CompareRow) => number | null, dir: 1 | -1) => {
  const has = rows.filter((r) => v(r) != null);
  return has.length >= 2 ? has.reduce((a, b) => (dir * (v(b)! - v(a)!) > 0 ? b : a)) : null;
};

export function birthdayStats(chars: BdChar[]): BdStats | null {
  const rows = birthdayRows(chars);
  if (rows.length < 2) return null;
  const g = (want: string) => chars.filter((c) => snapById(c.id)?.g?.toLowerCase() === want).length;
  const byBlood = new Map<string, string[]>();
  for (const r of rows) if (r.bloodType) byBlood.set(r.bloodType, [...(byBlood.get(r.bloodType) ?? []), r.name]);
  const top = [...byBlood].sort((a, b) => b[1].length - a[1].length)[0];
  const oldest = pick(rows, (r) => r.ageNum, 1), youngest = pick(rows, (r) => r.ageNum, -1);
  const tallest = pick(rows, (r) => r.heightCm, 1), shortest = pick(rows, (r) => r.heightCm, -1);
  return {
    count: chars.length, main: rows.filter((r) => r.role === "main").length, supporting: rows.filter((r) => r.role === "supporting").length,
    female: g("female"), male: g("male"), series: new Set(chars.map((c) => c.t)).size, fans: chars.reduce((n, c) => n + c.f, 0),
    oldest, youngest: youngest && youngest.id !== oldest?.id ? youngest : null,
    tallest, shortest: shortest && shortest.id !== tallest?.id ? shortest : null,
    blood: top && top[1].length >= 2 ? { type: top[0], names: top[1] } : null,
  };
}

const n = (k: number, what: string) => `${k} ${what}${k === 1 ? "" : "s"}`;
/** "3 main characters and 1 supporting character." with zero counts left out. */
const split = (a: number, aw: string, b: number, bw: string) => {
  const p = [a ? n(a, aw) : "", b ? n(b, bw) : ""].filter(Boolean);
  return p.length ? `${p.join(" and ")[0].toUpperCase()}${p.join(" and ").slice(1)}.` : "";
};

/** "12-17 (Naruto), 27- (Boruto)" → "12-17": the first age, for sentences (the comparison table keeps all of it). */
export const shortAge = (age: string | null) => (age ?? "").split(/\s*[(,;]/)[0].replace(/[-–]$/, "+").trim();

/** One paragraph of the date's numbers, for the "at a glance" section. */
export function statsLine(label: string, s: BdStats): string {
  const parts = [
    `${s.count} well-known anime characters share the ${label} birthday${s.series > 1 ? `, from ${s.series} different anime` : ""}, with ${s.fans.toLocaleString("en-US")} AniList favourites between them.`,
    split(s.main, "main character", s.supporting, "supporting character"),
    split(s.female, "female character", s.male, "male character"),
    s.oldest ? `The oldest is ${s.oldest.name} (${shortAge(s.oldest.age)})${s.youngest ? ` and the youngest ${s.youngest.name} (${shortAge(s.youngest.age)})` : ""}.` : "",
    s.tallest ? `${s.tallest.name} is the tallest at ${s.tallest.heightCm} cm${s.shortest ? `, ${s.shortest.name} the shortest at ${s.shortest.heightCm} cm` : ""}.` : "",
    s.blood ? `Blood type ${s.blood.type} is the most common, shared by ${s.blood.names.slice(0, 3).join(", ")}${s.blood.names.length > 3 ? ` and ${s.blood.names.length - 3} more` : ""}.` : "",
  ];
  return parts.filter(Boolean).join(" ");
}
