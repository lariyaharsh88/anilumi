import { listAnime, posterUrl } from "@/lib/kitsu";
import { sectionCard, ogPosters, OG_SIZE } from "@/lib/og";

export const revalidate = 86400;
export const alt = "Is this anime OK for kids?";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function OG() {
  const posters = await ogPosters(() => listAnime({ filter: { ageRating: "G,PG" }, sort: "-userCount", limit: 10 }).then((r) => r.items), (a: Parameters<typeof posterUrl>[0]) => posterUrl(a, "medium"));
  return sectionCard({ kicker: "Parents' guide", title: "Is this anime OK for kids?", sub: "Age ratings and content notes for popular anime", posters });
}
