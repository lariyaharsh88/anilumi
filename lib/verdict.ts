/**
 * "Should you watch it?": a short answer built from facts the page already has (themes, scores across sites, how
 * many viewers finish it, how long it takes, who it suits, where to watch, what its fans recommend next). Every sentence
 * is a fact with its source in the data; no opinions. Pure.
 */
export type VerdictInput = {
  title: string;
  themes: string[];
  score: { value: number; sites: number } | null;
  finish: { rate: number; started: number } | null;
  runtimeMin: number | null;
  episodes: number | null;
  movie: boolean;
  airing: boolean;
  suits: string | null;
  watchOn: string[];
  hindi: boolean;
  pairs: string[];
};

const list = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const hours = (m: number) => (m >= 120 ? `about ${Math.round(m / 60)} hours` : `${m} minutes`);

export function verdictLines(v: VerdictInput): string[] {
  const out: string[] = [];
  if (v.themes.length) out.push(`Best if you like ${list(v.themes.map((t) => t.toLowerCase()))}.`);
  if (v.score) {
    const finish = v.finish && !v.airing && v.finish.started >= 500 ? `, and ${Math.round(v.finish.rate)}% of AniList viewers who start it finish it` : "";
    out.push(`Fans rate it ${v.score.value.toFixed(1)}/10${v.score.sites > 1 ? ` across ${v.score.sites} sites` : ""}${finish}.`);
  }
  if (v.runtimeMin) out.push(v.movie ? `The film runs ${hours(v.runtimeMin)}.` : `${v.airing ? "So far it takes" : "It takes"} ${hours(v.runtimeMin)} to watch${v.episodes && v.episodes > 1 ? ` (${v.episodes} episodes)` : ""}.`);
  if (v.suits) out.push(`Suitable for ${v.suits.toLowerCase()}.`);
  if (v.watchOn.length || v.hindi) out.push(`${v.watchOn.length ? `Stream it on ${list(v.watchOn)} in the US` : ""}${v.watchOn.length && v.hindi ? "; it also has" : v.hindi ? "It has" : ""}${v.hindi ? " an official Hindi dub" : ""}.`);
  if (v.pairs.length) out.push(`If you like it, its fans most often recommend ${list(v.pairs)} next.`);
  return out;
}
