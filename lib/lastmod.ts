/**
 * Honest <lastmod> dates for the sitemap. Google uses lastmod only when it's consistently accurate, and every URL
 * claiming "changed today" taught it to ignore ours. Pages whose content really changes daily (schedule, airing
 * shows, upcoming episodes, current season, top lists) use today; the rest use when their data last changed:
 * the monthly snapshots' generated dates, guides' checked dates, or the start of the week for weekly pages, never
 * older than SITE_UPDATED. Server-only (imports the data files).
 */
import aliases from "@/data/aliases.json";
import animeAl from "@/data/anime-al.json";
import arcs from "@/data/arcs.json";
import birthdays from "@/data/birthdays.json";
import casts from "@/data/casts.json";
import characters from "@/data/characters.json";
import franchises from "@/data/franchises.json";
import dubs from "@/data/hindi-dubs.json";
import dubSchedule from "@/data/dub-schedule.json";
import streams from "@/data/where-to-watch.json";
import manga from "@/data/manga-seasons.json";
import seriesChars from "@/data/series-characters.json";
import themes from "@/data/themes.json";
import vas from "@/data/voice-actors.json";
import woSnap from "@/data/watch-order-snap.json";
import summaries from "@/data/summaries.json";
import charNotes from "@/data/character-notes.json";
import vaNotes from "@/data/va-notes.json";
import charLines from "@/data/character-lines.json";
import sequelNews from "@/data/sequel-news.json";
import seasonDubs from "@/data/season-dubs.json";
import hindiVoices from "@/data/hindi-voice-artists.json";

/**
 * The last release that changed most pages' content (templates, new sections). Bump it with such a release;
 * no page claims an older change than this.
 */
export const SITE_UPDATED = "2026-11-11"; // 11 Nov: verdicts, character/VA sections, capped descriptions

/** Birthday date pages' template: 14 Nov added "at a glance", "who they are" and the comparison table. */
export const BIRTHDAY_PAGES_UPDATED = "2026-11-14";

/** Info pages, by the date their text last changed. */
export const STATIC_UPDATED: Record<string, string> = {
  "/about": "2026-11-10", "/how-we-check": "2026-11-04", "/author/harsh-lariya": "2026-11-10",
  "/privacy": "2026-11-04", "/contact": "2026-11-03", "/advertise": "2026-10-28",
};

const g = (d: unknown) => (d as { generated?: string; checked?: string | null }) ?? {};
export const DATA_DATES = {
  aliases: g(aliases).generated, anilist: g(animeAl).generated, arcs: g(arcs).checked, birthdays: g(birthdays).generated,
  casts: g(casts).generated, characters: g(characters).generated, franchises: g(franchises).generated, dubs: g(dubs).checked,
  manga: g(manga).checked, seriesCharacters: g(seriesChars).generated, themes: g(themes).generated, voiceActors: g(vas).generated,
  watchOrders: g(woSnap).generated, streams: g(streams).checked, dubSchedule: g(dubSchedule).checked,
  summaries: g(summaries).checked, charNotes: g(charNotes).checked, vaNotes: g(vaNotes).checked, charLines: g(charLines).checked,
  sequelNews: g(sequelNews).checked, seasonDubs: g(seasonDubs).checked, hindiVoices: g(hindiVoices).checked,
};

const toTime = (d: string | Date | null | undefined) => (d ? (d instanceof Date ? d.getTime() : Date.parse(d.length === 10 ? `${d}T00:00:00Z` : d)) : NaN);

/** The latest of the given dates, never before SITE_UPDATED and never in the future. Pure. */
export function latest(now: Date, ...dates: (string | Date | null | undefined)[]): Date {
  const t = Math.max(toTime(SITE_UPDATED), ...dates.map(toTime).filter((x) => !isNaN(x)));
  return new Date(Math.min(t, now.getTime()));
}

/** Monday 00:00 UTC of this week: lastmod for pages refreshed weekly. Pure. */
export function weekStart(now: Date): Date {
  const d = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  d.setUTCDate(d.getUTCDate() - ((d.getUTCDay() + 6) % 7));
  return d;
}

/** First day of this month, UTC: lastmod for pages refreshed monthly. Pure. */
export const monthStart = (now: Date) => new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1));
