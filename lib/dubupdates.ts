/**
 * "New in Indian dubs" (/new-dubs): what changed on the Hindi, Tamil and Telugu lists, week by week. Two kinds of
 * news: a dub added to a list (its `added` date, data/hindi-dubs.json and data/regional-dubs.json), and a dated Hindi
 * dub run that started streaming (data/dub-schedule.json). A list's first check adds dozens at once, so a week with
 * more than BIG_WEEK additions in one language is shown as one line ("Tamil list started with 101 dubs"). Pure.
 */
import { dubHref, hindiDubbed, type Dub, type DubPlatform } from "./hindidub";
import { dubbedIn, LANG } from "./regionaldub";
import { dubShows, premiereAt, type DubShow } from "./dubschedule";

export type DubLang = "Hindi" | "Tamil" | "Telugu";
export type DubEvent = { date: string; lang: DubLang; kind: "added" | "started"; t: string; href: string; where: string };
export type DubWeek = { start: string; events: DubEvent[]; bulk: { lang: DubLang; count: number; href: string; first: boolean }[] };

export const BIG_WEEK = 25;
const DAY = 86_400_000;
const LIST: Record<DubLang, string> = { Hindi: "/hindi-dub", Tamil: LANG.ta.path, Telugu: LANG.te.path };
const where = (p: DubPlatform[]) => [...new Set(p.map((x) => x.name))].join(", ");
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);

/** Monday of the week (UTC) a YYYY-MM-DD date falls in. */
export function weekOf(date: string): string {
  const d = new Date(`${date}T00:00:00Z`);
  return iso(d.getTime() - ((d.getUTCDay() + 6) % 7) * DAY);
}

/** Every dated event, newest first. */
export function dubEvents(
  now = Date.now(),
  src: { hindi: Dub[]; ta: { s: string; t: string; platforms: DubPlatform[]; added?: string }[]; te: { s: string; t: string; platforms: DubPlatform[]; added?: string }[]; runs: DubShow[] } = { hindi: hindiDubbed(), ta: dubbedIn("ta"), te: dubbedIn("te"), runs: dubShows() },
): DubEvent[] {
  const listed = (lang: DubLang, items: { s: string; t: string; platforms: DubPlatform[]; added?: string }[]): DubEvent[] =>
    items.flatMap((d) => (d.added ? [{ date: d.added, lang, kind: "added" as const, t: d.t, href: dubHref(d), where: where(d.platforms) }] : []));
  const started: DubEvent[] = src.runs
    .filter((e) => e.lang === "hi" && e.status !== "announced" && premiereAt(e) <= now)
    .map((e) => ({ date: iso(premiereAt(e)), lang: "Hindi" as const, kind: "started" as const, t: e.t, href: e.slug ? `/anime/${e.slug}` : "/hindi-dub", where: e.service }));
  return [...listed("Hindi", src.hindi), ...listed("Tamil", src.ta), ...listed("Telugu", src.te), ...started]
    .filter((e) => Date.parse(`${e.date}T00:00:00Z`) <= now)
    .sort((a, b) => b.date.localeCompare(a.date) || a.lang.localeCompare(b.lang) || a.t.localeCompare(b.t));
}

/** Events by week, newest week first, at most `weeks` weeks; big batches of additions become one line each. */
export function dubWeeks(events: DubEvent[], weeks = 8): DubWeek[] {
  const by = new Map<string, DubEvent[]>();
  for (const e of events) { const w = weekOf(e.date); by.set(w, [...(by.get(w) ?? []), e]); }
  // A language's first week of additions is the list starting, not a burst of new dubs.
  const firstWeek = new Map<DubLang, string>();
  for (const e of events) if (e.kind === "added") { const w = weekOf(e.date), f = firstWeek.get(e.lang); if (!f || w < f) firstWeek.set(e.lang, w); }
  return [...by].sort((a, b) => b[0].localeCompare(a[0])).slice(0, weeks).map(([start, list]) => {
    const bulk = (["Hindi", "Tamil", "Telugu"] as const).flatMap((lang) => {
      const n = list.filter((e) => e.lang === lang && e.kind === "added").length;
      return n > BIG_WEEK ? [{ lang, count: n, href: LIST[lang], first: firstWeek.get(lang) === start }] : [];
    });
    const big = new Set(bulk.map((b) => b.lang));
    return { start, bulk, events: list.filter((e) => !(e.kind === "added" && big.has(e.lang))) };
  });
}
