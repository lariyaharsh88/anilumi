import { listAnime, posterUrl } from "@/lib/kitsu";
import { sectionCard, ogPosters, OG_SIZE } from "@/lib/og";

export const revalidate = 86400;
export const alt = "Every anime genre";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function OG() {
  const posters = await ogPosters(() => listAnime({ sort: "-userCount", offset: 6, limit: 10 }).then((r) => r.items), (a: Parameters<typeof posterUrl>[0]) => posterUrl(a, "medium"));
  return sectionCard({ kicker: "Browse", title: "Every anime genre", sub: "80 genres and themes, each ranked by popularity", posters });
}
