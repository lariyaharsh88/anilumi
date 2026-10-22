import type { MetadataRoute } from "next";
import { abs } from "@/lib/site";
import { listAnime, getCategories, seasonOf, shiftSeason, animePath, episodePath, getLastAiredBest, getCharacters, getProductions } from "@/lib/kitsu";

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const out: MetadataRoute.Sitemap = [
    { url: abs("/"), lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: abs("/schedule"), lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: abs("/genre"), lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: abs("/watch-order"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: abs("/lists"), lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: abs("/short-anime"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    ...Array.from({ length: now.getFullYear() - 1999 }, (_, i) => ({ url: abs(`/best/${now.getFullYear() - i}`), lastModified: now, changeFrequency: (i === 0 ? "daily" : "monthly") as "daily" | "monthly", priority: i < 3 ? 0.8 : 0.5 })),
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
    const latestAll = await Promise.all([...airingSet.values()].map((a) => getLastAiredBest(a.id)));
    [...airingSet.values()].forEach((a, i) => {
      const { lastAired, reliable } = latestAll[i];
      for (const n of reliable ? [lastAired - 2, lastAired - 1, lastAired, lastAired + 1] : [lastAired - 2, lastAired - 1, lastAired]) {
        if (n >= 1) out.push({ url: abs(episodePath(a, n)), lastModified: now, changeFrequency: "daily", priority: n === lastAired + 1 ? 0.8 : 0.6 });
      }
    });
    // Character and studio pages for the 60 most popular titles.
    const top60 = pages.slice(0, 3).flatMap((p) => p.items);
    const [chars, prods] = await Promise.all([Promise.all(top60.map((a) => getCharacters(a.id, 6))), Promise.all(top60.map((a) => getProductions(a.id)))]);
    const charSeen = new Set<string>(), studioSeen = new Set<string>();
    chars.flat().forEach((c) => { if (!charSeen.has(c.slug)) { charSeen.add(c.slug); out.push({ url: abs(`/character/${c.slug}`), lastModified: now, changeFrequency: "monthly", priority: 0.4 }); } });
    prods.flat().filter((p) => p.role === "studio").forEach((p) => { if (!studioSeen.has(p.producer.slug)) { studioSeen.add(p.producer.slug); out.push({ url: abs(`/studio/${p.producer.slug}`), lastModified: now, changeFrequency: "weekly", priority: 0.6 }); } });
    const seen = new Set<string>();
    for (const a of [...airing.items, ...pages.flatMap((p) => p.items)]) {
      if (seen.has(a.id)) continue;
      seen.add(a.id);
      out.push({ url: abs(animePath(a)), lastModified: now, changeFrequency: a.status === "current" ? "daily" : "weekly", priority: a.status === "current" ? 0.8 : 0.7 });
      if (a.subtype !== "movie") out.push({ url: abs(`${animePath(a)}/episodes`), lastModified: now, changeFrequency: a.status === "current" ? "daily" : "monthly", priority: 0.5 });
      if (a.subtype === "TV" && seen.size <= 200) out.push({ url: abs(`/watch-order/${a.slug}`), lastModified: now, changeFrequency: "weekly", priority: 0.6 });
      if (seen.size <= 300) out.push({ url: abs(`/similar/${a.slug}`), lastModified: now, changeFrequency: "weekly", priority: 0.5 });
    }
  } catch {
    /* upstream hiccup: ship the static part of the sitemap */
  }
  return out;
}
