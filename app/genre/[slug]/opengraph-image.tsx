import { getCategory, listAnime, posterUrl } from "@/lib/kitsu";
import { sectionCard, ogPosters, OG_SIZE } from "@/lib/og";

export const revalidate = 604800;
// Render on first request, then serve from the ISR cache until revalidated.
export async function generateStaticParams() { return []; }

export const alt = "Anime genre";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function OG({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const g = await getCategory(decodeURIComponent(slug)).catch(() => null);
  const posters = await ogPosters(() => listAnime({ filter: { categories: g?.slug || slug }, sort: "-userCount", limit: 10 }).then((r) => r.items), (a: Parameters<typeof posterUrl>[0]) => posterUrl(a, "medium"));
  return sectionCard({
    kicker: "Genre",
    title: g ? `Best ${g.title} anime` : "Anime by genre",
    sub: g?.count ? `${g.count.toLocaleString()} titles, ranked by popularity and score` : "Ranked by popularity and score",
    posters,
  });
}
