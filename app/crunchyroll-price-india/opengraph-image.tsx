import { OG_SIZE, sectionCard } from "@/lib/og";
import { chartFor, chartPng } from "@/lib/charts";

export const revalidate = 604800;
export const alt = "Crunchyroll price in India compared with Netflix and JioHotstar";
export const size = OG_SIZE;
export const contentType = "image/png";

/** The price comparison chart (scripts/make-charts.mts), a static file; a plain card if it hasn't been drawn. */
export default async function OG() {
  const chart = chartFor("/crunchyroll-price-india");
  return chart ? chartPng(chart) : sectionCard({ kicker: "Crunchyroll India", title: "Crunchyroll price in India", sub: "Every plan in rupees, and what's in Hindi", posters: [] });
}
