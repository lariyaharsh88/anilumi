import type { AlTag } from "./insights";

/** Tags too broad to explain a match (who the protagonist is, the audience a show is sold to). */
const VAGUE = new Set(["Male Protagonist", "Female Protagonist", "Primarily Male Cast", "Primarily Female Cast", "Primarily Adult Cast", "Primarily Teen Cast", "Primarily Child Cast", "Ensemble Cast", "Episodic"]);

/**
 * What two shows have in common, for "why it's similar": AniList tags both carry strongly (rank ≥ 60), never
 * spoiler or adult tags, demographics or vague cast labels; strongest shared first. Pure.
 */
export function sharedThemes(a: AlTag[], b: AlTag[], n = 3): string[] {
  const ok = (t: AlTag) => !t.isMediaSpoiler && !t.isAdult && t.rank >= 60 && t.category !== "Demographic" && !VAGUE.has(t.name);
  const theirs = new Map(b.filter(ok).map((t) => [t.name, t.rank]));
  return a.filter(ok).flatMap((t) => (theirs.has(t.name) ? [{ name: t.name, rank: Math.min(t.rank, theirs.get(t.name)!) }] : []))
    .sort((x, y) => y.rank - x.rank || x.name.localeCompare(y.name))
    .slice(0, n)
    .map((t) => t.name);
}
