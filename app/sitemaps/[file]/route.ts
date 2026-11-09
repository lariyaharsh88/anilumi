import { notFound } from "next/navigation";
import { sitemapEntries } from "@/lib/sitemap-entries";
import { groupEntries, SITEMAP_GROUPS, urlsetXml } from "@/lib/sitemap-xml";

export const revalidate = 86400;
export const dynamicParams = false;
export function generateStaticParams() { return SITEMAP_GROUPS.map((g) => ({ file: `${g}.xml` })); }

/** One page type's URLs, with images and Hindi/English alternates (lib/sitemap-xml.ts). */
export async function GET(_req: Request, { params }: { params: Promise<{ file: string }> }) {
  const group = (await params).file.replace(/\.xml$/, "");
  if (!SITEMAP_GROUPS.includes(group)) notFound();
  const entries = groupEntries(await sitemapEntries()).get(group) ?? [];
  return new Response(urlsetXml(entries), { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
