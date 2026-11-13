/**
 * Character comparison tables: a character next to the most-loved characters of the same series, and next to the
 * lead characters of the anime fans recommend alongside theirs (AniList recommendations), on the facts every profile
 * has: age, height, birthday, blood type, popularity, voices, plus our notes (Hindi voice, fate) and profiles
 * (strength). Built from the monthly snapshots; no API calls. Pure given the data.
 */
import { allSnapChars, snapByPage, snapImage, characterPathFor, type SnapChar } from "./charsnap";
import { heightCm, ageNum, zodiac } from "./charfacts";
import { roleIn } from "./seriessnap";
import { alAnime } from "./alsnap";
import { characterNote } from "./charnotes";
import { characterDeep } from "./chardeep";
import { bdLabel } from "./birthdays";

export type CompareRow = {
  id: number; name: string; href: string | null; image: string | null; series: string; role: "main" | "supporting" | null;
  age: string | null; ageNum: number | null; heightCm: number | null; birthday: string | null; sign: string | null; bloodType: string | null;
  favourites: number; jp: string | null; en: string | null; hindi: string | null;
  /** Spoilers: shown only after the viewer turns them on. */
  fate: "alive" | "dies" | "revived" | "unclear" | null; strength: string | null;
};

const BLOOD = /^(A|B|O|AB)$/i;

export function compareRow(c: SnapChar): CompareRow {
  const slug = c.k ?? null;
  const note = slug ? characterNote(slug) : null;
  const deep = slug ? characterDeep(slug) : null;
  const h = c.l.find(([l]) => l.toLowerCase() === "height")?.[1];
  return {
    id: c.id, name: note?.name ?? c.n, href: characterPathFor(c.id), image: snapImage(c), series: c.t, role: roleIn(c.s, c.id),
    age: c.age ? c.age.replace(/-$/, "+") : null, ageNum: ageNum(c.age), heightCm: heightCm(h), birthday: c.m && c.d ? bdLabel(c.m, c.d) : null,
    sign: c.m && c.d ? zodiac(c.m, c.d) : null, bloodType: c.bt && BLOOD.test(c.bt) ? c.bt.toUpperCase() : null,
    favourites: c.f, jp: c.jp?.n ?? null, en: c.en?.n ?? null, hindi: note?.hindiVoice?.name ?? null,
    fate: note?.fate?.status ?? null, strength: deep?.strength?.rank ?? null,
  };
}

/** The character, their series' most-loved others, and similar leads from fan-recommended anime (one per show). */
export function compareSets(slug: string, perSet = 5): { self: CompareRow; sameSeries: CompareRow[]; similar: CompareRow[] } | null {
  const me = snapByPage(slug);
  if (!me) return null;
  const all = allSnapChars();
  const sameSeries = all.filter((c) => c.id !== me.id && (c.a === me.a || c.s === me.s)).sort((a, b) => b.f - a.f).slice(0, perSet);
  const recs = (alAnime(me.a)?.r ?? []).map((r) => r.anilistId);
  const seenShow = new Set<number>([me.a]);
  const similar: SnapChar[] = [];
  for (const id of recs) {
    if (similar.length >= perSet || seenShow.has(id)) continue;
    const lead = all.filter((c) => c.a === id && c.g === me.g).sort((a, b) => b.f - a.f)[0];
    if (lead) { similar.push(lead); seenShow.add(id); }
  }
  if (sameSeries.length + similar.length < 2) return null;
  return { self: compareRow(me), sameSeries: sameSeries.map(compareRow), similar: similar.map(compareRow) };
}
