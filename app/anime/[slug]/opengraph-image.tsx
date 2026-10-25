import { getAnimeBySlug, posterUrl, statusLabel, subtypeLabel } from "@/lib/kitsu";
import { posterCard, OG_SIZE } from "@/lib/og";

export const revalidate = 604800;
// Render on first request, then serve from the ISR cache until revalidated.
export async function generateStaticParams() { return []; }

export const alt = "Anime details";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function OG({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = await getAnimeBySlug(decodeURIComponent(slug));
  const year = a?.startDate?.slice(0, 4);
  return posterCard({
    poster: a ? posterUrl(a, "large") : null,
    kicker: a ? `${subtypeLabel(a.subtype)} · ${statusLabel(a.status)}${year ? ` · ${year}` : ""}` : "Anime",
    title: a?.title || "Anime not found",
    sub: a ? `${a.episodeCount ? `${a.episodeCount} episodes · ` : ""}${a.categories.slice(0, 3).map((c) => c.title).join(", ") || "Episodes, release dates & where to watch"}` : "",
    badge: a?.rating ? `★ ${(a.rating / 10).toFixed(1)}` : null,
  });
}
