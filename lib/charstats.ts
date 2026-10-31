/** Numbers and chart data for character pages, from Kitsu appearances and AniList cast favourites. Pure. */
import { subtypeLabel, type Anime } from "./kitsu";

type App = { role: string; anime: Pick<Anime, "id" | "subtype" | "startDate"> };

/** Appearances by format (TV, Movie, OVA…), biggest first. */
export function formatMix(apps: App[]): { key: string; label: string; value: number }[] {
  const by = new Map<string, number>();
  for (const a of apps) by.set(a.anime.subtype, (by.get(a.anime.subtype) || 0) + 1);
  return [...by.entries()].sort((x, y) => y[1] - x[1]).map(([k, v]) => ({ key: k, label: subtypeLabel(k), value: v }));
}

/** First and latest year on screen, or null when no dates are known. */
export function yearsActive(apps: App[]): { from: number; to: number } | null {
  const ys = apps.map((a) => Number(a.anime.startDate?.slice(0, 4))).filter((y) => y > 1900);
  return ys.length ? { from: Math.min(...ys), to: Math.max(...ys) } : null;
}

/** Appearances per year with the gaps filled in; five-year buckets when the span is long (Lupin, Doraemon). */
export function perYear(apps: App[]): { key: string; label: string; value: number }[] {
  const span = yearsActive(apps);
  if (!span) return [];
  const step = span.to - span.from > 24 ? 5 : 1;
  const start = step === 5 ? span.from - (span.from % 5) : span.from;
  const out: { key: string; label: string; value: number }[] = [];
  for (let y = start; y <= span.to; y += step) out.push({ key: String(y), label: step === 5 ? `${y}s` : String(y), value: 0 });
  for (const a of apps) {
    const y = Number(a.anime.startDate?.slice(0, 4));
    if (y > 1900) out[Math.floor((y - start) / step)].value++;
  }
  return out;
}

/** Where a character sits among their show's cast by AniList favourites. */
export function castRank<T extends { id: number; favourites: number }>(cast: T[], id: number | undefined): { rank: number; of: number; sorted: T[] } | null {
  if (!id || cast.length < 2) return null;
  const sorted = [...cast].sort((a, b) => b.favourites - a.favourites);
  const i = sorted.findIndex((c) => c.id === id);
  return i < 0 ? null : { rank: i + 1, of: sorted.length, sorted };
}

/** First and most recent title a character appears in (by premiere date); latest is null when it's the debut. */
export function debutAndLatest<T extends { anime: { id: string; startDate: string | null } }>(apps: T[]): { first: T; latest: T | null } | null {
  const dated = apps.filter((a) => a.anime.startDate).sort((x, y) => x.anime.startDate!.localeCompare(y.anime.startDate!));
  if (!dated.length) return null;
  const last = dated[dated.length - 1];
  return { first: dated[0], latest: last.anime.id === dated[0].anime.id ? null : last };
}
