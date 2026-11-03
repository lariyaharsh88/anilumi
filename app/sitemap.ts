import type { MetadataRoute } from "next";
import { abs } from "@/lib/site";
import { WATCH_ORDER_OVERRIDES } from "@/data/watch-orders";
import { listAnime, getCategories, seasonOf, shiftSeason, animePath, episodePath, TREND_GENRES } from "@/lib/kitsu";
import { popularVoiceActors, vaPath } from "@/lib/anilist";
import { allDays, birthdaysOn, bdPath, monthPath } from "@/lib/birthdays";
import { fillerSlugs, continuationSlugs } from "@/lib/filler";
import { topCharacterSlugs, characterTableSlugs } from "@/lib/charsnap";
import { airing as airingSnapshot, upcomingOf } from "@/lib/airing";
import { HINDI_SLUGS, hindiPath } from "@/lib/hindi";
import { INDEXED_CHARACTERS, airsSoon, searchShownPaths } from "@/lib/indexing";
import aliasData from "@/data/aliases.json";
import franchiseData from "@/data/franchises.json";

export const revalidate = 86400;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  const out: MetadataRoute.Sitemap = [
    { url: abs("/"), lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: abs("/schedule"), lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: abs("/genre"), lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: abs("/watch-order"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: abs("/lists"), lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: abs("/trends"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    ...TREND_GENRES.map(([g]) => ({ url: abs(`/trends/${g}`), lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 })),
    // One watch order per franchise (data/franchises.json, monthly): editorial ones first, then up to 1,000 more
    // with at least two entries. Season pages point their canonical at these, so they aren't listed.
    ...[...new Set([...Object.keys(WATCH_ORDER_OVERRIDES), ...(franchiseData as { franchises: { s: string; n: number }[] }).franchises.filter((f) => f.n > 1).slice(0, 1000).map((f) => f.s)])]
      .map((slug, i) => ({ url: abs(`/watch-order/${slug}`), lastModified: now, changeFrequency: "weekly" as const, priority: i < 100 ? 0.8 : 0.6 })),
    { url: abs("/short-anime"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: abs("/how-long-to-watch"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: abs("/parents-guide"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    { url: abs("/upcoming-seasons"), lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: abs("/filler-lists"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    ...fillerSlugs().map((slug) => ({ url: abs(`${animePath({ slug })}/filler-list`), lastModified: now, changeFrequency: "monthly" as const, priority: 0.7 })),
    { url: abs("/anime-to-manga"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    ...continuationSlugs().map((slug) => ({ url: abs(`${animePath({ slug })}/manga`), lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 })),
    { url: abs("/voice-actors"), lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: abs("/characters"), lastModified: now, changeFrequency: "monthly", priority: 0.7 },
    { url: abs("/hi"), lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    ...HINDI_SLUGS.map((s) => ({ url: abs(hindiPath(s)), lastModified: now, changeFrequency: "weekly" as const, priority: 0.6 })),
    { url: abs("/anime-openings"), lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: abs("/tier-list"), lastModified: now, changeFrequency: "weekly", priority: 0.6 },
    { url: abs("/what-anime-is-this"), lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: abs("/news"), lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: abs("/quiz"), lastModified: now, changeFrequency: "monthly", priority: 0.6 },
    { url: abs("/my/wrapped"), lastModified: now, changeFrequency: "monthly", priority: 0.5 },
    { url: abs("/birthdays"), lastModified: now, changeFrequency: "daily", priority: 0.7 },
    ...Array.from({ length: 12 }, (_, i) => ({ url: abs(monthPath(i + 1)), lastModified: now, changeFrequency: "monthly" as const, priority: 0.6 })),
    { url: abs("/on-this-day"), lastModified: now, changeFrequency: "daily", priority: 0.7 },
    // Only indexed character pages (lib/indexing.ts): the most-favourited ones plus any Google already shows.
    ...[...new Set([...topCharacterSlugs(INDEXED_CHARACTERS), ...searchShownPaths("/character/").map((p) => p.slice("/character/".length))])]
      .map((s, i) => ({ url: abs(`/character/${s}`), lastModified: now, changeFrequency: "monthly" as const, priority: i < 100 ? 0.6 : 0.4 })),
    ...characterTableSlugs().map((s) => ({ url: abs(`/anime/${s}/characters`), lastModified: now, changeFrequency: "monthly" as const, priority: 0.5 })),
    { url: abs("/hype"), lastModified: now, changeFrequency: "daily", priority: 0.6 },
    { url: abs("/polls"), lastModified: now, changeFrequency: "weekly", priority: 0.4 },
    { url: abs("/advertise"), lastModified: now, changeFrequency: "monthly", priority: 0.3 },
    { url: abs("/contact"), lastModified: now, changeFrequency: "yearly", priority: 0.3 },
    { url: abs("/privacy"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    ...allDays().filter(({ m, d }) => birthdaysOn(m, d).characters.length).map(({ m, d }) => ({ url: abs(bdPath(m, d)), lastModified: now, changeFrequency: "yearly" as const, priority: 0.4 })),
    // Query-string variants are disallowed in robots.txt, so only the plain URL is listed.
    { url: abs("/tonight"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    ...Array.from({ length: now.getFullYear() - 1999 }, (_, i) => ({ url: abs(`/best/${now.getFullYear() - i}`), lastModified: now, changeFrequency: (i === 0 ? "daily" : "monthly") as "daily" | "monthly", priority: i < 3 ? 0.8 : 0.5 })),
    { url: abs("/about"), lastModified: now, changeFrequency: "yearly", priority: 0.2 },
    ...["rated", "popular", "airing", "upcoming", "movies", "tv"].map((l) => ({ url: abs(`/top/${l}`), lastModified: now, changeFrequency: "daily" as const, priority: 0.8 })),
  ];
  const s = seasonOf(now);
  for (let d = -8; d <= 2; d++) {
    const x = shiftSeason(s.season, s.year, d);
    out.push({ url: abs(`/season/${x.year}/${x.season}`), lastModified: now, changeFrequency: d >= -1 ? "daily" : "monthly", priority: d >= -1 ? 0.8 : 0.5 });
    if (d >= 0) out.push({ url: abs(`/season/${x.year}/${x.season}/preview`), lastModified: now, changeFrequency: "daily", priority: 0.8 });
  }
  try {
    const genres = await getCategories(60);
    for (const g of genres) out.push({ url: abs(`/genre/${g.slug}`), lastModified: now, changeFrequency: "weekly", priority: 0.6 });
    // Kept deliberately small: each URL listed here gets crawled and rendered, and on a metered host
    // every render costs compute and cache writes. Deeper pages stay reachable through internal links.
    const pages = await Promise.all(Array.from({ length: 10 }, (_, i) => listAnime({ sort: "-userCount", limit: 20, offset: i * 20, revalidate: 86400 })));
    // The 60 most-followed airing shows (3 pages): episode pages convert, so every popular airing show gets them.
    const airingPages = await Promise.all([0, 20, 40].map((offset) => listAnime({ filter: { status: "current" }, sort: "-userCount", limit: 20, offset, revalidate: 86400 })));
    const airing = { items: airingPages.flatMap((p) => p.items) };
    out.push({ url: abs("/compare"), lastModified: now, changeFrequency: "monthly", priority: 0.5 });
    // Episode pages: each airing show's episodes due in the next two weeks (the snapshot has their exact air
    // times). Aired ones aren't listed: Kitsu often lacks their dates, and older recaps are noindexed
    // (lib/indexing.ts). Episode pages Google already shows are listed.
    const snap = await airingSnapshot();
    for (const p of searchShownPaths("/anime/").filter((p) => p.includes("/episode/"))) out.push({ url: abs(p), lastModified: now, changeFrequency: "weekly", priority: 0.5 });
    for (const show of snap.shows) {
      if (!show.s) continue;
      const upcoming = upcomingOf(show);
      const next = upcoming[0]?.episode;
      if (!next) continue;
      for (const ep of upcoming.filter((u) => airsSoon(u.at)).map((u) => u.episode)) out.push({ url: abs(episodePath({ slug: show.s }, ep)), lastModified: now, changeFrequency: "daily", priority: ep === next ? 0.6 : 0.5 });
    }
    const seen = new Set<string>();
    for (const a of [...airing.items, ...pages.flatMap((p) => p.items)]) {
      if (seen.has(a.id)) continue;
      seen.add(a.id);
      const n = seen.size;
      const released = a.status !== "upcoming" && a.status !== "tba" && a.status !== "unreleased";
      const series = a.subtype === "TV" || a.subtype === "ONA";
      out.push({ url: abs(animePath(a)), lastModified: now, changeFrequency: a.status === "current" ? "daily" : "weekly", priority: a.status === "current" ? 0.8 : 0.7 });
      if (n > 100) continue;
      if (series && released) out.push({ url: abs(`${animePath(a)}/next-season`), lastModified: now, changeFrequency: "weekly", priority: 0.7 });
      if (released) out.push({ url: abs(`${animePath(a)}/how-long-to-watch`), lastModified: now, changeFrequency: "monthly", priority: 0.6 });
      if (a.subtype !== "movie" && a.status === "current") out.push({ url: abs(`${animePath(a)}/episodes`), lastModified: now, changeFrequency: "daily", priority: 0.5 });
      if (n > 50) continue;
      out.push({ url: abs(`${animePath(a)}/cast`), lastModified: now, changeFrequency: "monthly", priority: 0.5 });
      if (released) out.push({ url: abs(`${animePath(a)}/openings-endings`), lastModified: now, changeFrequency: "monthly", priority: 0.5 });
      out.push({ url: abs(`${animePath(a)}/parents-guide`), lastModified: now, changeFrequency: "monthly", priority: 0.5 });
    }
    // "Anime like X" has the best click-through on the site: list it for the 500 most-followed titles (ranked in
    // the alias index, so no extra API calls).
    for (const x of (aliasData as { anime: { s: string }[] }).anime.slice(0, 500)) out.push({ url: abs(`/similar/${x.s}`), lastModified: now, changeFrequency: "monthly", priority: 0.5 });
    // Most-followed voice actors only (the hub's own cached request).
    for (const v of await popularVoiceActors()) out.push({ url: abs(vaPath(v)), lastModified: now, changeFrequency: "monthly", priority: 0.4 });
  } catch {
    /* upstream hiccup: ship the static part of the sitemap */
  }
  return out;
}
