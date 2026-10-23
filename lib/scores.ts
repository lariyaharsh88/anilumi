/**
 * One score from three communities: Kitsu, AniList and MyAnimeList (via Jikan).
 * The combined score is a plain mean of the sources we have, so it is easy to explain
 * and no single site's audience size dominates. Fetchers fail soft and return null.
 */
import { getMappings } from "./kitsu";

export type ScoreKey = "kitsu" | "anilist" | "mal";
export type ScoreSource = { key: ScoreKey; label: string; score: number; votes: number | null; url: string | null };
export type CombinedScore = { score: number; sources: ScoreSource[]; spread: number; high: ScoreSource; low: ScoreSource };

/** Mean of the available 0–10 scores, plus how far apart the sources are. Pure. */
export function combineScores(sources: (ScoreSource | null | undefined)[]): CombinedScore | null {
  const xs = sources.filter((s): s is ScoreSource => Boolean(s) && Number.isFinite(s!.score) && s!.score > 0);
  if (!xs.length) return null;
  const score = Math.round((xs.reduce((n, s) => n + s.score, 0) / xs.length) * 100) / 100;
  const high = xs.reduce((a, b) => (b.score > a.score ? b : a));
  const low = xs.reduce((a, b) => (b.score < a.score ? b : a));
  return { score, sources: xs, spread: Math.round((high.score - low.score) * 100) / 100, high, low };
}

/** One-line reading of how much the communities agree. Pure. */
export function agreement(c: CombinedScore): string {
  if (c.sources.length < 2) return `Only ${c.sources[0].label} has enough ratings so far.`;
  if (c.spread < 0.3) return "All communities agree closely on this one.";
  return `${c.high.label} rates it ${c.spread.toFixed(1)} points higher than ${c.low.label}.`;
}

/** MyAnimeList score via Jikan. On unless MAL_SCORE=0; one retry after a 429. */
export async function getMalScore(kitsuId: string): Promise<ScoreSource | null> {
  if (process.env.MAL_SCORE === "0") return null;
  const malId = (await getMappings(kitsuId))["myanimelist/anime"];
  if (!malId) return null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(`https://api.jikan.moe/v4/anime/${malId}`, { next: { revalidate: 86400 }, signal: AbortSignal.timeout(Number(process.env.JIKAN_TIMEOUT_MS) || 3500) });
      if (res.status === 429) { await new Promise((r) => setTimeout(r, 1100)); continue; }
      if (!res.ok) return null;
      const d = ((await res.json()) as { data?: { score: number | null; scored_by: number | null } }).data;
      return d?.score ? { key: "mal", label: "MyAnimeList", score: d.score, votes: d.scored_by ?? null, url: `https://myanimelist.net/anime/${malId}` } : null;
    } catch {
      return null;
    }
  }
  return null;
}

/** Kitsu's own average (0–100 in the API). Pure. */
export function kitsuScore(a: { slug: string; rating: number | null; ratingDist?: number[] | null; userCount: number }): ScoreSource | null {
  if (!a.rating) return null;
  const votes = a.ratingDist ? a.ratingDist.reduce((n, v) => n + v, 0) : null;
  return { key: "kitsu", label: "Kitsu", score: a.rating / 10, votes, url: `https://kitsu.app/anime/${a.slug}` };
}

/** AniList's weighted average (0–100 in the API). Pure. */
export function aniListScore(i: { anilistId: number; score: number | null; scoreVotes: number } | null): ScoreSource | null {
  if (!i?.score) return null;
  return { key: "anilist", label: "AniList", score: i.score, votes: i.scoreVotes || null, url: `https://anilist.co/anime/${i.anilistId}` };
}
