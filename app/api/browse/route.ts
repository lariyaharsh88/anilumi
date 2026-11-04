import { NextResponse } from "next/server";
import { listAnime, publicGenres, posterUrl, SEASONS, type Anime, type ListOpts, type Season } from "@/lib/kitsu";
import { LISTS } from "@/app/top/[list]/q/lists";
import type { BrowseItem } from "@/lib/browse";

/**
 * GET /api/browse?season=2026-fall | ?top=rated → every title of a season (up to 200) or a top list's first
 * 100, with genres and streaming services, for the filter bar on those pages (components/BrowseFilter.tsx).
 * Kitsu pages are 20 titles, so this is up to 10 requests, each in Next's fetch cache for an hour.
 */
const PAGE = 20;

function compact(a: Anime): BrowseItem {
  return {
    id: a.id, slug: a.slug, title: a.title, poster: posterUrl(a, "medium"), subtype: a.subtype, year: a.startDate?.slice(0, 4) || null,
    eps: a.episodeCount, rating: a.rating, users: a.userCount, status: a.status, start: a.startDate,
    genres: publicGenres(a.categories).map((c) => c.title), services: [...new Set(a.streaming.map((s) => s.site))],
  };
}

async function all(opts: ListOpts, max: number): Promise<Anime[]> {
  const base = { ...opts, withCategories: true, withStreaming: true, revalidate: 3600 };
  const first = await listAnime({ ...base, limit: PAGE, offset: 0 });
  const total = Math.min(first.total, max);
  const rest = await Promise.all(Array.from({ length: Math.max(0, Math.ceil(total / PAGE) - 1) }, (_, i) => listAnime({ ...base, limit: PAGE, offset: (i + 1) * PAGE })));
  return [...first.items, ...rest.flatMap((r) => r.items)];
}

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const season = sp.get("season")?.match(/^(\d{4})-(winter|spring|summer|fall)$/);
  const top = sp.get("top");
  let items: Anime[];
  if (season && SEASONS.includes(season[2] as Season)) items = await all({ sort: "-userCount", filter: { season: season[2], seasonYear: season[1] }, unrated: true }, 200);
  else if (top && LISTS[top]) items = await all(LISTS[top].opts, 100);
  else return NextResponse.json({ error: "Bad request" }, { status: 400 });
  const seen = new Set<string>();
  const out = items.filter((a) => !seen.has(a.id) && seen.add(a.id)).map(compact);
  return NextResponse.json({ items: out }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
