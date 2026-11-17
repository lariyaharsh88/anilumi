import { NextResponse } from "next/server";
import { searchAnime, posterUrl, subtypeLabel } from "@/lib/kitsu";
import { searchPeople, type PersonHit } from "@/lib/peoplesearch";

const KIND_LABEL: Record<PersonHit["kind"], string> = { character: "Character", "voice-actor": "Voice actor", "hindi-voice": "Hindi voice artist" };

/**
 * GET /api/search?q=&limit= → compact results for the header autocomplete and the tier-list maker: anime from Kitsu,
 * plus characters and voice actors from the site's own snapshots (lib/peoplesearch.ts). A person whose name matches
 * outright ("gojo", "kana hanazawa") comes before the anime; looser matches after. ?anime=1 returns anime only.
 */
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const q = (sp.get("q") || "").trim().slice(0, 80);
  const limit = Math.min(12, Math.max(1, Number(sp.get("limit")) || 12));
  if (q.length < 2) return NextResponse.json({ items: [] });
  const anime = (await searchAnime(q, limit)).map((a) => ({
    id: a.id,
    slug: a.slug,
    title: a.title,
    poster: posterUrl(a, "small"),
    type: subtypeLabel(a.subtype),
    year: a.startDate?.slice(0, 4) || null,
    score: a.rating ? Math.round(a.rating) / 10 : null,
    status: a.status,
  }));
  if (sp.get("anime") === "1") return NextResponse.json({ items: anime }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
  const people = searchPeople(q, 4).map((p) => ({ id: `p:${p.href}`, slug: "", title: p.name, poster: p.image, type: KIND_LABEL[p.kind], year: p.sub.split(" · ").slice(1).join(" · ") || null, score: null, status: "", href: p.href, person: true, strong: p.strong }));
  const strong = people.filter((p) => p.strong).slice(0, 3);
  const items = [...strong, ...anime.slice(0, Math.max(3, limit - strong.length)), ...people.filter((p) => !strong.includes(p)).slice(0, 2)];
  return NextResponse.json({ items }, { headers: { "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400" } });
}
