import { getAnimeBySlug, posterUrl, type Anime } from "@/lib/kitsu";
import { sectionCard, ogPosters, OG_SIZE } from "@/lib/og";
import { hindiDubbed } from "@/lib/hindidub";

export const revalidate = 86400;
export const alt = "Anime with an official Hindi dub";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function OG() {
  const posters = await ogPosters(async () => (await Promise.all(["attack-on-titan", "kimetsu-no-yaiba", "naruto"].map((s) => getAnimeBySlug(s)))).filter((a): a is Anime => Boolean(a)), (a: Parameters<typeof posterUrl>[0]) => posterUrl(a, "medium"));
  return sectionCard({ kicker: "Hindi dub", title: "Hindi dubbed anime", sub: `${hindiDubbed().length} anime with an official Hindi dub, and where to watch each one`, posters });
}
