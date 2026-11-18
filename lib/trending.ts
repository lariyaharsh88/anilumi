/**
 * What's on now, from the airing snapshot (AniList's broadcast schedule, lib/airing.ts): shows with an episode
 * this week, ranked by AniList popularity; "trending" keeps those that started in the last two seasons. Replaces
 * Kitsu's /trending, which was stale (Attack on Titan and My Hero Academia season 1 led the homepage in Nov 2026),
 * and "status: current", which listed commercials, shorts and decades-old series. Without a snapshot: this season.
 */
import { airing as airingSnapshot } from "./airing";
import { listAnime, getSeason, seasonOf, type Anime } from "./kitsu";

const DAY = 86_400_000;

export async function onNow(now = Date.now()): Promise<{ trending: Anime[]; airing: Anime[]; airingCount: number }> {
  const snap = await airingSnapshot();
  const week = snap.shows
    .filter((x) => x.k && x.n.some(([, t]) => t * 1000 > now - DAY && t * 1000 < now + 7 * DAY))
    .sort((p, q) => q.p - p.p);
  const fresh = week.filter((x) => x.d && now - Date.parse(x.d) < 200 * DAY);
  const ids = [...new Set([...fresh.slice(0, 12), ...week.slice(0, 12)].map((x) => x.k!))].slice(0, 20);
  const pool = ids.length ? await listAnime({ filter: { id: ids.join(",") }, limit: 20, revalidate: 3600, withCover: true }).catch(() => null) : null;
  const byId = new Map((pool?.items || []).filter((a) => !a.nsfw && a.ageRating !== "R18").map((a) => [a.id, a]));
  const pick = (xs: typeof week, n: number) => xs.flatMap((x) => (byId.has(x.k!) ? [byId.get(x.k!)!] : [])).slice(0, n);
  const trending = pick(fresh, 12);
  const airing = pick(week, 12);
  if (trending.length >= 6 && airing.length >= 6) return { trending, airing, airingCount: week.length };
  const { season, year } = seasonOf();
  const lineup = await getSeason(year, season, 1, 12).catch(() => ({ items: [] as Anime[], total: 0 }));
  return { trending: trending.length >= 6 ? trending : lineup.items, airing: airing.length >= 6 ? airing : lineup.items, airingCount: week.length || lineup.total };
}
