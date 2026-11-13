import type { MetadataRoute } from "next";
import { posterUrl } from "@/lib/kitsu";
import { alAnime } from "@/lib/alsnap";
import { abs } from "@/lib/site";
import { WATCH_ORDER_OVERRIDES } from "@/data/watch-orders";
import { listAnime, getCategories, getAniListId, kitsuByAniListIds, seasonOf, shiftSeason, animePath, episodePath, runtimeMinutes, TREND_GENRES, MAIN_GENRES } from "@/lib/kitsu";
import { episodeMinutes } from "@/lib/binge";
import { popularVoiceActors, vaPath } from "@/lib/anilist";
import { allDays, birthdaysOn, bdPath, monthPath } from "@/lib/birthdays";
import { fillerSlugs, continuationSlugs } from "@/lib/filler";
import { characterTableSlugs, BLOOD_TYPES } from "@/lib/charsnap";
import { hindiArtists, hindiArtistPath } from "@/lib/hindivoices";
import { summaryFor } from "@/lib/summaries";
import { hasSnapshotCast } from "@/lib/castsnap";
import { hasSnapshotThemes } from "@/lib/themes";
import { airing as airingSnapshot, upcomingOf } from "@/lib/airing";
import { HINDI_SLUGS, hindiPath, hindiIndexed } from "@/lib/hindi";
import { allStreams, streamsPath } from "@/lib/streams";
import { strongSimilarIds } from "@/lib/picks";
import { HINDI_PLATFORMS, dubsOn } from "@/lib/hindidub";
import { airsSoon, searchShownPaths, similarSlugs, watchOrderIndexed, characterTableIndexed, notedCharacters, genreIndexed, bestYearIndexed, trendIndexed, voiceActorIndexed, castIndexed, howLongIndexed, NEXT_SEASON_MIN_MEMBERS } from "@/lib/indexing";
import franchiseData from "@/data/franchises.json";
import { DATA_DATES as D, STATIC_UPDATED, BIRTHDAY_PAGES_UPDATED, HINDI_HUB_UPDATED, latest, weekStart, monthStart } from "@/lib/lastmod";
import { FILLER } from "@/data/filler";


/**
 * Every URL the site offers search engines, with its real last-change date (lib/lastmod.ts), images (posters) and
 * Hindi/English alternates. Only pages that index themselves are listed (lib/indexing.ts); scripts/check-sitemap.mts
 * verifies each one returns 200, is indexable and is its own canonical. Served as a sitemap index (/sitemap.xml)
 * with one child sitemap per page type (/sitemaps/<type>.xml), so Search Console reports indexing per type.
 */
