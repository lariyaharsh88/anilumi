import { NextResponse } from "next/server";
import { kitsuByAniListIds, posterUrl } from "@/lib/kitsu";
import { snapshotOrder } from "@/lib/wosnap";
import { dubFor } from "@/lib/hindidub";
import { hasHindi, hindiPath } from "@/lib/hindi";

/**
 * GET /api/anilist-map?ids=21034,16498 → AniLumi pages for AniList ids (used by the scene search), with what a
 * visitor asks next: whether it has a watch order and an official Hindi dub.
 */
export async function GET(req: Request) {
  const ids = [...new Set((new URL(req.url).searchParams.get("ids") || "").split(",").map(Number).filter((n) => Number.isInteger(n) && n > 0))].slice(0, 20);
  if (!ids.length) return NextResponse.json({ map: {} });
  const found = await kitsuByAniListIds(ids);
  const map = Object.fromEntries([...found].map(([id, a]) => {
    const dub = dubFor(a);
    return [id, { id: a.id, status: a.status, slug: a.slug, title: a.title, poster: posterUrl(a, "small"), episodes: a.episodeCount, watchOrder: Boolean(snapshotOrder(a.id)), hindi: dub?.status === "available" ? (hasHindi(dub.s) ? hindiPath(dub.s) : `/anime/${a.slug}`) : null }];
  }));
  return NextResponse.json({ map }, { headers: { "Cache-Control": "public, s-maxage=86400, stale-while-revalidate=604800" } });
}
