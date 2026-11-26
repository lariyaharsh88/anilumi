/**
 * Upcoming seasons in India (data/season-india.json): for each show, the India streaming announced for the new season
 * (only with a source that covers India), where its previous season streams in India, and any Hindi, Tamil or Telugu
 * dub announced, all with sources (the services' own posts, official sites, Anime News Network). Researched before the
 * season and rechecked as services publish their line-ups. Pure.
 */
import data from "@/data/season-india.json";

export type IndiaStream = { service: string; india: "yes" | "unclear"; kind: "simulcast" | "later" | "free-youtube" | string; note?: string; sources: string[] };
type Sourced = { service: string; sources: string[] };
export type IndiaShow = {
  anilistId: number;
  slug?: string | null;
  title?: string;
  streaming: IndiaStream[];
  previousSeasonIndia: Sourced | null;
  dubs: { hi: Sourced | null; ta: Sourced | null; te: Sourced | null };
  /** Announced for this season, but the service's region list leaves India out. */
  notIndia?: Sourced | null;
  jpPremiere?: { date: string | null; timeJst: string | null; channel: string | null; sources: string[] } | null;
};
export type Lineup = { service: string; published: boolean; date: string | null; note?: string; sources: string[] };
export type SeasonIndia = { checked: string; reviewed?: string | null; lineups: Lineup[]; shows: IndiaShow[] };

const D = data as unknown as { seasons: Record<string, SeasonIndia> };

/** The research for a season ("2027-winter"), with shows by AniList id, or null when it wasn't researched. */
export function seasonIndia(year: number, season: string): (SeasonIndia & { byId: Map<number, IndiaShow> }) | null {
  const s = D.seasons[`${year}-${season}`];
  return s ? { ...s, byId: new Map(s.shows.map((x) => [x.anilistId, x])) } : null;
}

/** Seasons with India research: their guide pages exist (app/season/[year]/[season]/india). */
export const indiaSeasons = (): { year: number; season: string }[] =>
  Object.keys(D.seasons).map((k) => ({ year: Number(k.slice(0, 4)), season: k.slice(5) }));

/** Only links to the sources' own https pages. Pure. */
export const sourceUrl = (u: string) => (/^https:\/\/[^\s"<>]+$/.test(u) ? u : null);

/** "Sun 17 Jan, 1:30 pm IST" from a Unix time. Pure. */
export function istTime(unix: number): string {
  const d = new Date(unix * 1000);
  const day = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
  const time = d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", hour12: true, timeZone: "Asia/Kolkata" }).toLowerCase();
  return `${day}, ${time} IST`;
}

/** Announced India streaming for a show: services whose announcement covers India first. Pure. */
export const announcedIn = (x: IndiaShow | undefined): IndiaStream[] =>
  (x?.streaming ?? []).filter((s) => s.service && s.sources.some(sourceUrl)).sort((a, b) => (a.india === "yes" ? 0 : 1) - (b.india === "yes" ? 0 : 1));

/**
 * Index the guide only when it says something India-specific and sourced about enough shows: an announced service,
 * the previous season's India home, or a dub. Below that it's a re-sorted line-up (Google's scaled-content policy).
 */
export const INDIA_GUIDE_MIN = 10;
export function indiaFacts(x: IndiaShow | undefined, earlier: { stream: boolean; dub: boolean }): boolean {
  return announcedIn(x).length > 0 || Boolean(x?.notIndia?.sources.some(sourceUrl)) || Boolean(x?.previousSeasonIndia?.sources.some(sourceUrl)) || Boolean(x && (x.dubs.hi || x.dubs.ta || x.dubs.te)) || earlier.stream || earlier.dub;
}
