import { getAnimeBySlug, getEpisodes, getLastAiredBest, animePath, episodePath, fmtDate } from "@/lib/kitsu";
import { site, abs } from "@/lib/site";
import { rss, RssItem } from "@/lib/rss";

export const revalidate = 3600;
// Render on first request, then serve from the ISR cache until revalidated.
export async function generateStaticParams() { return []; }

/** Per-series feed: latest catalogued episodes plus the next scheduled one. */
export async function GET(_req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const a = await getAnimeBySlug(decodeURIComponent(slug));
  if (!a) return new Response("Not found", { status: 404 });
  const { lastAired, reliable, nextAt } = await getLastAiredBest(a.id);
  if (nextAt) a.nextRelease = nextAt;
  const page = Math.max(1, Math.ceil(Math.max(lastAired, 1) / 20));
  const [cur, prev] = await Promise.all([getEpisodes(a.id, page, 20), page > 1 ? getEpisodes(a.id, page - 1, 20) : Promise.resolve({ items: [], total: 0, limit: 20, offset: 0 })]);
  const items: RssItem[] = [...prev.items, ...cur.items]
    .filter((e) => e.airdate && e.number)
    .map((e) => ({ title: `${a.title} Episode ${e.number}${e.title ? `: ${e.title}` : ""}`, link: abs(episodePath(a, e.number!)), description: e.synopsis || `Aired ${fmtDate(e.airdate)}.`, date: new Date(`${e.airdate}T12:00:00+09:00`) }))
    .sort((x, y) => y.date.getTime() - x.date.getTime())
    .slice(0, 25);
  if (a.status === "current" && a.nextRelease && reliable) {
    items.unshift({ title: `${a.title} Episode ${lastAired + 1} – airs ${fmtDate(a.nextRelease, { weekday: "long", month: "long", day: "numeric" })}`, link: abs(episodePath(a, lastAired + 1)), guid: `${a.id}:next:${a.nextRelease}`, description: `Next episode of ${a.title}, scheduled for ${fmtDate(a.nextRelease, { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Tokyo" })} JST.`, date: new Date(a.nextRelease) });
  }
  return rss({ title: `${a.title} – episodes (${site.name})`, link: abs(`${animePath(a)}/feed.xml`), description: `New and upcoming episodes of ${a.title}.`, items });
}
