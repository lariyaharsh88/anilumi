/**
 * Where a season streams: the official streaming links AniList lists for the season's 50 most popular shows
 * (Kitsu's links for new shows are often missing or stale). Worldwide; which country gets what varies. One query
 * per season, cached for a day (and in MongoDB for Cloudflare, like every AniList call).
 */
import { anilist } from "./anilist";
import type { Season } from "./kitsu";

type Row = { id: number; externalLinks: { site: string; type: string }[] | null };

export async function seasonStreaming(year: number, season: Season): Promise<{ byShow: Map<number, string[]>; services: { site: string; ids: number[] }[] } | null> {
  const res = await anilist<{ Page: { media: Row[] } }>(
    `query($s:MediaSeason,$y:Int){Page(perPage:50){media(type:ANIME,season:$s,seasonYear:$y,sort:POPULARITY_DESC,isAdult:false,format_in:[TV,TV_SHORT,ONA,MOVIE]){id externalLinks{site type}}}}`,
    { s: season.toUpperCase(), y: year },
    86400,
  );
  const rows = res?.Page.media ?? [];
  if (!rows.length) return null;
  const byShow = new Map(rows.map((r) => [r.id, [...new Set((r.externalLinks ?? []).filter((l) => l.type === "STREAMING").map((l) => l.site))]]));
  const by = new Map<string, number[]>();
  for (const [id, sites] of byShow) for (const s of sites) by.set(s, [...(by.get(s) ?? []), id]);
  return { byShow, services: [...by].map(([site, ids]) => ({ site, ids })).sort((a, b) => b.ids.length - a.ids.length || a.site.localeCompare(b.site)) };
}
