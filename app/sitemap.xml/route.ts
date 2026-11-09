import { sitemapEntries } from "@/lib/sitemap-entries";
import { groupEntries, indexXml, newest } from "@/lib/sitemap-xml";

export const revalidate = 86400;

/** Sitemap index: one child sitemap per page type (lib/sitemap-xml.ts). */
export async function GET() {
  const groups = [...groupEntries(await sitemapEntries())].filter(([, e]) => e.length).map(([group, e]) => ({ group, lastModified: newest(e) }));
  return new Response(indexXml(groups), { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
