/**
 * The English name people search an anime by, when it isn't its canonical (often romaji) title. Kitsu's English
 * title first, else AniList's from the weekly season snapshot (lib/preview.ts): Kitsu has none for many new shows,
 * so "Overgeared" (40.5K searches a month in India, Oct 2026) never appeared on /anime/temppal-item-no-chikara,
 * which was titled "Temppal: Item no Chikara". Pure apart from reading the snapshot.
 */
import type { Anime } from "./kitsu";
import { previewSnapshot } from "./preview";
import donghua from "@/data/donghua.json";
import ghibli from "@/data/ghibli-films.json";

/** Names we researched ourselves, by Kitsu slug: donghua (Kitsu titles them in pinyin, "Xian Wang de Richang
 *  Shenghuo" for The Daily Life of the Immortal King, 73K searches a month in India) and Ghibli films. */
const curated = new Map<string, string>([
  ...(donghua as { titles: { t: string; kitsu: string | null }[] }).titles.flatMap((d) => (d.kitsu ? [[d.kitsu, d.t] as [string, string]] : [])),
  ...(ghibli as { films: { t: string; kitsu: string }[] }).films.map((f) => [f.kitsu, f.t] as [string, string]),
]);

let bySnap: Map<string, string> | null = null;
/** AniList's English title for a Kitsu id, from the current and next seasons' snapshot. */
function snapshotEnglish(kitsuId: string): string | null {
  bySnap ??= new Map(Object.values(previewSnapshot().seasons).flat().flatMap((i) => (i.anime && i.title ? [[i.anime.id, i.title] as [string, string]] : [])));
  return bySnap.get(kitsuId) ?? null;
}

const key = (s: string) => s.normalize("NFKD").toLowerCase().replace(/[^a-z0-9]+/g, "");

/** An English name worth leading with: Latin script, different from the title, and short enough for a search title. */
export function englishName(a: Pick<Anime, "id" | "title" | "titleEn"> & { slug?: string }, fromSnapshot = snapshotEnglish): string | null {
  const mine = a.slug ? curated.get(a.slug) : undefined;
  if (mine) return key(mine) === key(a.title) || mine.length > 45 ? null : mine;
  const en = (a.titleEn || fromSnapshot(a.id) || "").trim();
  if (!en || !/^[\x20-\x7E‐-’★☆♪]+$/.test(en)) return null;
  if (key(en) === key(a.title) || key(a.title).includes(key(en)) || key(en).length < 3) return null;
  return en.length <= 32 ? en : null;
}