export async function sitemapEntries(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();
  // lastmod (lib/lastmod.ts): today only where content changes daily; otherwise when the data last changed.
  const weekly = latest(now, weekStart(now));
  const monthly = latest(now, monthStart(now));
  const at = (...d: (string | null | undefined)[]) => latest(now, ...d);
  const info = (path: string) => ({ url: abs(path), lastModified: at(STATIC_UPDATED[path]) });
  const out: MetadataRoute.Sitemap = [
    { url: abs("/"), lastModified: now, changeFrequency: "hourly", priority: 1 },
    { url: abs("/schedule"), lastModified: now, changeFrequency: "hourly", priority: 0.9 },
    { url: abs("/genre"), lastModified: weekly, changeFrequency: "weekly", priority: 0.6 },
    { url: abs("/watch-order"), lastModified: at(D.watchOrders), changeFrequency: "weekly", priority: 0.7 },
    { url: abs("/lists"), lastModified: weekly, changeFrequency: "weekly", priority: 0.6 },
    { url: abs("/trends"), lastModified: monthly, changeFrequency: "monthly", priority: 0.6 },
    ...TREND_GENRES.filter(([g]) => trendIndexed(g)).map(([g]) => ({ url: abs(`/trends/${g}`), lastModified: monthly, changeFrequency: "monthly" as const, priority: 0.6 })),
    // One watch order per franchise (data/franchises.json, monthly): editorial ones first, then the ones the page
    // itself indexes (lib/indexing.ts watchOrderIndexed: enough parts, two of them core). Season pages point their
    // canonical at these, so they aren't listed.
    ...[...new Set([...Object.keys(WATCH_ORDER_OVERRIDES), ...(franchiseData as { franchises: { s: string; n: number }[] }).franchises.filter((f) => watchOrderIndexed(f.s, f.n)).slice(0, 1000).map((f) => f.s)])]
      .map((slug, i) => ({ url: abs(`/watch-order/${slug}`), lastModified: at(D.watchOrders, WATCH_ORDER_OVERRIDES[slug]?.checked, D.arcs, D.manga), changeFrequency: "weekly" as const, priority: i < 100 ? 0.8 : 0.6, ...(hindiIndexed(slug) ? { alternates: { languages: { en: abs(`/watch-order/${slug}`), hi: abs(hindiPath(slug)) } } } : {}) })),
    { url: abs("/short-anime"), lastModified: weekly, changeFrequency: "weekly", priority: 0.7 },
    { url: abs("/how-long-to-watch"), lastModified: weekly, changeFrequency: "weekly", priority: 0.7 },
    { url: abs("/parents-guide"), lastModified: at(D.anilist), changeFrequency: "weekly", priority: 0.7 },
    { url: abs("/upcoming-seasons"), lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: abs("/filler-lists"), lastModified: at(D.watchOrders), changeFrequency: "monthly", priority: 0.7 },
    ...fillerSlugs().map((slug) => ({ url: abs(`${animePath({ slug })}/filler-list`), lastModified: at(FILLER[slug]?.reviewedOn, D.arcs), changeFrequency: "monthly" as const, priority: 0.7 })),
    { url: abs("/anime-to-manga"), lastModified: at(D.manga), changeFrequency: "monthly", priority: 0.7 },
    ...continuationSlugs().map((slug) => ({ url: abs(`${animePath({ slug })}/manga`), lastModified: at(D.manga), changeFrequency: "monthly" as const, priority: 0.6 })),
    { url: abs("/voice-actors"), lastModified: at(D.voiceActors), changeFrequency: "weekly", priority: 0.6 },
    { url: abs("/characters"), lastModified: at(D.characters), changeFrequency: "monthly", priority: 0.7 },
    { url: abs("/characters/blood-type"), lastModified: at(D.characters), changeFrequency: "monthly", priority: 0.5 },
    ...BLOOD_TYPES.map((t) => ({ url: abs(`/characters/blood-type/${t}`), lastModified: at(D.characters), changeFrequency: "monthly" as const, priority: 0.5 })),
    { url: abs("/hi"), lastModified: weekly, changeFrequency: "weekly", priority: 0.6 },
    { url: abs("/hindi-dub"), lastModified: at(D.dubs, HINDI_HUB_UPDATED), changeFrequency: "monthly", priority: 0.7 },
    { url: abs("/hi/hindi-dub"), lastModified: at(D.dubs, HINDI_HUB_UPDATED), changeFrequency: "monthly", priority: 0.6 },
    ...HINDI_PLATFORMS.filter((p) => dubsOn(p).length).map((p) => ({ url: abs(`/hindi-dub/${p.slug}`), lastModified: at(D.dubs, HINDI_HUB_UPDATED), changeFrequency: "monthly" as const, priority: 0.6 })),
    { url: abs("/where-to-watch"), lastModified: at(D.streams), changeFrequency: "monthly", priority: 0.8 },
    ...allStreams().map((e) => ({ url: abs(streamsPath(e.s)), lastModified: at(D.streams), changeFrequency: "monthly" as const, priority: 0.7 })),
    { url: abs("/dub-schedule"), lastModified: now, changeFrequency: "daily", priority: 0.8 },
    ...HINDI_SLUGS.filter(hindiIndexed).map((s) => ({ url: abs(hindiPath(s)), lastModified: at(D.watchOrders, D.dubs), changeFrequency: "weekly" as const, priority: 0.6, alternates: { languages: { en: abs(`/watch-order/${s}`), hi: abs(hindiPath(s)) } } })),
    { url: abs("/anime-openings"), lastModified: at(D.themes), changeFrequency: "weekly", priority: 0.6 },
    { url: abs("/tier-list"), lastModified: weekly, changeFrequency: "weekly", priority: 0.6 },
    { url: abs("/what-anime-is-this"), lastModified: at(), changeFrequency: "monthly", priority: 0.8 },
    { url: abs("/news"), lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: abs("/quiz"), lastModified: at(), changeFrequency: "monthly", priority: 0.6 },
    { url: abs("/random-anime-generator"), lastModified: at(D.anilist), changeFrequency: "monthly", priority: 0.6 },
    { url: abs("/birthdays"), lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: abs("/anime-birthday-twin"), lastModified: at(D.birthdays, D.charLines), changeFrequency: "monthly", priority: 0.6 },
    // Hindi voice artists: listed once researched (the hub 404s while the data file is empty).
    ...(hindiArtists().length ? [{ url: abs("/hindi-voice-artists"), lastModified: at(D.hindiVoices), changeFrequency: "monthly" as const, priority: 0.6 }, ...hindiArtists().map((a) => ({ url: abs(hindiArtistPath(a)), lastModified: at(D.hindiVoices), changeFrequency: "monthly" as const, priority: 0.5 }))] : []),
    ...Array.from({ length: 12 }, (_, i) => ({ url: abs(monthPath(i + 1)), lastModified: at(D.birthdays, D.charLines), changeFrequency: "monthly" as const, priority: 0.6 })),
    { url: abs("/on-this-day"), lastModified: now, changeFrequency: "daily", priority: 0.7 },
    // Only indexed character pages (lib/indexing.ts): those with verified notes plus any Google already shows.
    ...[...new Set([...notedCharacters(), ...searchShownPaths("/character/").map((p) => p.slice("/character/".length))])]
      .map((s, i) => ({ url: abs(`/character/${s}`), lastModified: at(D.characters, D.charNotes), changeFrequency: "monthly" as const, priority: i < 100 ? 0.6 : 0.4 })),
    ...characterTableSlugs().filter(characterTableIndexed).map((s) => ({ url: abs(`/anime/${s}/characters`), lastModified: at(D.seriesCharacters), changeFrequency: "monthly" as const, priority: 0.5 })),
    { url: abs("/hype"), lastModified: now, changeFrequency: "daily", priority: 0.6 },
    { ...info("/advertise"), changeFrequency: "monthly", priority: 0.3 },
    { ...info("/contact"), changeFrequency: "yearly", priority: 0.3 },
    { ...info("/privacy"), changeFrequency: "yearly", priority: 0.2 },
    ...allDays().filter(({ m, d }) => birthdaysOn(m, d).characters.length).map(({ m, d }) => ({ url: abs(bdPath(m, d)), lastModified: at(D.birthdays, D.charLines, D.charNotes, BIRTHDAY_PAGES_UPDATED), changeFrequency: "yearly" as const, priority: 0.4 })),
    // Query-string variants are disallowed in robots.txt, so only the plain URL is listed.
    { url: abs("/tonight"), lastModified: now, changeFrequency: "weekly", priority: 0.7 },
    ...Array.from({ length: now.getFullYear() - 1999 }, (_, i) => now.getFullYear() - i).filter((y) => bestYearIndexed(y, now)).map((y, i) => ({ url: abs(`/best/${y}`), lastModified: i === 0 ? now : monthly, changeFrequency: (i === 0 ? "daily" : "monthly") as "daily" | "monthly", priority: i < 3 ? 0.8 : 0.5 })),
    { ...info("/about"), changeFrequency: "yearly", priority: 0.2 },
    { ...info("/how-we-check"), changeFrequency: "monthly", priority: 0.2 },
    { ...info("/author/harsh-lariya"), changeFrequency: "monthly", priority: 0.2 },
    ...["rated", "popular", "airing", "upcoming", "movies", "tv"].map((l) => ({ url: abs(`/top/${l}`), lastModified: now, changeFrequency: "daily" as const, priority: 0.8 })),
  ];
  const s = seasonOf(now);
  for (let d = -8; d <= 2; d++) {
    const x = shiftSeason(s.season, s.year, d);
    out.push({ url: abs(`/season/${x.year}/${x.season}`), lastModified: d >= -1 ? now : at(D.seasonDubs), changeFrequency: d >= -1 ? "daily" : "monthly", priority: d >= -1 ? 0.8 : 0.5 });
    if (d >= 0) out.push({ url: abs(`/season/${x.year}/${x.season}/preview`), lastModified: now, changeFrequency: "daily", priority: 0.8 });
  }
  try {
    const genres = await getCategories(60);
    for (const g of genres) if (genreIndexed(g.slug, MAIN_GENRES.has(g.slug))) out.push({ url: abs(`/genre/${g.slug}`), lastModified: weekly, changeFrequency: "weekly", priority: 0.6 });
    // Kept deliberately small: each URL listed here gets crawled and rendered, and on a metered host
    // every render costs compute and cache writes. Deeper pages stay reachable through internal links.
    const pages = await Promise.all(Array.from({ length: 10 }, (_, i) => listAnime({ sort: "-userCount", limit: 20, offset: i * 20, revalidate: 86400 })));
    // The 60 most-followed airing shows (3 pages): episode pages convert, so every popular airing show gets them.
    const airingPages = await Promise.all([0, 20, 40].map((offset) => listAnime({ filter: { status: "current" }, sort: "-userCount", limit: 20, offset, revalidate: 86400 })));
    const airing = { items: airingPages.flatMap((p) => p.items) };
    out.push({ url: abs("/compare"), lastModified: at(), changeFrequency: "monthly", priority: 0.5 });
    // Episode pages: each airing show's episodes due in the next two weeks (the snapshot has their exact air
    // times). Aired ones aren't listed: Kitsu often lacks their dates, and older recaps are noindexed
    // (lib/indexing.ts). Episode pages Google already shows are listed.
    const snap = await airingSnapshot();
    for (const p of searchShownPaths("/anime/").filter((p) => p.includes("/episode/"))) out.push({ url: abs(p), lastModified: weekly, changeFrequency: "weekly", priority: 0.5 });
    for (const show of snap.shows) {
      if (!show.s) continue;
      const upcoming = upcomingOf(show);
      const next = upcoming[0]?.episode;
      if (!next) continue;
      for (const ep of upcoming.filter((u) => airsSoon(u.at)).map((u) => u.episode)) out.push({ url: abs(episodePath({ slug: show.s }, ep)), lastModified: now, changeFrequency: "daily", priority: ep === next ? 0.6 : 0.5 });
    }
    const seen = new Set<string>();
    // Cast and openings pages are listed only when the monthly snapshots have data for them; without it the page
    // renders empty and noindexes itself. AniList ids for the first 50 titles (Kitsu mappings, cached a week).
    const top50 = [...new Map([...airing.items, ...pages.flatMap((p) => p.items)].map((a) => [a.id, a])).values()].slice(0, 50);
    const alIds = new Map(await Promise.all(top50.map(async (a) => [a.id, await getAniListId(a.id).catch(() => null)] as const)));
    for (const a of [...airing.items, ...pages.flatMap((p) => p.items)]) {
      if (seen.has(a.id)) continue;
      seen.add(a.id);
      const n = seen.size;
      const released = a.status !== "upcoming" && a.status !== "tba" && a.status !== "unreleased";
      const series = a.subtype === "TV" || a.subtype === "ONA";
      const poster = posterUrl(a, "large");
      out.push({ url: abs(animePath(a)), lastModified: a.status === "current" ? now : at(D.anilist, D.arcs, D.manga, summaryFor(a.slug) ? D.summaries : null), changeFrequency: a.status === "current" ? "daily" : "weekly", priority: a.status === "current" ? 0.8 : 0.7, ...(poster ? { images: [poster] } : {}) });
      if (n > 100) continue;
      // Popular series only: the page noindexes "no news" answers for less-followed titles (lib/indexing.ts).
      if (series && released && a.userCount >= NEXT_SEASON_MIN_MEMBERS) out.push({ url: abs(`${animePath(a)}/next-season`), lastModified: weekly, changeFrequency: "weekly", priority: 0.7 });
      // Same test as the page, which noindexes itself without a trustworthy runtime (AniList can rescue some later).
      // Airing shows count aired episodes only, so they need a known next episode past the first.
      const aired = a.status === "current" ? Math.max(0, (upcomingOf(snap.byKitsu.get(a.id))[0]?.episode ?? 1) - 1) : a.episodeCount || 0;
      const timed = a.subtype === "movie" ? runtimeMinutes(a) > 0 : episodeMinutes(a) > 0 && aired > 0;
      if (released && timed && howLongIndexed(`${animePath(a)}/how-long-to-watch`, a.userCount)) out.push({ url: abs(`${animePath(a)}/how-long-to-watch`), lastModified: a.status === "current" ? now : at(D.anilist), changeFrequency: "monthly", priority: 0.6 });
      if (a.subtype !== "movie" && a.status === "current") out.push({ url: abs(`${animePath(a)}/episodes`), lastModified: now, changeFrequency: "daily", priority: 0.5 });
      if (n > 50) continue;
      const al = alIds.get(a.id);
      if (al && hasSnapshotCast(al) && castIndexed(`${animePath(a)}/cast`)) out.push({ url: abs(`${animePath(a)}/cast`), lastModified: at(D.casts), changeFrequency: "monthly", priority: 0.5 });
      if (released && hasSnapshotThemes(a.id)) out.push({ url: abs(`${animePath(a)}/openings-endings`), lastModified: at(D.themes), changeFrequency: "monthly", priority: 0.5 });
      // Same test as the page (which noindexes itself without a guide): AniList tags in the monthly snapshot. Shorts,
      // ads and music clips don't need a parents' guide.
      const story = (a.subtype === "TV" || a.subtype === "movie" || a.subtype === "ONA" || a.subtype === "OVA") && (a.episodeLength ?? 24) >= 10;
      if (story && al && (alAnime(al)?.t.length ?? 0) > 0) out.push({ url: abs(`${animePath(a)}/parents-guide`), lastModified: at(D.anilist), changeFrequency: "monthly", priority: 0.5 });
    }
    // "Anime like X" has the best click-through on the site: list it for the 500 most-followed titles (ranked in
    // the alias index, so no extra API calls).
    // Plus every title whose page is strong: 8+ fan picks, 5+ with shared themes (lib/picks.ts, the page's own test).
    const strongSimilar = await kitsuByAniListIds(strongSimilarIds()).catch(() => new Map<number, { slug: string }>());
    for (const s of new Set([...similarSlugs(), ...[...strongSimilar.values()].map((a) => a.slug)])) out.push({ url: abs(`/similar/${s}`), lastModified: at(D.anilist, D.aliases), changeFrequency: "monthly", priority: 0.5 });
    // Most-followed voice actors only (the hub's own cached request).
    for (const [i, v] of (await popularVoiceActors()).entries()) if (voiceActorIndexed(vaPath(v), i)) out.push({ url: abs(vaPath(v)), lastModified: at(D.voiceActors, D.vaNotes), changeFrequency: "monthly", priority: 0.4 });
  } catch {
    /* upstream hiccup: ship the static part of the sitemap */
  }
  // One entry per URL (several sources list the same page, e.g. /similar/… for top anime), first one wins.
  const seen = new Set<string>();
  return out.filter((e) => !seen.has(e.url) && Boolean(seen.add(e.url)));
}
