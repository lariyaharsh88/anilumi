import { NextResponse } from "next/server";
import { listAnime, posterUrl, runtimeMinutes, mainGenres, primeAniList, getLastAiredBest } from "@/lib/kitsu";

/** Fresh status + next-episode data for a set of ids (used by the client-side watchlist). */
export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get("ids") || "").split(",").map((s) => s.trim()).filter((s) => /^\d+$/.test(s)).slice(0, 60);
  if (!ids.length) return NextResponse.json({ items: [] });
  const chunks = [0, 20, 40].map((i) => ids.slice(i, i + 20)).filter((c) => c.length);
  const items = (await Promise.all(chunks.map((c) => listAnime({ filter: { id: c.join(",") }, limit: 20, revalidate: 1800, withCategories: true })))).flatMap((r) => r.items);
  // Same next-episode sources as the episode pages and calendar (Kitsu -> AniList -> Jikan).
  const airing = items.filter((a) => a.status === "current");
  await primeAniList(airing.map((a) => a.id));
  const infos = new Map(await Promise.all(airing.map(async (a) => [a.id, await getLastAiredBest(a.id)] as const)));
  for (const a of airing) { const at = infos.get(a.id)?.nextAt; if (at) a.nextRelease = at; }
  return NextResponse.json(
    {
      items: items.map((a) => ({
        id: a.id, slug: a.slug, title: a.title, poster: posterUrl(a, "small"), status: a.status, nextRelease: a.nextRelease, rating: a.rating,
        subtype: a.subtype, episodeCount: a.episodeCount, episodeLength: a.episodeLength, runtime: runtimeMinutes(a), genres: mainGenres(a).map((c) => c.title),
      })),
    },
    { headers: { "Cache-Control": "public, max-age=0, s-maxage=1800, stale-while-revalidate=3600" } },
  );
}
