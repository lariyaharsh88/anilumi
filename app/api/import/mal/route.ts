import { NextResponse } from "next/server";
import { kitsuByExternalIds, posterUrl, runtimeMinutes, mainGenres, primeAniList, getLastAiredBest } from "@/lib/kitsu";

const MAX = 300;
type In = { malId: number; status: "watching" | "planning" | "paused"; progress: number };

/** POST /api/import/mal {entries} → watchlist items. The export file is parsed in the browser; only ids, status and progress are sent. */
export async function POST(req: Request) {
  const headers = { "Cache-Control": "private, no-store" };
  const body = (await req.json().catch(() => null)) as { entries?: In[] } | null;
  const entries = (body?.entries || []).filter((e) => Number.isInteger(e.malId) && e.malId > 0 && ["watching", "planning", "paused"].includes(e.status)).slice(0, MAX);
  if (!entries.length) return NextResponse.json({ ok: false, message: "No watching, planning or on-hold anime found in that file." }, { status: 400, headers });
  const map = await kitsuByExternalIds("myanimelist/anime", entries.map((e) => e.malId));
  const airing = [...map.values()].filter((a) => a.status === "current");
  await primeAniList(airing.map((a) => a.id));
  await Promise.all(airing.map(async (a) => { const at = (await getLastAiredBest(a.id)).nextAt; if (at) a.nextRelease = at; }));
  const items = entries.flatMap((e) => {
    const a = map.get(e.malId);
    if (!a) return [];
    return [{
      id: a.id, slug: a.slug, title: a.title, poster: posterUrl(a, "small"), status: a.status, nextRelease: a.nextRelease,
      progress: Math.max(0, Number(e.progress) || 0), listStatus: e.status, episodeCount: a.episodeCount, episodeLength: a.episodeLength, runtime: runtimeMinutes(a), genres: mainGenres(a).map((c) => c.title),
    }];
  });
  return NextResponse.json({ ok: true, items, unmatched: entries.length - items.length }, { headers });
}
