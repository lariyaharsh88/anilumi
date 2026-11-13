/**
 * Season pages in depth, from the weekly AniList preview snapshot (current and next two seasons): new series vs
 * sequels, studios, source material, genres, and the weekday each show premiered on (its weekly slot, in Japan).
 * Pure given the items.
 */
import type { PreviewItem } from "./preview";

export const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const count = (xs: (string | null)[]) => {
  const m = new Map<string, number>();
  for (const x of xs) if (x) m.set(x, (m.get(x) ?? 0) + 1);
  return [...m].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).map(([label, value]) => ({ label, value }));
};

/** Day of the week a premiere date falls on (AniList dates are Japanese dates), or null without an exact day. */
export function weekdayOf(d: PreviewItem["date"]): number | null {
  return d.year && d.month && d.day ? new Date(Date.UTC(d.year, d.month - 1, d.day)).getUTCDay() : null;
}

export function seasonNumbers(items: PreviewItem[]) {
  const byPop = [...items].sort((a, b) => b.popularity - a.popularity);
  const series = byPop.filter((i) => i.kind !== "movie");
  // Weekly slots: TV and web series only; Monday first, as schedules are read.
  const days = [1, 2, 3, 4, 5, 6, 0].map((wd) => ({ day: WEEKDAYS[wd], items: series.filter((i) => weekdayOf(i.date) === wd) }));
  const sources = count(items.map((i) => i.source));
  return {
    total: items.length,
    fresh: byPop.filter((i) => i.kind === "new"), sequels: byPop.filter((i) => i.kind === "sequel"), movies: byPop.filter((i) => i.kind === "movie"),
    studios: count(items.map((i) => i.studio)).filter((s) => s.value >= 2).slice(0, 8),
    // Five biggest sources; the rest as "Other" so the part-to-whole bar keeps to six slots.
    sources: sources.length > 6 ? [...sources.slice(0, 5), { label: "Other", value: sources.slice(5).reduce((n, s) => n + s.value, 0) }] : sources,
    genres: count(items.flatMap((i) => i.genres)).slice(0, 8),
    days: days.filter((d) => d.items.length),
    busiestDay: [...days].sort((a, b) => b.items.length - a.items.length)[0],
  };
}
