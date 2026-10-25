import { getAnimeBySlug, buildWatchOrder, posterUrl, fmtMinutes } from "@/lib/kitsu";
import { posterCard, OG_SIZE } from "@/lib/og";

export const revalidate = 604800;
// Render on first request, then serve from the ISR cache until revalidated.
export async function generateStaticParams() { return []; }

export const alt = "Watch order guide";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function OG({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = await getAnimeBySlug(decodeURIComponent(slug));
  const wo = a ? await buildWatchOrder(a) : null;
  return posterCard({
    poster: a ? posterUrl(a, "large") : null,
    kicker: "Watch order guide",
    title: wo ? `${wo.root.title} watch order` : "Watch order",
    sub: wo ? `${wo.mainCount} core entries · ${wo.entries.length - wo.mainCount} extras` : "",
    badge: wo?.totalMinutes ? `⏱ ${fmtMinutes(wo.totalMinutes)} to binge` : null,
  });
}
