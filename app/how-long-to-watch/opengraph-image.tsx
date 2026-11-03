import { listAnime, posterUrl } from "@/lib/kitsu";
import { sectionCard, ogPosters, OG_SIZE } from "@/lib/og";

export const revalidate = 86400;
export const alt = "How long to watch any anime";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function OG() {
  const posters = await ogPosters(() => listAnime({ sort: "-userCount", limit: 10 }).then((r) => r.items), (a: Parameters<typeof posterUrl>[0]) => posterUrl(a, "medium"));
  return sectionCard({ kicker: "Binge planner", title: "How long to watch any anime", sub: "Total runtime and binge time for every popular series", posters });
}
