/**
 * Opening / ending / "previously on" timestamps from AniSkip (community-submitted, free, no key;
 * 120 requests a minute). Timestamps belong to one video source, so they can be a few seconds off on
 * another service; durations are what we rely on. Pure helpers are unit-tested.
 */
import { getMalId } from "./kitsu";

export type Span = { start: number; end: number };
export type SkipTimes = { op: Span | null; ed: Span | null; recap: Span | null };
type Raw = { interval: { startTime: number; endTime: number }; skipType: string; episodeLength: number };

const TYPES = ["op", "ed", "mixed-op", "mixed-ed", "recap"].map((t) => `types[]=${t}`).join("&");

/** Prefer plain op/ed; fall back to mixed-op/mixed-ed. Drops spans that are implausibly short or long. Pure. */
export function pickSkips(results: Raw[]): SkipTimes {
  const ok = (r: Raw) => r.interval.endTime - r.interval.startTime >= 10 && r.interval.endTime - r.interval.startTime <= 240;
  const take = (...types: string[]): Span | null => {
    for (const t of types) {
      const r = results.find((x) => x.skipType === t && ok(x));
      if (r) return { start: r.interval.startTime, end: r.interval.endTime };
    }
    return null;
  };
  return { op: take("op", "mixed-op"), ed: take("ed", "mixed-ed"), recap: take("recap") };
}

export const spanSec = (s: Span | null) => (s ? Math.max(0, s.end - s.start) : 0);

export async function getSkipTimes(malId: string, episode: number): Promise<SkipTimes | null> {
  if (process.env.ANISKIP === "0" || !Number.isInteger(episode) || episode < 1) return null;
  try {
    const res = await fetch(`https://api.aniskip.com/v2/skip-times/${malId}/${episode}?${TYPES}&episodeLength=0`, {
      headers: { Accept: "application/json" },
      next: { revalidate: 604800 },
      signal: AbortSignal.timeout(5000),
    });
    if (!res.ok) return null; // 404 = nobody has submitted times for this episode
    const d = (await res.json()) as { found?: boolean; results?: Raw[] };
    if (!d.found || !d.results?.length) return null;
    const s = pickSkips(d.results);
    return s.op || s.ed || s.recap ? s : null;
  } catch {
    return null;
  }
}

export async function skipTimesFor(kitsuId: string, episode: number): Promise<SkipTimes | null> {
  const mal = await getMalId(kitsuId);
  return mal ? getSkipTimes(mal, episode) : null;
}

/** Up to five spread-out episodes to sample: first, second, middle, near-last, last. Pure. */
export function sampleEpisodes(count: number): number[] {
  if (count < 1) return [];
  return [...new Set([1, 2, Math.ceil(count / 2), Math.max(1, count - 1), count].filter((n) => n >= 1 && n <= count))];
}

export type SkipAverage = { perEpisodeSec: number; opSec: number; edSec: number; sampled: number };

/** Average skippable seconds (opening + ending) per episode across sampled episodes with data. Pure. */
export function averageSkips(samples: (SkipTimes | null)[]): SkipAverage | null {
  const found = samples.filter((s): s is SkipTimes => Boolean(s && (s.op || s.ed)));
  if (!found.length) return null;
  const mean = (xs: number[]) => (xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : 0);
  const op = mean(found.filter((s) => s.op).map((s) => spanSec(s.op)));
  const ed = mean(found.filter((s) => s.ed).map((s) => spanSec(s.ed)));
  return { perEpisodeSec: Math.round(op + ed), opSec: Math.round(op), edSec: Math.round(ed), sampled: found.length };
}

export async function measuredSkips(kitsuId: string, episodes: number): Promise<SkipAverage | null> {
  const mal = await getMalId(kitsuId);
  if (!mal || episodes < 2) return null;
  return averageSkips(await Promise.all(sampleEpisodes(episodes).map((n) => getSkipTimes(mal, n))));
}

/** "1m 30s", "45s". Pure. */
export const fmtSec = (s: number) => (s >= 60 ? `${Math.floor(s / 60)}m${Math.round(s % 60) ? ` ${Math.round(s % 60)}s` : ""}` : `${Math.round(s)}s`);
