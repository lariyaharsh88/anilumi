import { listAnime, posterUrl } from "@/lib/kitsu";
import { sectionCard, ogPosters, OG_SIZE } from "@/lib/og";

export const revalidate = 86400;
export const alt = "Anime watch orders";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function OG() {
  const posters = await ogPosters(() => listAnime({ filter: { subtype: "TV" }, sort: "-userCount", limit: 10 }).then((r) => r.items), (a: Parameters<typeof posterUrl>[0]) => posterUrl(a, "medium"));
  return sectionCard({ kicker: "Franchise guides", title: "Anime watch orders", sub: "675 franchises in the right order, recaps to skip and binge time", posters });
}
