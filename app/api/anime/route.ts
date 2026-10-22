import { NextResponse } from "next/server";
import { listAnime, posterUrl } from "@/lib/kitsu";

/** Fresh status + next-episode data for a set of ids (used by the client-side watchlist). */
export async function GET(req: Request) {
  const ids = (new URL(req.url).searchParams.get("ids") || "").split(",").map((s) => s.trim()).filter((s) => /^\d+$/.test(s)).slice(0, 20);
  if (!ids.length) return NextResponse.json({ items: [] });
  const { items } = await listAnime({ filter: { id: ids.join(",") }, limit: 20, revalidate: 1800 });
  return NextResponse.json(
    { items: items.map((a) => ({ id: a.id, slug: a.slug, title: a.title, poster: posterUrl(a, "small"), status: a.status, nextRelease: a.nextRelease, rating: a.rating })) },
    { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } },
  );
}
