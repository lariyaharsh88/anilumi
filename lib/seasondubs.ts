/**
 * Dub line-ups for past and next seasons (data/season-dubs.json): which shows from each season got an English or
 * Hindi dub, on which service, and whether it was a simuldub or came later, from the services' own season
 * announcements and anime news. The current season uses the live dub schedule instead (lib/dubschedule.ts). Pure.
 */
import data from "@/data/season-dubs.json";

export type SeasonDub = { t: string; slug: string | null; service: string; when: "simuldub" | "later"; later: string | null; confidence: "high" | "medium" };
export type SeasonDubs = { en: SeasonDub[]; hi: SeasonDub[]; sources: string[]; note?: string };
const D = data as unknown as { checked: string | null; seasons: Record<string, SeasonDubs> };
export const SEASON_DUBS_CHECKED = D.checked;

/** The season's dubs, or null when it wasn't researched or nothing was dubbed. */
export function seasonDubs(year: number, season: string): SeasonDubs | null {
  const s = D.seasons[`${year}-${season}`];
  return s && (s.en.length || s.hi.length) ? s : null;
}
