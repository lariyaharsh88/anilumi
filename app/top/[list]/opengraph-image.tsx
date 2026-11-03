import { listAnime, posterUrl } from "@/lib/kitsu";
import { sectionCard, ogPosters, OG_SIZE } from "@/lib/og";
import { LISTS } from "./q/lists";

export const revalidate = 86400;
// Render on first request, then serve from the ISR cache until revalidated.
export async function generateStaticParams() { return []; }

export const alt = "Top anime";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function OG({ params }: { params: Promise<{ list: string }> }) {
  const { list } = await params;
  const def = LISTS[list] ?? LISTS.popular;
  const posters = await ogPosters(() => listAnime({ ...def.opts, limit: 10 }).then((r) => r.items), (a: Parameters<typeof posterUrl>[0]) => posterUrl(a, "medium"));
  return sectionCard({ kicker: "Top 100", title: def.h1.charAt(0).toUpperCase() + def.h1.slice(1), sub: def.description.split(". ")[0].replace(/\.$/, ""), posters });
}
