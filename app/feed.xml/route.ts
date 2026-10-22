import { listAnime, uniqueById, seasonOf, animePath, fmtDate } from "@/lib/kitsu";
import { site, abs } from "@/lib/site";
import { rss, RssItem } from "@/lib/rss";

export const revalidate = 1800;

/** This week's upcoming episodes (JST) across the most-followed airing shows, newest first. */
export async function GET() {
  const { season, year } = seasonOf();
  const pages = await Promise.all([
    ...[0, 20].map((offset) => listAnime({ filter: { status: "current", season, seasonYear: String(year) }, sort: "-userCount", limit: 20, offset, revalidate: 1800 })),
    listAnime({ filter: { status: "current" }, sort: "-userCount", limit: 20, revalidate: 1800 }),
  ]);
  const now = Date.now();
  const items: RssItem[] = uniqueById(pages.flatMap((p) => p.items))
    .filter((a) => a.nextRelease && new Date(a.nextRelease).getTime() > now - 86400000)
    .map((a) => ({
      title: `${a.title} – next episode ${fmtDate(a.nextRelease, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Tokyo" })} JST`,
      link: abs(animePath(a)),
      guid: `${a.id}:${a.nextRelease}`,
      description: `${a.title} airs its next episode on ${fmtDate(a.nextRelease, { weekday: "long", month: "long", day: "numeric" })} (Japan time). ${a.streaming.length ? `Streaming on ${a.streaming.map((s) => s.site).join(", ")}.` : ""}`.trim(),
      date: new Date(a.nextRelease!),
    }))
    .sort((x, y) => x.date.getTime() - y.date.getTime());
  return rss({ title: `${site.name} – this week's anime episodes`, link: abs("/feed.xml"), description: "Upcoming episode air times for the most-followed currently airing anime.", items });
}
