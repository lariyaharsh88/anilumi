import { listAnime, posterUrl } from "@/lib/kitsu";
import { sectionCard, ogPosters, OG_SIZE } from "@/lib/og";

export const revalidate = 86400;
export const alt = "Anime airing this week";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function OG() {
  const posters = await ogPosters(() => listAnime({ filter: { status: "current" }, sort: "-userCount", limit: 10 }).then((r) => r.items), (a: Parameters<typeof posterUrl>[0]) => posterUrl(a, "medium"));
  return sectionCard({ kicker: "This week", title: "Anime airing this week", sub: "Every episode in your time zone, with live countdowns", posters });
}
