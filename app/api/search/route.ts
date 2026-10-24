import { NextResponse } from "next/server";
import { searchAnime, posterUrl } from "@/lib/kitsu";

/** GET /api/search?q= → up to 12 compact results (tier-list maker). */
export async function GET(req: Request) {
  const q = (new URL(req.url).searchParams.get("q") || "").trim().slice(0, 80);
  if (q.length < 2) return NextResponse.json({ items: [] });
  const items = (await searchAnime(q, 12)).map((a) => ({ id: a.id, slug: a.slug, title: a.title, poster: posterUrl(a, "small") }));
  return NextResponse.json({ items }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
