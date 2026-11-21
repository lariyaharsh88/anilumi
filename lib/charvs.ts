/**
 * Character match-ups people search ("naruto vs luffy"): a side-by-side page on the facts both profiles have, with
 * no winner declared, since there is no canon answer across two series. Only pairs with real search demand get a
 * page (Bing keyword research, 21 Nov 2026: "naruto vs luffy" 1.3K impressions a year, "luffy vs naruto" 0.8K and
 * "who wins naruto or luffy" 0.3K, all jumping from September). Pure given the data.
 */
import { snapByPage } from "./charsnap";
import { compareRow, type CompareRow } from "./charcompare";
import { characterNote } from "./charnotes";
import { characterDeep } from "./chardeep";

export type CharacterVs = {
  slug: string;
  /** Character page slugs, in the order people search them. */
  a: string;
  b: string;
  /** Short names as searched ("Naruto", "Luffy"). */
  an: string;
  bn: string;
  /** Where the two have actually appeared together, checked; null when they never have. */
  together: string | null;
};

export const CHARACTER_VS: CharacterVs[] = [
  { slug: "naruto-vs-luffy", a: "naruto-uzumaki", b: "luffy-monkey-d", an: "Naruto", bn: "Luffy", together: "crossover video games such as J-Stars Victory VS (2014) and Jump Force (2019), never in either series' story" },
];

export const vsPath = (v: CharacterVs) => `/characters/${v.slug}`;
export const characterVs = (slug: string) => CHARACTER_VS.find((v) => v.slug === slug) ?? null;

export type VsSide = { slug: string; row: CompareRow; abilities: string | null; strength: { rank: string; summary: string; spoiler: boolean } | null };

/** Both sides, or null if either character is missing from the snapshot. */
export function vsSides(v: CharacterVs): [VsSide, VsSide] | null {
  const side = (slug: string): VsSide | null => {
    const snap = snapByPage(slug);
    if (!snap) return null;
    const s = characterDeep(slug)?.strength ?? null;
    return { slug, row: compareRow(snap), abilities: characterNote(slug)?.abilities ?? null, strength: s ? { rank: s.rank, summary: s.summary, spoiler: s.spoiler } : null };
  };
  const a = side(v.a), b = side(v.b);
  return a && b ? [a, b] : null;
}
