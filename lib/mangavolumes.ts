/**
 * Which printed volume to buy to read on after a season (data/manga-volumes.json): the English volume holding the
 * season's continue chapter (lib/mangaseasons.ts), from Wikipedia's chapter lists cross-checked with the series
 * wiki. Draft until a person reviews the file. English and Japanese numbering match for every volume listed.
 */
import data from "@/data/manga-volumes.json";
import type { Adaptation } from "./mangaseasons";

type Entry = { vol: number | null; startsAt: "start" | "middle" | null; confidence: string; printTitle?: string; notes?: string };
const DATA = data as unknown as { checked: string | null; reviewed: string | null; printTitles: Record<string, string>; seasons: Record<string, Entry> };

export type BuyVolume = { vol: number; startsAt: "start" | "middle" | null; search: string };

/** The volume to buy after this season, with the Amazon search for it, or null (finished story, no data). Pure. */
export function volumeFor(slug: string, adapt: Adaptation | null): BuyVolume | null {
  const e = DATA.seasons[slug];
  if (!e?.vol || !adapt) return null;
  const title = e.printTitle || (adapt.franchise && DATA.printTitles[adapt.franchise]);
  if (!title) return null;
  return { vol: e.vol, startsAt: e.startsAt, search: `${title}${adapt.medium === "light novel" ? " Light Novel" : ""} Vol. ${e.vol}` };
}

/** "Chapter 51 opens volume 13." / "Chapter 140 is partway through volume 16." / "" for light novels. Pure. */
export function volumeLine(adapt: Adaptation, v: BuyVolume): string {
  if (adapt.unit !== "chapter" || !adapt.continue) return "";
  return v.startsAt === "start" ? `Chapter ${adapt.continue} opens volume ${v.vol}.` : `Chapter ${adapt.continue} is partway through volume ${v.vol}.`;
}
