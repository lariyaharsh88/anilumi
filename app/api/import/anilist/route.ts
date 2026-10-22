import { NextResponse } from "next/server";
import { fetchAniListList, kitsuByAniListIds, posterUrl, runtimeMinutes, mainGenres, primeAniList, getLastAiredBest } from "@/lib/kitsu";

const MAX = 200;

/** GET /api/import/anilist?user=<name> → watchlist items for a public AniList list (watching, planning, paused, rewatching). */
export async function GET(req: Request) {
  const user = (new URL(req.url).searchParams.get("user") || "").trim();
  const headers = { "Cache-Control": "private, no-store" };
  if (!/^[A-Za-z0-9_-]{2,20}$/.test(user)) return NextResponse.json({ ok: false, message: "Enter an AniList username (letters, numbers, _ or -)." }, { status: 400, headers });
  const list = await fetchAniListList(user);
  if (!list.ok) return NextResponse.json(list, { status: list.code === "unavailable" ? 502 : list.code === "private" ? 403 : 404, headers });
  const entries = list.entries.slice(0, MAX);
  const map = await kitsuByAniListIds(entries.map((e) => e.anilistId));
  // Same next-episode chain as the rest of the site (Kitsu -> AniList -> Jikan) for airing shows.
  const airing = [...map.values()].filter((a) => a.status === "current");
  await primeAniList(airing.map((a) => a.id));
  await Promise.all(airing.map(async (a) => { const at = (await getLastAiredBest(a.id)).nextAt; if (at) a.nextRelease = at; }));
  const items = entries.flatMap((e) => {
    const a = map.get(e.anilistId);
    if (!a) return [];
    return [{
      id: a.id, slug: a.slug, title: a.title, poster: posterUrl(a, "small"), status: a.status, nextRelease: a.nextRelease,
      progress: e.progress, listStatus: e.status, episodeCount: a.episodeCount, episodeLength: a.episodeLength, runtime: runtimeMinutes(a), genres: mainGenres(a).map((c) => c.title),
    }];
  });
  return NextResponse.json({ ok: true, user: list.user, items, unmatched: entries.length - items.length, truncated: list.entries.length > MAX }, { headers });
}
