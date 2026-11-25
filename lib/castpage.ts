/**
 * The extra blocks on a show's character list (/anime/<slug>/characters): who's most popular, the gender mix, the
 * teams the characters belong to, their match-up pages, One Piece bounties and each main character's traits. All
 * from the monthly snapshots and our checked data; no API calls. Pure given the data.
 */
import type { TableRow } from "./charsnap";
import { CHARACTER_VS, vsPath, type CharacterVs } from "./charvs";
import { characterBounties, type Bounty } from "./bounties";
import { characterDeep } from "./chardeep";
import { characterNote } from "./charnotes";

/** The most-favourited characters on AniList, most first. */
export const mostPopular = (rows: TableRow[], n = 10) => [...rows].sort((a, b) => b.c.f - a.c.f).slice(0, n);

/** Male / female / not listed, for a part-to-whole bar; null when fewer than half have a gender. */
export function genderMix(rows: TableRow[]): { key: string; label: string; value: number }[] | null {
  const count = (g: string) => rows.filter((r) => r.c.g === g).length;
  const male = count("Male"), female = count("Female"), other = rows.length - male - female;
  if (male + female < rows.length / 2) return null;
  return [{ key: "m", label: "Male", value: male }, { key: "f", label: "Female", value: female }, { key: "o", label: "Not listed", value: other }].filter((s) => s.value > 0);
}

// AniList spells the same group several ways.
const SAME_GROUP: Record<string, string> = {
  Marine: "Marines", "The Marines": "Marines", Shichibukai: "Seven Warlords of the Sea", "Straw Hats Pirates": "Straw Hat Pirates",
  "Aobajousai High": "Aoba Johsai High", "Karasuno High School Volleyball Club": "Karasuno High", "104th Trainees Squad": "104th Training Corps",
  "Hidden Leaf Village": "Konohagakure", "Black Bull": "Black Bulls",
};
// "Karasuno High, Kitagawa Daiichi Junior High (former)" → "Karasuno High"; "Straw Hat Pirates (previously …)" →
// "Straw Hat Pirates"; "Nekoma High School" → "Nekoma High". Only the first group counts: it's where the character is now.
// Our checked notes first (AniList leaves the group out for Luffy and Zoro), then AniList's Team/Affiliation line.
const groupOf = (r: TableRow): string | null => {
  const line = (r.c.k ? characterNote(r.c.k)?.affiliations[0] : null) ?? r.c.l.find(([l]) => /^(team|affiliations?)$/i.test(l))?.[1];
  const first = line?.split(/[,;]/)[0].replace(/\(.*$/, "").replace(/[.\s]+$/, "").replace(/ School$/, "").trim();
  return first && first.length <= 40 && !/:/.test(first) ? SAME_GROUP[first] ?? first : null;
};

/** Characters by team or group ("Karasuno High", "Straw Hat Pirates"), biggest first, groups of two or more: shown
 *  when there are at least two such groups. */
export function teams(rows: TableRow[]): { name: string; rows: TableRow[] }[] {
  const by = new Map<string, TableRow[]>();
  for (const r of rows) { const g = groupOf(r); if (g) by.set(g, [...(by.get(g) ?? []), r]); }
  const out = [...by.entries()].filter(([, rs]) => rs.length >= 2).map(([name, rs]) => ({ name, rows: rs })).sort((a, b) => b.rows.length - a.rows.length);
  return out.length >= 2 ? out : [];
}

/** Match-up pages ("Gojo vs Sukuna") with at least one fighter from this show. */
export function matchups(rows: TableRow[]): (CharacterVs & { href: string })[] {
  const here = new Set(rows.flatMap((r) => (r.c.k ? [r.c.k] : [])));
  return CHARACTER_VS.filter((v) => here.has(v.a) || here.has(v.b)).map((v) => ({ ...v, href: vsPath(v) }));
}

/** Each character's latest bounty that isn't a spoiler, highest first (One Piece). */
export function bounties(rows: TableRow[]): { row: TableRow; bounty: Bounty }[] {
  return rows.flatMap((row) => {
    const open = (row.c.k ? characterBounties(row.c.k)?.entries ?? [] : []).filter((b) => !b.spoiler);
    return open.length ? [{ row, bounty: open[open.length - 1] }] : [];
  }).sort((a, b) => b.bounty.amount - a.bounty.amount);
}

/** Up to three personality traits from the character's profile ("Defiant · Vengeful · Stubborn"). */
export const traits = (slug: string | undefined, n = 3) => (slug ? characterDeep(slug)?.qualities.slice(0, n).map((q) => q.trait) ?? [] : []);
