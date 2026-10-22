import { getAnimeBySlug, getEpisodeByNumber, getLastAiredBest, posterUrl, fmtDate, isFuture } from "@/lib/kitsu";
import { posterCard, OG_SIZE } from "@/lib/og";

export const alt = "Episode release date";
export const size = OG_SIZE;
export const contentType = "image/png";

export default async function OG({ params }: { params: Promise<{ slug: string; n: string }> }) {
  const { slug, n } = await params;
  const a = await getAnimeBySlug(decodeURIComponent(slug));
  const ep = a ? await getEpisodeByNumber(a.id, Number(n)) : null;
  if (a && a.status === "current" && !ep?.airdate) {
    const info = await getLastAiredBest(a.id);
    if (info.nextAt && Number(n) === info.lastAired + 1) a.nextRelease = info.nextAt;
  }
  const iso = ep?.airdate || a?.nextRelease || null;
  const upcoming = !iso || isFuture(iso);
  const when = iso ? fmtDate(iso, { month: "long", day: "numeric", year: "numeric" }) : null;
  return posterCard({
    poster: a ? posterUrl(a, "large") : null,
    kicker: `${a?.title || "Anime"} · Episode ${n}`,
    title: ep?.title || `Episode ${n} release date`,
    sub: when ? `${upcoming ? "Airs" : "Aired"} ${when} (JST)` : "Release date TBA",
    badge: upcoming ? "Live countdown inside" : "Recap & where to watch",
  });
}
