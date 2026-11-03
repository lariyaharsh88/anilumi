import { getAnimeBySlug, posterUrl, type Anime } from "@/lib/kitsu";
import { sectionCard, ogPosters, OG_SIZE } from "@/lib/og";

export const revalidate = 86400;
export const alt = "Anime filler lists";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function OG() {
  const posters = await ogPosters(async () => (await Promise.all(["naruto-shippuden", "one-piece", "bleach"].map((s) => getAnimeBySlug(s)))).filter((a): a is Anime => Boolean(a)), (a: Parameters<typeof posterUrl>[0]) => posterUrl(a, "medium"));
  return sectionCard({ kicker: "Skip the filler", title: "Anime filler lists", sub: "Every filler, recap and mixed episode for Naruto, One Piece, Bleach and more", posters });
}
