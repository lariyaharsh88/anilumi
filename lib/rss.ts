const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

export type RssItem = { title: string; link: string; description: string; date: Date; guid?: string };

export function rss(opts: { title: string; link: string; description: string; items: RssItem[] }): Response {
  const body = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
<channel>
<title>${esc(opts.title)}</title>
<link>${esc(opts.link)}</link>
<description>${esc(opts.description)}</description>
<language>en</language>
<lastBuildDate>${new Date().toUTCString()}</lastBuildDate>
<atom:link href="${esc(opts.link)}" rel="self" type="application/rss+xml"/>
${opts.items
  .map(
    (i) => `<item>
<title>${esc(i.title)}</title>
<link>${esc(i.link)}</link>
<guid isPermaLink="false">${esc(i.guid || i.link)}</guid>
<pubDate>${i.date.toUTCString()}</pubDate>
<description>${esc(i.description)}</description>
</item>`,
  )
  .join("\n")}
</channel>
</rss>`;
  return new Response(body, { headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=3600" } });
}
