/**
 * What a voice actor is in right now: roles in shows with episodes scheduled, roles in shows announced for coming seasons,
 * then their most recent other roles. Built from the airing and season-preview snapshots, so it refreshes with them.
 * Pure given its inputs.
 */
import type { VaRole } from "./anilist";

export type RecentRole = { role: VaRole; when: string; kind: "airing" | "upcoming" | "recent" };

const ORDER = ["winter", "spring", "summer", "fall"];
const key = (y: number, s: string) => y * 4 + ORDER.indexOf(s);
const cap = (s: string) => s[0].toUpperCase() + s.slice(1);

/** `airing` maps a scheduled show's AniList id to its label ("Airing now", "Returns Jan 2027"); `seasons` is the preview
 *  snapshot's "2027-winter" → AniList ids map; `now` the current season. */
export function recentRoles(roles: VaRole[], airing: Map<number, string>, seasons: Record<string, number[]>, now: { year: number; season: string }, limit = 8): RecentRole[] {
  const upcoming = new Map<number, string>();
  for (const [k, ids] of Object.entries(seasons)) {
    const [y, s] = k.split("-");
    if (key(Number(y), s) <= key(now.year, now.season)) continue;
    for (const id of ids) if (!upcoming.has(id)) upcoming.set(id, `${cap(s)} ${y}`);
  }
  const out: RecentRole[] = [];
  const seen = new Set<number>();
  for (const r of roles) if (airing.has(r.media.id)) { out.push({ role: r, when: airing.get(r.media.id)!, kind: "airing" }); seen.add(r.media.id); }
  for (const r of roles) if (!seen.has(r.media.id) && upcoming.has(r.media.id)) { out.push({ role: r, when: `Coming ${upcoming.get(r.media.id)}`, kind: "upcoming" }); seen.add(r.media.id); }
  const rest = roles.filter((r) => !seen.has(r.media.id) && r.media.year).sort((a, b) => b.media.year! - a.media.year! || b.media.popularity - a.media.popularity);
  for (const r of rest) out.push({ role: r, when: String(r.media.year), kind: "recent" });
  return out.slice(0, limit);
}
