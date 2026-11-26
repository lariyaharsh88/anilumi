import { GHIBLI_CHECKED } from "@/lib/ghibli";
import { DONGHUA_CHECKED, ORDERS_CHECKED, donghuaOrders, orderPath } from "@/lib/donghua";
import type { MetadataRoute } from "next";
import { CC_CHECKED } from "@/lib/comiccon";
import { TERMS, TERMS_CHECKED, termPath, termsPath } from "@/lib/animeterms";
import { posterUrl } from "@/lib/kitsu";
import { alAnime } from "@/lib/alsnap";
import { abs } from "@/lib/site";
import { WATCH_ORDER_OVERRIDES } from "@/data/watch-orders";
import { listAnime, getCategories, getAniListId, seasonOf, shiftSeason, animePath, TREND_GENRES, MAIN_GENRES } from "@/lib/kitsu";
import { popularVoiceActors, vaPath } from "@/lib/anilist";
import { allDays, birthdaysOn, bdPath, monthPath } from "@/lib/birthdays";
import { fillerSlugs, continuationSlugs } from "@/lib/filler";
import { characterTableSlugs, BLOOD_TYPES } from "@/lib/charsnap";
import { CHARACTER_VS, vsPath } from "@/lib/charvs";
import { hindiArtists, hindiArtistPath } from "@/lib/hindivoices";
import { summaryFor } from "@/lib/summaries";
import { sequelNews, sequelNewsSlugs } from "@/lib/sequelnews";
import { QUIZZES } from "@/lib/charquiz";
import { GUESS_MODES } from "@/lib/guessgame";
import { triviaShows, triviaPath } from "@/lib/trivia";
import { officialRatings } from "@/lib/ageratings";
import { hasSnapshotThemes } from "@/lib/themes";
import { HINDI_SLUGS, hindiPath, hindiIndexed } from "@/lib/hindi";
import { LANG, dubbedIn, regionalPath, topRegional } from "@/lib/regionaldub";
import { dubEvents } from "@/lib/dubupdates";
import { allStreams, streamsPath } from "@/lib/streams";
import { filmFranchises, filmsPath, hasLang, FILMS_CHECKED, type FilmLang } from "@/lib/franchisefilms";
import { HINDI_PLATFORMS, dubsOn, hindiDubbed, hindiDubPath } from "@/lib/hindidub";
import { KIDS_TV_CHECKED, KIDS_TV_PATH, kidsChannel } from "@/lib/kidstv";
import { PRICES_CHECKED } from "@/lib/platformprices";
import { indexedSimilar } from "@/lib/similarhub";
import funimation from "@/data/funimation.json";
import christmas from "@/data/christmas-anime.json";
import { GEMS_UPDATED } from "@/lib/underrated";
import { STRONGEST_CHECKED, rankingSlugs, strongestPath } from "@/lib/strongest";
import { POWERS_CHECKED, powersSlugs, powersPath } from "@/lib/powers";
import { CLASSIC_CHECKED, DIRECTORS, directorPath, type DirectorSlug } from "@/lib/classicfilms";
import { RELEASE_DATE, inRelease } from "@/lib/release";
import { indiaGuide } from "@/lib/indiaguide";
import crunchyrollPlans from "@/data/crunchyroll-plans.json";
import opMc from "@/data/op-mc-anime.json";
import opBounties from "@/data/one-piece-bounties.json";
import { searchShown, searchShownPaths, animeIndexed, ownContentSlugs, watchOrderIndexed, characterTableIndexed, notedCharacters, demandCharacters, indexedCharacterSlugs, genreIndexed, bestYearIndexed, trendIndexed, voiceActorIndexed, hindiDubIndexed, SEARCHED_COMPARES, SEARCHED_CHARACTER_TABLES, SEARCHED_ANIME, INDEXED_STUDIOS } from "@/lib/indexing";
import franchiseData from "@/data/franchises.json";
import { DATA_DATES as D, STATIC_UPDATED, BIRTHDAY_PAGES_UPDATED, HINDI_HUB_UPDATED, SCENE_PAGE_UPDATED, DUB_GUIDES_ADDED, latest, weekStart, monthStart } from "@/lib/lastmod";
import { FILLER } from "@/data/filler";

