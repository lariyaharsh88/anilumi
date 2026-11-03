import { site } from "@/lib/site";
import { getTrending, posterUrl } from "@/lib/kitsu";
import { sectionCard, ogPosters, OG_SIZE } from "@/lib/og";

export const revalidate = 86400;
export const alt = site.name;
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function OG() {
  const posters = await ogPosters(() => getTrending(10), (a: Parameters<typeof posterUrl>[0]) => posterUrl(a, "medium"));
  return sectionCard({ kicker: "Anime guide", title: "Anime schedule, release dates & where to watch", sub: "Watch orders · binge planner · countdowns · seasonal charts", posters });
}
