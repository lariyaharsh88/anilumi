/**
 * Sitemap XML: the index (/sitemap.xml) and one child per page type (/sitemaps/<type>.xml), from sitemapEntries.
 * Child files carry image entries (posters) and xhtml alternates (Hindi/English pairs). Pure helpers.
 */
import type { MetadataRoute } from "next";
import { abs } from "./site";

type Entry = MetadataRoute.Sitemap[number];

/** Page type of a URL, the child sitemap it belongs to. Pure. */
export function sitemapGroup(url: string): string {
  const p = new URL(url).pathname;
  if (/^\/anime\/[^/]+\/episode\//.test(p)) return "episodes";
  if (p.startsWith("/anime/")) return "anime";
  if (p.startsWith("/character")) return "characters";
  if (p.startsWith("/watch-order")) return "watch-orders";
  if (p.startsWith("/birthdays") || p === "/on-this-day") return "birthdays";
  if (p === "/hi" || p.startsWith("/hi/") || p === "/hindi-dub") return "hindi";
  if (p.startsWith("/voice-actor") || p.startsWith("/staff")) return "people";
  if (/^\/(genre|best|top|season|trends|similar|compare|upcoming-seasons|lists|short-anime|tier-list|anime-openings|filler-lists|anime-to-manga|how-long-to-watch|parents-guide)(\/|$)/.test(p)) return "lists";
  return "pages";
}
export const SITEMAP_GROUPS = ["anime", "episodes", "characters", "watch-orders", "birthdays", "hindi", "people", "lists", "pages"];

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const iso = (d: Entry["lastModified"]) => (d ? new Date(d).toISOString() : null);

export function urlsetXml(entries: Entry[]): string {
  const rows = entries.map((e) => {
    const parts = [`<loc>${esc(e.url)}</loc>`];
    const lm = iso(e.lastModified);
    if (lm) parts.push(`<lastmod>${lm}</lastmod>`);
    // Google ignores priority, but the cache warm-up orders by it (scripts/warm-cache.mjs).
    if (e.priority !== undefined) parts.push(`<priority>${e.priority}</priority>`);
    for (const [lang, href] of Object.entries(e.alternates?.languages ?? {})) if (href) parts.push(`<xhtml:link rel="alternate" hreflang="${esc(lang)}" href="${esc(String(href))}"/>`);
    for (const img of e.images ?? []) parts.push(`<image:image><image:loc>${esc(img)}</image:loc></image:image>`);
    return `<url>${parts.join("")}</url>`;
  });
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml">\n${rows.join("\n")}\n</urlset>\n`;
}

export function indexXml(groups: { group: string; lastModified: Date | null }[]): string {
  const rows = groups.map((g) => `<sitemap><loc>${esc(abs(`/sitemaps/${g.group}.xml`))}</loc>${g.lastModified ? `<lastmod>${g.lastModified.toISOString()}</lastmod>` : ""}</sitemap>`);
  return `<?xml version="1.0" encoding="UTF-8"?>\n<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${rows.join("\n")}\n</sitemapindex>\n`;
}

/** Entries split by page type, with each group's newest lastmod. Pure. */
export function groupEntries(entries: Entry[]): Map<string, Entry[]> {
  const out = new Map<string, Entry[]>(SITEMAP_GROUPS.map((g) => [g, []]));
  for (const e of entries) out.get(sitemapGroup(e.url))!.push(e);
  return out;
}
export const newest = (entries: Entry[]) => entries.reduce<Date | null>((m, e) => { const d = e.lastModified ? new Date(e.lastModified) : null; return d && (!m || d > m) ? d : m; }, null);