const FUNIMATION_CHECKED = (funimation as { checked: string }).checked;
const CRUNCHYROLL_CHECKED = (crunchyrollPlans as { checked: string }).checked;
const OPMC_CHECKED = (opMc as { checked: string }).checked;
const BOUNTY_RANK_CHECKED = (opBounties as { checked: string }).checked;

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
    { url: abs("/trends"), lastModified: weekly, changeFrequency: "weekly", priority: 0.7 },
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
    { url: abs("/anime-trailers"), lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: abs("/filler-lists"), lastModified: at(D.watchOrders), changeFrequency: "monthly", priority: 0.7 },
    ...fillerSlugs().map((slug) => ({ url: abs(`${animePath({ slug })}/filler-list`), lastModified: at(FILLER[slug]?.reviewedOn, D.arcs), changeFrequency: "monthly" as const, priority: 0.7 })),
    { url: abs("/anime-to-manga"), lastModified: at(D.manga), changeFrequency: "monthly", priority: 0.7 },
    ...continuationSlugs().map((slug) => ({ url: abs(`${animePath({ slug })}/manga`), lastModified: at(D.manga), changeFrequency: "monthly" as const, priority: 0.6 })),
    { url: abs("/voice-actors"), lastModified: at(D.voiceActors), changeFrequency: "weekly", priority: 0.6 },
    { url: abs("/characters"), lastModified: at(D.characters), changeFrequency: "monthly", priority: 0.7 },
    ...CHARACTER_VS.map((v) => ({ url: abs(vsPath(v)), lastModified: at(D.characters, D.charNotes), changeFrequency: "monthly" as const, priority: 0.5 })),
    { url: abs("/best-anime"), lastModified: at(D.anilist), changeFrequency: "monthly", priority: 0.8 },
    { url: abs("/best-anime-for-beginners"), lastModified: at(D.anilist), changeFrequency: "monthly", priority: 0.7 },
    { url: abs("/similar"), lastModified: at(D.anilist, D.aliases), changeFrequency: "monthly", priority: 0.6 },
    { url: abs("/characters/blood-type"), lastModified: at(D.characters), changeFrequency: "monthly", priority: 0.5 },
    ...BLOOD_TYPES.map((t) => ({ url: abs(`/characters/blood-type/${t}`), lastModified: at(D.characters), changeFrequency: "monthly" as const, priority: 0.5 })),
    { url: abs("/hi"), lastModified: weekly, changeFrequency: "weekly", priority: 0.6 },
    { url: abs("/hindi-dub"), lastModified: at(D.dubs, HINDI_HUB_UPDATED), changeFrequency: "monthly", priority: 0.7 },
    { url: abs("/hi/hindi-dub"), lastModified: at(D.dubs, HINDI_HUB_UPDATED), changeFrequency: "monthly", priority: 0.6 },
    // Changes as dubs are added or start streaming: dated by the latest event (lib/dubupdates.ts).
    { url: abs("/new-dubs"), lastModified: at(dubEvents()[0]?.date), changeFrequency: "weekly", priority: 0.7 },
    ...(["ta", "te"] as const).filter((l) => dubbedIn(l).length >= 5).map((l) => ({ url: abs(LANG[l].path), lastModified: at(D.regionalDubs, DUB_GUIDES_ADDED), changeFrequency: "monthly" as const, priority: 0.7 })),
    ...HINDI_PLATFORMS.filter((p) => dubsOn(p).length || kidsChannel(p.slug)?.page).map((p) => ({ url: abs(`/hindi-dub/${p.slug}`), lastModified: at(D.dubs, HINDI_HUB_UPDATED, kidsChannel(p.slug)?.page ? KIDS_TV_CHECKED : null), changeFrequency: "monthly" as const, priority: 0.6 })),
    // Kids' TV channels that air anime in Hindi (lib/kidstv.ts); the channel pages are the platform pages above.
    { url: abs(KIDS_TV_PATH), lastModified: at(KIDS_TV_CHECKED), changeFrequency: "monthly", priority: 0.7 },
    // Per-anime Hindi dub pages: the most-watched dubs (lib/indexing.ts hindiDubIndexed).
    ...hindiDubbed().filter((d) => hindiDubIndexed(d.s)).map((d) => ({ url: abs(hindiDubPath(d.s)), lastModified: at(D.dubs, d.checked), changeFrequency: "weekly" as const, priority: 0.7 })),
    ...(["ta", "te"] as const).flatMap((l) => dubbedIn(l).filter((d) => topRegional(d.s, l)).map((d) => ({ url: abs(regionalPath(d.s, l)), lastModified: at(D.regionalDubs, d.checked), changeFrequency: "monthly" as const, priority: 0.6 }))),
    { url: abs("/hindi-dub/this-week"), lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: abs("/schedule/crunchyroll"), lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: abs("/hindi-dub/movies"), lastModified: at(D.dubs), changeFrequency: "weekly", priority: 0.7 },
    { url: abs("/hindi-dub/best"), lastModified: at(D.dubs), changeFrequency: "weekly", priority: 0.7 },
    ...filmFranchises().flatMap((f) => ((["hi", "ta", "te"] as FilmLang[]).filter((l) => hasLang(f, l)).map((l) => ({ url: abs(filmsPath(f.slug, l)), lastModified: at(FILMS_CHECKED), changeFrequency: "monthly" as const, priority: 0.7 })))),
    { url: abs("/anime-on-netflix-india"), lastModified: at(D.streams), changeFrequency: "monthly", priority: 0.6 },
    { url: abs("/anime-streaming-sites"), lastModified: at(D.streams, D.dubs, PRICES_CHECKED), changeFrequency: "monthly", priority: 0.8 },
    { url: abs("/studio-ghibli"), lastModified: at(GHIBLI_CHECKED), changeFrequency: "monthly", priority: 0.8 },
    { url: abs("/donghua"), lastModified: at(DONGHUA_CHECKED), changeFrequency: "weekly", priority: 0.8 },
    ...donghuaOrders().map((o) => ({ url: abs(orderPath(o.slug)), lastModified: at(ORDERS_CHECKED), changeFrequency: "weekly" as const, priority: 0.7 })),
    { url: abs("/hianime-alternatives"), lastModified: at(D.streams), changeFrequency: "monthly", priority: 0.7 },
    { url: abs("/free-anime-websites"), lastModified: at(D.streams, D.dubs, PRICES_CHECKED), changeFrequency: "monthly", priority: 0.8 },
    { url: abs("/where-to-watch"), lastModified: at(D.streams), changeFrequency: "monthly", priority: 0.8 },
    ...allStreams().map((e) => ({ url: abs(streamsPath(e.s)), lastModified: at(D.streams), changeFrequency: "monthly" as const, priority: 0.7 })),
    { url: abs("/dub-schedule"), lastModified: now, changeFrequency: "daily", priority: 0.8 },
    { url: abs("/sub-vs-dub"), lastModified: at(D.streams, D.dubSchedule, D.seasonDubs, DUB_GUIDES_ADDED), changeFrequency: "weekly", priority: 0.8 },
    { url: abs("/anime-salt-alternatives"), lastModified: at(D.dubs, HINDI_HUB_UPDATED, DUB_GUIDES_ADDED), changeFrequency: "monthly", priority: 0.7 },
    { url: abs("/download-anime-in-hindi"), lastModified: at(D.dubs, PRICES_CHECKED), changeFrequency: "monthly", priority: 0.7 },
    { url: abs("/crunchyroll-price-india"), lastModified: at(PRICES_CHECKED, D.dubs, D.regionalDubs), changeFrequency: "monthly", priority: 0.7 },
    ...powersSlugs().map((s) => ({ url: abs(powersPath(s)), lastModified: at(POWERS_CHECKED), changeFrequency: "monthly" as const, priority: 0.7 })),
    { url: abs("/classic-anime-movies"), lastModified: at(CLASSIC_CHECKED), changeFrequency: "monthly", priority: 0.7 },
    ...(Object.keys(DIRECTORS) as DirectorSlug[]).map((s) => ({ url: abs(directorPath(s)), lastModified: at(CLASSIC_CHECKED), changeFrequency: "monthly" as const, priority: 0.7 })),
    { url: abs("/one-piece-bounties"), lastModified: at(BOUNTY_RANK_CHECKED), changeFrequency: "weekly", priority: 0.7 },
    { url: abs("/strongest-anime-characters"), lastModified: at(STRONGEST_CHECKED), changeFrequency: "monthly", priority: 0.7 },
    ...rankingSlugs().map((s) => ({ url: abs(strongestPath(s)), lastModified: at(STRONGEST_CHECKED), changeFrequency: "monthly" as const, priority: 0.7 })),
    { url: abs("/overpowered-mc-anime"), lastModified: at(OPMC_CHECKED), changeFrequency: "monthly", priority: 0.7 },
    { url: abs("/underrated-anime"), lastModified: at(GEMS_UPDATED), changeFrequency: "monthly", priority: 0.7 },
    { url: abs("/crunchyroll-price"), lastModified: at(CRUNCHYROLL_CHECKED), changeFrequency: "weekly", priority: 0.7 },
    { url: abs("/funimation"), lastModified: at(FUNIMATION_CHECKED), changeFrequency: "yearly", priority: 0.6 },
    { url: abs("/christmas-anime"), lastModified: at(christmas.checked), changeFrequency: "weekly", priority: 0.6 },
    // The major studios (lib/indexing.ts INDEXED_STUDIOS): the only indexed studio pages.
    ...INDEXED_STUDIOS.map((st) => ({ url: abs(`/studio/${st}`), lastModified: weekly, changeFrequency: "weekly" as const, priority: 0.5 })),
    ...HINDI_SLUGS.filter(hindiIndexed).map((s) => ({ url: abs(hindiPath(s)), lastModified: at(D.watchOrders, D.dubs), changeFrequency: "weekly" as const, priority: 0.6, alternates: { languages: { en: abs(`/watch-order/${s}`), hi: abs(hindiPath(s)) } } })),
    { url: abs("/anime-openings"), lastModified: at(D.themes), changeFrequency: "weekly", priority: 0.6 },
    { url: abs("/tier-list"), lastModified: weekly, changeFrequency: "weekly", priority: 0.6 },
    { url: abs("/what-anime-is-this"), lastModified: at(SCENE_PAGE_UPDATED), changeFrequency: "monthly", priority: 0.8 },
    { url: abs("/news"), lastModified: now, changeFrequency: "hourly", priority: 0.8 },
    { url: abs("/comic-con-india"), lastModified: at(CC_CHECKED), changeFrequency: "weekly", priority: 0.7 },
    { url: abs("/quiz"), lastModified: at(), changeFrequency: "monthly", priority: 0.6 },
    { url: abs("/japanese-name-generator"), lastModified: at(), changeFrequency: "yearly", priority: 0.5 },
    { url: abs("/anime-name-generator"), lastModified: at(), changeFrequency: "yearly", priority: 0.5 },
    ...[termsPath, ...TERMS.map((t) => termPath(t.slug))].map((p) => ({ url: abs(p), lastModified: at(TERMS_CHECKED), changeFrequency: "monthly" as const, priority: 0.6 })),
    ...GUESS_MODES.map((m) => ({ url: abs(m.path), lastModified: now, changeFrequency: "daily" as const, priority: 0.6 })),
    ...QUIZZES.map((q) => ({ url: abs(`/quiz/${q.slug}`), lastModified: at(), changeFrequency: "monthly" as const, priority: 0.6 })),
    ...["/anime-quiz", triviaPath("guess-the-anime"), ...triviaShows().map((s) => triviaPath(s.slug))].map((p) => ({ url: abs(p), lastModified: at(), changeFrequency: "monthly" as const, priority: 0.6 })),
    { url: abs("/random-anime-generator"), lastModified: at(D.anilist), changeFrequency: "monthly", priority: 0.6 },
    { url: abs("/what-anime-should-i-watch"), lastModified: at(D.anilist), changeFrequency: "monthly", priority: 0.6 },
    { url: abs("/birthdays"), lastModified: now, changeFrequency: "daily", priority: 0.7 },
    { url: abs("/anime-birthday-twin"), lastModified: at(D.birthdays, D.charLines), changeFrequency: "monthly", priority: 0.6 },
    // Hindi voice artists: listed once researched (the hub 404s while the data file is empty).
    ...(hindiArtists().length ? [{ url: abs("/hindi-voice-artists"), lastModified: at(D.hindiVoices), changeFrequency: "monthly" as const, priority: 0.6 }, ...hindiArtists().map((a) => ({ url: abs(hindiArtistPath(a)), lastModified: at(D.hindiVoices), changeFrequency: "monthly" as const, priority: 0.5 }))] : []),
    ...Array.from({ length: 12 }, (_, i) => ({ url: abs(monthPath(i + 1)), lastModified: at(D.birthdays, D.charLines, BIRTHDAY_PAGES_UPDATED), changeFrequency: "monthly" as const, priority: 0.6 })),
    { url: abs("/on-this-day"), lastModified: now, changeFrequency: "daily", priority: 0.7 },
    // Only indexed character pages (lib/indexing.ts): those with verified notes plus any Google already shows.
    ...indexedCharacterSlugs()
      .map((s, i) => ({ url: abs(`/character/${s}`), lastModified: at(D.characters, D.charNotes), changeFrequency: "monthly" as const, priority: i < 100 ? 0.6 : 0.4 })),
    ...[...new Set([...characterTableSlugs(), ...Object.keys(SEARCHED_CHARACTER_TABLES)])].filter(characterTableIndexed).map((s) => ({ url: abs(`/anime/${s}/characters`), lastModified: at(D.seriesCharacters), changeFrequency: "monthly" as const, priority: 0.5 })),
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
    // The India guide, once its research says enough about enough shows (lib/indiaguide.ts).
    if (d >= 0) {
      const g = await indiaGuide(x.year, x.season).catch(() => null);
      if (g?.indexed) out.push({ url: abs(`/season/${x.year}/${x.season}/india`), lastModified: at(g.research.checked), changeFrequency: "weekly", priority: 0.7 });
    }
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
    for (const p of SEARCHED_COMPARES) out.push({ url: abs(p), lastModified: at(D.anilist), changeFrequency: "monthly", priority: 0.5 });
    // Episode pages aren't listed: robots.txt keeps crawlers off them (scrapers walked every episode, Nov 2026).
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
      // Researched sequel news (data/sequel-news.json): the page always indexes these (lib/indexing.ts nextSeasonIndexed).
      if (series && released && sequelNews(a.slug)) out.push({ url: abs(`${animePath(a)}/next-season`), lastModified: weekly, changeFrequency: "weekly", priority: 0.7 });
      if (n > 50) continue;
      const al = alIds.get(a.id);
      if (released && hasSnapshotThemes(a.id) && searchShown(`${animePath(a)}/openings-endings`)) out.push({ url: abs(`${animePath(a)}/openings-endings`), lastModified: at(D.themes), changeFrequency: "monthly", priority: 0.5 });
      // Same test as the page: a tag-built guide plus an official rating (lib/indexing.ts parentsGuideIndexed).
      if (al && (alAnime(al)?.t.length ?? 0) > 0 && officialRatings(a.slug)) out.push({ url: abs(`${animePath(a)}/parents-guide`), lastModified: at(D.anilist), changeFrequency: "monthly", priority: 0.5 });
    }
    // Every other anime page that indexes itself (lib/indexing.ts animeIndexed), so none is missing from the sitemap
    // (Bing flagged airing, announced and researched titles outside the top 200, Nov 2026): airing shows ranked 61-200
    // (filtered by the members floor), every announced one with a following (Kitsu lists ~100) and every title with our own research (local data).
    // Unrated like /top/airing and /top/upcoming: new shows often have no age rating yet (listAnime still drops adult ones).
    const more = await Promise.all([
      ...[60, 80, 100, 120, 140, 160, 180].map((offset) => listAnime({ filter: { status: "current" }, sort: "-userCount", limit: 20, offset, revalidate: 86400, unrated: true })),
      ...[0, 20, 40, 60, 80, 100].map((offset) => listAnime({ filter: { status: "upcoming" }, sort: "-userCount", limit: 20, offset, revalidate: 86400, unrated: true })),
    ]);
    for (const a of more.flatMap((p) => p.items)) if (animeIndexed(a, false)) out.push({ url: abs(animePath(a)), lastModified: now, changeFrequency: "daily", priority: 0.5 });
    for (const s of ownContentSlugs()) out.push({ url: abs(animePath({ slug: s })), lastModified: at(D.streams, D.dubs), changeFrequency: "weekly", priority: 0.5 });
    for (const s of SEARCHED_ANIME) out.push({ url: abs(animePath({ slug: s })), lastModified: at(D.anilist), changeFrequency: "weekly", priority: 0.5 });
    // Anime pages Google already shows outside the top 200 (Bing flagged them as missing, Nov 2026). The page
    // indexes itself on the same test (lib/indexing.ts animeIndexed), so this lists nothing that is noindexed.
    for (const p of searchShownPaths("/anime/")) if (/^\/anime\/[^/]+$/.test(p)) out.push({ url: abs(p), lastModified: at(D.anilist), changeFrequency: "weekly", priority: 0.5 });
    // Every show with researched sequel news has an indexed next-season page (lib/indexing.ts nextSeasonIndexed),
    // including those outside the top 100 above ("highschool dxd season 5" 3.6K a month, Nov 2026).
    for (const s of sequelNewsSlugs()) out.push({ url: abs(`${animePath({ slug: s })}/next-season`), lastModified: weekly, changeFrequency: "weekly", priority: 0.6 });
    // "Anime like X" has the best click-through on the site: list it for the 500 most-followed titles (ranked in
    // the alias index, so no extra API calls).
    // Plus every title whose page is strong: 8+ fan picks, 5+ with shared themes (lib/picks.ts, the page's own test).
    for (const { slug: s } of await indexedSimilar()) out.push({ url: abs(`/similar/${s}`), lastModified: at(D.anilist, D.aliases), changeFrequency: "monthly", priority: 0.5 });
    // Most-followed voice actors only (the hub's own cached request).
    for (const [i, v] of (await popularVoiceActors()).entries()) if (voiceActorIndexed(vaPath(v), i)) out.push({ url: abs(vaPath(v)), lastModified: at(D.voiceActors, D.vaNotes), changeFrequency: "monthly", priority: 0.4 });
  } catch {
    /* upstream hiccup: ship the static part of the sitemap */
  }
  // One entry per URL (several sources list the same page, e.g. /similar/… for top anime), first one wins. Pages the
  // current release changed (lib/release.ts) carry its date, so the IndexNow job sends them after the deploy.
  const seen = new Set<string>();
  const releaseDay = latest(now, RELEASE_DATE);
  return out.filter((e) => !seen.has(e.url) && Boolean(seen.add(e.url)))
    .map((e) => (inRelease(new URL(e.url).pathname) && (!e.lastModified || new Date(e.lastModified) < releaseDay) ? { ...e, lastModified: releaseDay } : e));
}
