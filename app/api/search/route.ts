import { NextResponse } from "next/server";
import { searchAnime, posterUrl, subtypeLabel } from "@/lib/kitsu";

/** GET /api/search?q=&limit= → compact results for the header autocomplete and the tier-list maker. */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") || "").trim().slice(0, 80);
  const limit = Math.min(12, Math.max(1, Number(sp.get("limit")) || 12));
  if (q.length < 2) return NextResponse.json({ items: [] });
  const items = (await searchAnime(q, limit)).map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    poster: posterUrl(a, "small"),
    type: subtypeLabel(a.subtype),
    year: a.startDate?.slice(0, 4) || null,
    score: a.rating ? Math.round(a.rating) / 10 : null,
    status: a.status,
  }));
  return NextResponse.json({ items }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
