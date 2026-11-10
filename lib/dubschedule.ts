/**
 * Dub schedule (data/dub-schedule.json): English and Hindi dubs airing this season, with the weekday each new
 * dubbed episode lands, from the services' own announcements (Crunchyroll News, HIDIVE, Netflix) and anime news.
 * Next release dates are worked out from the premiere and the weekday; when a source gives no day the page says
 * so rather than guessing. Pure.
 */
import data from "@/data/dub-schedule.json";

export type DubStatus = "airing" | "announced" | "complete";
export type DubShow = {
  t: string; slug: string | null; lang: string; service: string; region: string; status: DubStatus;
  premiere: string | null; weekday: string | null; episodes: number | null; released: number | null;
  delay: string | null; note: string; url: string; confidence: "high" | "medium"; sources: string[];
};

const D = data as { checked: string; reviewed: string | null; season: string; entries: DubShow[] };
export const DUBS_CHECKED = D.checked;
export const DUBS_SEASON = D.season;
export const dubShows = (): DubShow[] => D.entries.filter((e) => e.t && e.service);

const DAYS = ["sunday", "monday", "tuesday", "wednesday", "thursday", "friday", "saturday"];
const dayIndex = (w: string | null) => (w ? DAYS.indexOf(w.trim().toLowerCase()) : -1);
const DAY = 86400_000;

/** Premiere as a timestamp: "2026-10-18T17:30Z" keeps its time, a bare date reads as midnight UTC. */
export const premiereAt = (e: DubShow) => (e.premiere ? Date.parse(/T/.test(e.premiere) ? e.premiere : `${e.premiere}T00:00:00Z`) : NaN);
const hasTime = (e: DubShow) => Boolean(e.premiere && /T\d/.test(e.premiere));

/**
 * Dubbed episodes out by `now`: the source's count when it is newer than the premiere arithmetic can know,
 * else one per week since the premiere (weekly dubs only), capped at the season's length.
 */
export function releasedBy(e: DubShow, now: number): number | null {
  const start = premiereAt(e);
  if (e.status === "complete") return e.episodes ?? e.released;
  if (isNaN(start) || start > now) return e.released ?? (isNaN(start) ? null : 0);
  if (dayIndex(e.weekday) < 0) return e.released;
  const weekly = Math.floor((now - start) / (7 * DAY)) + 1;
  const n = Math.max(weekly, e.released ?? 0);
  return e.episodes ? Math.min(n, e.episodes) : n;
}

/** The next dubbed episode: number and time, or null when the dub has finished or has no weekly day. */
export function nextDub(e: DubShow, now: number): { episode: number; at: number; timed: boolean } | null {
  const start = premiereAt(e);
  if (e.status === "complete" || isNaN(start)) return null;
  if (start > now) return { episode: 1, at: start, timed: hasTime(e) };
  const wd = dayIndex(e.weekday);
  if (wd < 0) return null;
  const out = releasedBy(e, now) ?? 0;
  if (e.episodes && out >= e.episodes) return null;
  // The first release day after now, at the premiere's time of day (UTC).
  const p = new Date(start);
  let at = Date.UTC(new Date(now).getUTCFullYear(), new Date(now).getUTCMonth(), new Date(now).getUTCDate(), p.getUTCHours(), p.getUTCMinutes());
  while (new Date(at).getUTCDay() !== wd || at <= now) at += DAY;
  return { episode: out + 1, at, timed: hasTime(e) };
}

/** Dubbed episodes due in the next `days` days, soonest first. */
export function dueWithin(now: number, days = 7): { e: DubShow; episode: number; at: number; timed: boolean }[] {
  return dubShows()
    .flatMap((e) => { const n = nextDub(e, now); return n && n.at - now <= days * DAY ? [{ e, ...n }] : []; })
    .sort((a, b) => a.at - b.at);
}

export const LANG_NAME: Record<string, string> = { en: "English", hi: "Hindi", ta: "Tamil", te: "Telugu", es: "Spanish", pt: "Portuguese" };

/** "Sat 15 Nov" in the given zone; dates without a source time drop the clock. */
export function dubWhen(at: number, timed: boolean, timeZone = "UTC"): string {
  const d = new Date(at);
  const day = d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", timeZone });
  return timed ? `${day}, ${d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", timeZone })} ${timeZone === "UTC" ? "UTC" : ""}`.trim() : day;
}

export const dubsDate = () => new Date(`${DUBS_CHECKED}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
