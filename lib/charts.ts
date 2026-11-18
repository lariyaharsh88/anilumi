/**
 * Original chart images for the top ranking pages (scripts/make-charts.mts): drawn once from the site's own data and
 * served as static files, as an in-page figure and as the page's share image. Pure lookup.
 */
import data from "@/data/charts.json";

export type Chart = { src: string; alt: string };
const PAGES = (data as { pages: Record<string, Chart> }).pages;

/** The chart for a page path ("/watch-order/naruto"), if one was drawn. */
export const chartFor = (path: string): Chart | null => PAGES[path] ?? null;

/** A chart's PNG bytes, for a share-image route: through the static-assets binding on Cloudflare, from disk on Node. */
export async function chartPng(c: Chart): Promise<Response> {
  const { publicFile } = await import("./og");
  const body = await publicFile(c.src);
  return new Response(body as BodyInit, { headers: { "Content-Type": "image/png", "Cache-Control": "public, max-age=604800, immutable" } });
}
