import type { MetadataRoute } from "next";
import { abs } from "@/lib/site";
import { listAnime, getCategories, seasonOf, shiftSeason, animePath, episodePath, getLastAired } from "@/lib/kitsu";

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const out: MetadataRoute.Sitemap = [
    { url: abs("/"), lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: abs("/schedule"), lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: abs("/genre"), lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: abs("/watch-order"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: abs("/about"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    ...["rated", "popular", "airing", "upcoming", "movies", "tv"].map((l) => ({ url: abs(`/top/${l}`), lastModified: now, changeFrequency: "daily" as const, priority: 0.8 })),
  ];
  const s = seasonOf(now);
  for (let d = -8; d <= 2; d++) {
    const x = shiftSeason(s.season, s.year, d);
    out.push({ url: abs(`/season/${x.year}/${x.season}`), lastModified: now, changeFrequency: d >= -1 ? "daily" : "monthly", priority: d >= -1 ? 0.8 : 0.5 });
  }
  try {
    const genres = await getCategories(60);
    for (const g of genres) out.push({ url: abs(`/genre/${g.slug}`), lastModified: now, changeFrequency: "weekly", priority: 0.6 });
    const pages = await Promise.all(Array.from({ length: 25 }, (_, i) => listAnime({ sort: "-userCount", limit: 20, offset: i * 20, revalidate: 86400 })));
    const airing = await listAnime({ filter: { status: "current" }, sort: "-userCount", limit: 20, revalidate: 86400 });
    // Episode pages: latest 3 + next for every airing show (the weekly-refreshed queries).
    const seasonal = await listAnime({ filter: { status: "current", season: s.season, seasonYear: String(s.year) }, sort: "-userCount", limit: 20, revalidate: 86400 });
    const airingSet = new Map([...airing.items, ...seasonal.items].map((a) => [a.id, a]));
    const latestAll = await Promise.all([...airingSet.values()].map((a) => getLastAired(a.id)));
    [...airingSet.values()].forEach((a, i) => {
      const { lastAired, reliable } = latestAll[i];
      for (const n of reliable ? [lastAired - 2, lastAired - 1, lastAired, lastAired + 1] : [lastAired - 2, lastAired - 1, lastAired]) {
        if (n >= 1) out.push({ url: abs(episodePath(a, n)), lastModified: now, changeFrequency: "daily", priority: n === lastAired + 1 ? 0.8 : 0.6 });
      }
    });
    const seen = new Set<string>();
    for (const a of [...airing.items, ...pages.flatMap((p) => p.items)]) {
      if (seen.has(a.id)) continue;
      seen.add(a.id);
      out.push({ url: abs(animePath(a)), lastModified: now, changeFrequency: a.status === "current" ? "daily" : "weekly", priority: a.status === "current" ? 0.8 : 0.7 });
      if (a.subtype !== "movie") out.push({ url: abs(`${animePath(a)}/episodes`), lastModified: now, changeFrequency: a.status === "current" ? "daily" : "monthly", priority: 0.5 });
      if (a.subtype === "TV" && seen.size <= 200) out.push({ url: abs(`/watch-order/${a.slug}`), lastModified: now, changeFrequency: "weekly", priority: 0.6 });
    }
  } catch {
    /* upstream hiccup: ship the static part of the sitemap */
  }
  return out;
}
