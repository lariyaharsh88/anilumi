import AnimeOG from "../opengraph-image";
import { OG_SIZE } from "@/lib/og";
import { chartFor, chartPng } from "@/lib/charts";

export const revalidate = 604800;
// Render on first request, then serve from the ISR cache until revalidated.
export async function generateStaticParams() { return []; }

export const alt = "Filler list";
export const size = OG_SIZE;
export const contentType = "image/png";

/** The filler chart (scripts/make-charts.mts) where one was drawn, else the anime's own card, as before. */
export default async function OG({ params }: { params: Promise<{ slug: string }> }) {
  const chart = chartFor(`/anime/${decodeURIComponent((await params).slug)}/filler-list`);
  return chart ? chartPng(chart) : AnimeOG({ params });
}
