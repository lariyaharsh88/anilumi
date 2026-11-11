/**
 * Ranked picks with reasons, from the monthly AniList snapshot (data/anime-al.json): the best titles in a genre
 * (score weighted by how many people rated it) and, for "anime like X", how strongly fan recommendations hold up
 * (shared themes). Reasons are facts from the data, never opinions. Pure given the snapshot.
 */
import data from "@/data/anime-al.json";
import { alAnime } from "./alsnap";
import { sharedThemes } from "./similar";
import type { AlTag } from "./insights";
import type { FanRec } from "./anilist";
import type { Anime } from "./kitsu";
import { snapshotOrder } from "./wosnap";

const VAGUE = new Set(["Male Protagonist", "Female Protagonist", "Primarily Male Cast", "Primarily Female Cast", "Primarily Adult Cast", "Primarily Teen Cast", "Primarily Child Cast", "Ensemble Cast", "Episodic", "Heterosexual"]);

/** The title's defining themes: strong, spoiler-free tags. */
export function themesOf(tags: AlTag[], n = 3): string[] {
  return tags.filter((t) => !t.isMediaSpoiler && !t.isAdult && t.rank >= 70 && t.category !== "Demographic" && !VAGUE.has(t.name)).slice(0, n).map((t) => t.name);
}

/** Kitsu genre slug → AniList genre or tag that defines it. */
const GENRE_MATCH: Record<string, { genre?: string; tag?: string }> = {
  action: { genre: "Action" }, adventure: { genre: "Adventure" }, comedy: { genre: "Comedy" }, drama: { genre: "Drama" },
  fantasy: { genre: "Fantasy" }, horror: { genre: "Horror" }, mystery: { genre: "Mystery" }, psychological: { genre: "Psychological" },
  romance: { genre: "Romance" }, "science-fiction": { genre: "Sci-Fi" }, "sci-fi": { genre: "Sci-Fi" }, "slice-of-life": { genre: "Slice of Life" },
  sports: { genre: "Sports" }, supernatural: { genre: "Supernatural" }, thriller: { genre: "Thriller" }, mecha: { genre: "Mecha" },
  music: { genre: "Music" }, isekai: { tag: "Isekai" }, school: { tag: "School" }, "martial-arts": { tag: "Martial Arts" },
  military: { tag: "Military" }, "time-travel": { tag: "Time Manipulation" }, vampire: { tag: "Vampire" }, magic: { tag: "Magic" },
};

type Raw = { g: string[]; s: number | null; sv: number; t: [string, number, string, 0 | 1][]; r: unknown[] };
const SNAP = (data as unknown as { anime?: Record<string, Raw> }).anime ?? {};

export type GenrePick = { anilistId: number; score: number; votes: number; themes: string[]; weighted: number };

/**
 * A genre's titles in the snapshot, ranked by score weighted towards the mean for titles few people rated
 * (so a 9.0 from 2,000 people doesn't beat an 8.8 from 300,000). Ecchi titles are left out (hidden genre).
 */
export function genrePicks(slug: string): GenrePick[] {
  const m = GENRE_MATCH[slug];
  if (!m) return [];
  const rows = Object.entries(SNAP).filter(([, a]) => a.s && !a.g.includes("Ecchi") && (m.genre ? a.g.includes(m.genre) : a.t.some(([name, rank]) => name === m.tag && rank >= 60)));
  if (!rows.length) return [];
  const mean = rows.reduce((n, [, a]) => n + (a.s ?? 0), 0) / rows.length;
  const prior = 20000;
  return rows.map(([id, a]) => {
    const tags = alAnime(Number(id))?.t ?? [];
    return { anilistId: Number(id), score: a.s!, votes: a.sv, themes: themesOf(tags), weighted: (a.sv * a.s! + prior * mean) / (a.sv + prior) };
  }).sort((x, y) => y.weighted - x.weighted);
}

/** Hidden gems: highly rated by fewer people than the genre's typical pick. */
export function hiddenGems(picks: GenrePick[], n = 6): GenrePick[] {
  if (picks.length < 12) return [];
  const votes = [...picks].map((p) => p.votes).sort((a, b) => a - b);
  const median = votes[Math.floor(votes.length / 2)];
  return picks.filter((p) => p.votes < median && p.score >= 7.8).sort((a, b) => b.score - a.score).slice(0, n);
}

/** "Anime like X" is worth indexing when fans recommend at least 8 titles and 5 of them share themes with it. */
export function similarStrength(anilistId: number): { recs: number; reasoned: number; strong: boolean } {
  const me = alAnime(anilistId);
  if (!me) return { recs: 0, reasoned: 0, strong: false };
  const reasoned = me.r.filter((r) => sharedThemes(me.t, alAnime(r.anilistId)?.t ?? []).length > 0).length;
  return { recs: me.r.length, reasoned, strong: me.r.length >= 8 && reasoned >= 5 };
}

/** AniList ids in the snapshot whose "anime like" page is strong. */
export const strongSimilarIds = (): number[] => Object.keys(SNAP).map(Number).filter((id) => similarStrength(id).strong);

export type FanTier = { tier: "S" | "A" | "B" | "C"; min: number; ids: number[] };
/**
 * A tier list of the most-watched anime (100,000+ AniList scores) by their average score: S 8.6+, A 8.2+, B 7.8+,
 * C below. Facts, not taste: the cut-offs are stated on the page.
 */
export function fanTiers(minVotes = 100000): FanTier[] {
  const rows = Object.entries(SNAP).filter(([, a]) => a.s && a.sv >= minVotes && !a.g.includes("Ecchi")).map(([id, a]) => ({ id: Number(id), s: a.s! })).sort((x, y) => y.s - x.s);
  const cuts: [FanTier["tier"], number][] = [["S", 8.6], ["A", 8.2], ["B", 7.8], ["C", 0]];
  return cuts.map(([tier, min], i) => ({ tier, min, ids: rows.filter((r) => r.s >= min && (i === 0 || r.s < cuts[i - 1][1])).map((r) => r.id) }));
}

/** Fan recommendations as reasoned picks: what each shares with the title, from the AniList snapshot. */
export function fanPicks(recs: FanRec[], alId: number | null, name: string): { anime: Anime; why: string; votes: number }[] {
  const mine = alId ? alAnime(alId)?.t ?? [] : [];
  const seen = new Set<string>();
  return recs.flatMap((r) => {
    if (!r.anime) return [];
    // One entry per franchise: Code Geass R2 adds nothing after Code Geass.
    const root = snapshotOrder(r.anime.id)?.root.slug ?? r.anime.slug;
    if (seen.has(root)) return [];
    seen.add(root);
    const theirs = alAnime(r.anilistId)?.t ?? [];
    const both = mine.length ? sharedThemes(mine, theirs) : [];
    const own = themesOf(theirs).filter((t) => !both.includes(t)).slice(0, 2);
    const why = both.length ? `Like ${name}: ${both.join(", ")}.${own.length ? ` Also: ${own.join(", ")}.` : ""}` : own.length ? `${own.join(", ")}. Fans of ${name} pick it most.` : `Fans of ${name} pick it most.`;
    return [{ anime: r.anime, why, votes: r.votes }];
  });
}
