/**
 * Hindi dub alerts ("hindi" leads): what counts as a new Hindi dub, and which subscriber hears about it.
 * Two kinds of news: a franchise added to the official list (data/hindi-dubs.json), and a dated Hindi dub run
 * that has started (data/dub-schedule.json). scripts/send-alerts.mts remembers the keys it has seen, so only
 * items added after that are mailed. Pure.
 */
import { dubHref, hindiDubbed, platformKind } from "./hindidub";
import { dubShows, premiereAt } from "./dubschedule";

export type HindiItem = { key: string; slug: string | null; title: string; url: string; where: string };

/** "YouTube (free)", "Crunchyroll": the platform name, flagged when it costs nothing. */
const named = (name: string) => (platformKind(name) === "free" ? `${name} (free)` : name);
const fmtDay = (ms: number) => new Date(ms).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });

/** Everything that is out in Hindi by `now`: franchises with an official dub, and Hindi runs that have started. */
export function hindiItems(now = Date.now()): HindiItem[] {
  const franchises = hindiDubbed().map((d) => ({
    key: `f:${d.s}`, slug: d.s, title: d.t, url: dubHref(d),
    where: [...new Set(d.platforms.map((p) => named(p.name)))].join(", "),
  }));
  const runs = dubShows()
    .filter((e) => e.lang === "hi" && e.status !== "announced" && premiereAt(e) <= now)
    .map((e) => ({
      key: `r:${e.slug ?? e.t.toLowerCase()}|${e.service}|${e.premiere}`, slug: e.slug, title: e.t,
      url: e.slug ? `/anime/${e.slug}` : "/hindi-dub",
      where: `${named(e.service)}, from ${fmtDay(premiereAt(e))}`,
    }));
  return [...franchises, ...runs];
}

/** The anime a lead's page is about: /anime/<slug>, /anime/<slug>/... or /watch-order/<slug>. */
export const leadSlug = (page: string | undefined) => page?.match(/^\/(?:anime|watch-order)\/([^/?#]+)/)?.[1] ?? null;

/**
 * The new items one subscriber should get: all of them for a general signup; for a signup about one anime
 * (animeId), only items in that anime's franchise (its own slug or any part of its watch order).
 */
export function itemsFor(lead: { animeId: string | null; page?: string }, items: HindiItem[], order: (animeId: string) => string[]): HindiItem[] {
  if (!lead.animeId) return items;
  const own = new Set([leadSlug(lead.page), ...order(lead.animeId)].filter(Boolean));
  return items.filter((i) => i.slug && own.has(i.slug));
}
