import type { Metadata } from "next";
import { animeIndexed, robotsFor } from "@/lib/indexing";
import { WATCH_ORDER_OVERRIDES } from "@/data/watch-orders";
import { fitTitle, fitDescription } from "@/lib/titles";
import { workType, workId, isoDuration } from "@/lib/ld";
import Link from "@/components/Link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { publicGenres, getAnimeBySlug, getCharacters, getEpisodes, getEpisodesAt, listAnime, getRelations, getLastAiredBest, getProductions, buildWatchOrder, type LastAired, type WatchOrder, comparePath, franchiseRoot, airingNotice, episodePath, posterUrl, fmtDate, statusLabel, subtypeLabel, animePath, weekdayOf, runtimeMinutes, fmtMinutes, isFuture, Anime, airedOnly, type AiringNotice } from "@/lib/kitsu";
import { abs } from "@/lib/site";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import Faq, { FaqItem } from "@/components/Faq";
import AnimeRail from "@/components/AnimeRail";
import AdSlot from "@/components/AdSlot";
import BingePlanner from "@/components/BingePlanner";
import Countdown from "@/components/Countdown";
import WatchButton from "@/components/WatchButton";
import EmbedSnippet from "@/components/EmbedSnippet";
import CalendarLinks from "@/components/CalendarLinks";
import WhereToWatch from "@/components/WhereToWatch";
import EditorWatched from "@/components/EditorWatched";
import { streamsFor, streamsPath, servicesIn } from "@/lib/streams";
import { verdictLines } from "@/lib/verdict";
import { themesOf } from "@/lib/picks";
import WatchOrderCard from "@/components/WatchOrderCard";
import { snapshotOrder } from "@/lib/wosnap";
import PushButton from "@/components/PushButton";
import HindiDub from "@/components/HindiDub";
import { dubFor, dubFaq } from "@/lib/hindidub";
import { animeTopic } from "@/lib/push";
import SpoilerGate from "@/components/SpoilerGate";
import StoryGuide from "@/components/StoryGuide";
import EditorNote from "@/components/EditorNote";
import QuickAnswers, { type Answer } from "@/components/QuickAnswers";
import { characterTable } from "@/lib/charsnap";
import { ageLabel } from "@/lib/insights";
import { noteFor } from "@/data/notes";
import RatingWidget from "@/components/RatingWidget";
import HypeButton from "@/components/HypeButton";
import LeadForm from "@/components/LeadForm";
import { dbEnabled, ratingStats } from "@/lib/db";
import { summarize, aggregateRating } from "@/lib/community";
import { fillerFor, continuationFor } from "@/lib/filler";
import ViewerBehaviour from "@/components/ViewerBehaviour";
import AiringNoticeBanner from "@/components/AiringNoticeBanner";
import ParentsGuideSection from "@/components/ParentsGuide";
import { getAniListInsight, dropStats, genreDropBenchmark, parentsGuide, type ParentsGuide } from "@/lib/insights";
import YouTubeFacade from "@/components/YouTubeFacade";
import StatTiles from "@/components/viz/StatTiles";
import BarChart from "@/components/viz/BarChart";
import AmazonLink from "@/components/AmazonLink";
import AffiliateNote from "@/components/AffiliateNote";
import MerchBlock from "@/components/MerchBlock";
import LocalTime from "@/components/LocalTime";
import Backdrop from "@/components/fx/Backdrop";
import ScoreRing from "@/components/fx/ScoreRing";
import ScoreCard from "@/components/ScoreCard";
import FanRecs from "@/components/FanRecs";
import NewsList from "@/components/NewsList";
import { getNews, newsAbout } from "@/lib/news";
import { getFanRecommendations, getKeyStaff, personPath, getAniListSequel } from "@/lib/anilist";
import { sequelVerdict, type SequelLike, type SequelKind } from "@/lib/sequel";
import { combineScores, kitsuScore, aniListScore, getMalScore } from "@/lib/scores";
import SectionNav, { type NavSection } from "@/components/fx/SectionNav";
import MobileFold from "@/components/fx/MobileFold";
import Refreshed from "@/components/Refreshed";
import { airing } from "@/lib/airing";
import { adaptationFor, adaptedRange, continueAt, ADAPT_CHECKED, ADAPT_REVIEWED } from "@/lib/mangaseasons";
import { volumeFor, volumeLine } from "@/lib/mangavolumes";
import { summaryFor, SUMMARIES_REVIEWED } from "@/lib/summaries";
import ArcList from "@/components/ArcList";
import { arcsFor, arcSources, arcSummary, ARCS_CHECKED, ARCS_REVIEWED } from "@/lib/arcs";
import ClampText from "@/components/fx/ClampText";
import NavIcon, { type IconName } from "@/components/NavIcon";
import StickyActions from "@/components/fx/StickyActions";
import TiltCard from "@/components/fx/TiltCard";
import RailScroller from "@/components/fx/RailScroller";
import { excerpt } from "@/lib/excerpt";

export const revalidate = 86400;

/** The "Season 2?" answer in a few words, for At a glance. */
const SEQUEL_SHORT: Record<SequelKind, (n: SequelLike | null) => string> = {
  out: (n) => `Yes, out since ${n?.startDate?.slice(0, 4) || "release"}`,
  airing: () => "Yes, airing now",
  dated: (n) => `Confirmed for ${n?.startDate ? fmtDate(n.startDate, { month: "short", day: "numeric", year: "numeric" }) : "a set date"}`,
  announced: (n) => `Confirmed${n?.expected ? ` for ${n.expected}` : ""}, date TBA`,
  "still-airing": () => "Still airing",
  none: () => "Not announced yet",
};
export const dynamicParams = true;

// Rendered on first request, then cached (ISR). Pre-building trending titles at deploy time made every
// build depend on Kitsu and AniList being up: one upstream hiccup failed the whole deploy.
export async function generateStaticParams() { return []; }

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = await getAnimeBySlug(decodeURIComponent(slug));
  if (!a) notFound();
  const year = a.startDate?.slice(0, 4);
  const live = a.status === "current" || a.status === "upcoming";
  const title = fitTitle(live
    ? [`${a.title}${year ? ` (${year})` : ""} – Episodes, Release Date & Where to Watch`, `${a.title} – Release Date, Episodes & Where to Watch`, `${a.title} – Next Episode & Where to Watch`, `${a.title} – Release Date`, a.title]
    : [`${a.title}${year ? ` (${year})` : ""} – Episodes & Where to Watch`, `${a.title} – Episodes & Where to Watch`, `${a.title} – Where to Watch`, a.title]);
  // Our own summary where there is one, not Kitsu's synopsis (lib/summaries.ts).
  const blurb = summaryFor(a.slug)?.summary ?? a.synopsis;
  const description = fitDescription(`${a.title}: ${a.episodeCount ? `${a.episodeCount} episodes` : subtypeLabel(a.subtype)}, ${statusLabel(a.status).toLowerCase()}${a.rating ? `, rated ${(a.rating / 10).toFixed(1)}/10` : ""}. ${blurb.slice(0, 120).replace(/\s+\S*$/, "")}…`);
  return {
    title,
    description,
    alternates: { canonical: animePath(a) },
    robots: robotsFor(animeIndexed(a, Boolean(summaryFor(a.slug) || streamsFor(a) || dubFor(a) || WATCH_ORDER_OVERRIDES[a.slug]))),
    openGraph: { title, description, type: "video.tv_show" },
    twitter: { card: "summary_large_image", title, description },
  };
}

function buildFaq(a: Anime, extra: FaqItem[] = [], ep: { planned: number | null; aired: number | null } = { planned: null, aired: null }, notice: AiringNotice | null = null): FaqItem[] {
  const items: FaqItem[] = [];
  // Japan time throughout: a late-night slot (00:56 JST) falls on the previous day in UTC.
  const next = a.nextRelease ? fmtDate(a.nextRelease, { weekday: "long", month: "long", day: "numeric", year: "numeric", timeZone: "Asia/Tokyo" }) : null;
  if (a.status === "current") {
    // On a break, the far-off date is a listing (AniList's schedule), which can move, not a confirmed broadcast.
    const answer = !next ? `${a.title} is currently airing. Check the episode list for the latest air dates.`
      : notice?.onBreak ? `${a.title} is on a break. ${notice.source === "AniList" ? "AniList's schedule" : "Kitsu"} lists the next episode for ${next} (Japan time), about ${Math.round((notice.breakDays ?? 0) / 7)} weeks away. Dates this far ahead can change until the broadcaster confirms them.`
      : `The next episode of ${a.title} is scheduled for ${next} (Japan time). New episodes air weekly on ${weekdayOf(a.nextRelease)}s.`;
    items.push({ q: `When does the next episode of ${a.title} come out?`, a: answer });
  }
  if (a.status === "upcoming") {
    items.push({ q: `When does ${a.title} release?`, a: a.startDate ? `${a.title} is scheduled to premiere on ${fmtDate(a.startDate, { month: "long", day: "numeric", year: "numeric" })}.` : `${a.title} is announced but does not have a confirmed release date yet.` });
  }
  items.push({ q: `How many episodes does ${a.title} have?`, a: a.episodeCount && !(a.status === "current" && ep.aired) ? `${a.title} has ${a.episodeCount} episode${a.episodeCount === 1 ? "" : "s"}${a.episodeLength ? `, each around ${a.episodeLength} minutes` : ""}.` : a.status === "current" && ep.planned ? `${a.title} is planned for ${ep.planned} episodes${ep.aired ? `; ${ep.aired} ${ep.aired === 1 ? "has" : "have"} aired, so ${Math.max(0, ep.planned - ep.aired)} ${ep.planned - ep.aired === 1 ? "is" : "are"} left` : ""}.` : a.status === "current" ? `${a.title} is still airing and the final episode count has not been announced.` : `The episode count for ${a.title} has not been published yet.` });
  if (a.streaming.length) {
    items.push({ q: `Where can I watch ${a.title}?`, a: `${a.title} is available to stream on ${a.streaming.map((s) => s.site).join(", ")}. Availability varies by region.` });
  }
  items.push({ q: `Is ${a.title} finished?`, a: a.status === "finished" ? `Yes. ${a.title} finished airing${a.endDate ? ` on ${fmtDate(a.endDate)}` : ""}.` : a.status === "current" ? `No, ${a.title} is currently airing.` : `${a.title} has not started airing yet.` });
  items.push(...extra);
  return items.slice(0, 8);
}

const released0 = (a: Anime) => a.status === "current" || a.status === "finished";

export default async function AnimePage({ params }: Props) {
  const { slug } = await params;
  const a = await getAnimeBySlug(decodeURIComponent(slug));
  if (!a) notFound();

  const mainGenre = publicGenres(a.categories)[0];
  const [characters, episodes, related, relations, latestInfo, productions, insight, malScore, fanRecs, allNews, keyStaff] = await Promise.all([
    getCharacters(a.id, 12),
    a.subtype === "movie" ? Promise.resolve({ items: [], total: 0, limit: 0, offset: 0 }) : getEpisodes(a.id, 1, 6),
    mainGenre ? listAnime({ filter: { categories: mainGenre.slug }, sort: "-userCount", limit: 13 }) : Promise.resolve({ items: [], total: 0, limit: 0, offset: 0 }),
    getRelations(a.id),
    a.status === "current" ? getLastAiredBest(a.id) : Promise.resolve({ count: 0, lastAired: 0, lastAiredDate: null, reliable: false } as LastAired),
    getProductions(a.id),
    getAniListInsight(a.id),
    getMalScore(a.id),
    getFanRecommendations(a.id, 12),
    getNews(),
    getKeyStaff(a.id),
  ]);
  const news = newsAbout(allNews, [a.title, a.titleEn]).slice(0, 4);
  const combined = combineScores([kitsuScore(a), aniListScore(insight), malScore]);
  const multi = combined && combined.sources.length > 1 ? combined : null;
  const relatedItems = related.items.filter((r) => r.id !== a.id).slice(0, 12);
  const franchise = relations.filter((r) => ["sequel", "prequel", "side_story", "spinoff", "summary", "alternative_version", "other", "character"].includes(r.role));
  // Full order for the "Watch order" card. The live walk needs one Kitsu call per season (~10 s for a long
  // franchise), so it gets 1.5 s; past that the card uses the monthly snapshot of the same order (lib/wosnap.ts)
  // rather than shrinking to the direct prequel/sequel, which then stayed cached.
  const order = relations.some((r) => r.role === "prequel" || r.role === "sequel")
    ? (await Promise.race([
        buildWatchOrder(a, (id) => (id === a.id ? Promise.resolve(relations) : getRelations(id))).catch(() => null),
        new Promise<WatchOrder | null>((r) => setTimeout(() => r(null), 1500)),
      ])) ?? snapshotOrder(a.id)
    : null;
  // "Season 2?" on finished series: the next main entry in the order, else Kitsu's sequel link, else AniList
  // (same rule as the next-season page, which has the full answer).
  let sequel: (SequelLike & { href?: string }) | null = null;
  const askSequel = a.status === "finished" && (a.subtype === "TV" || a.subtype === "ONA");
  if (askSequel) {
    const chain = order?.entries.filter((e) => e.kind === "main").map((e) => e.anime) ?? [];
    const idx = chain.findIndex((x) => x.id === a.id);
    const pick = (idx >= 0 ? chain[idx + 1] : undefined) ?? relations.find((r) => r.role === "sequel")?.anime;
    // Snapshot orders (used when the live walk is slow) carry no status: take the full record from the relations,
    // else judge by the premiere date.
    const kNext = pick && !pick.status
      ? relations.find((r) => r.anime.id === pick.id)?.anime ?? { ...pick, status: pick.startDate && !isFuture(pick.startDate) ? "finished" : "upcoming" }
      : pick;
    const al = kNext ? null : await getAniListSequel(a.id).catch(() => null);
    sequel = kNext ? { ...kNext, href: animePath(kNext) } : al ? { title: al.title, status: al.status, startDate: al.startDate, endDate: null, expected: al.expected } : null;
  }
  const verdict = askSequel ? sequelVerdict(a, sequel) : null;
  const dist = a.ratingDist || null;
  const totalRatings = dist ? dist.reduce((n, v) => n + v, 0) : 0;
  const topShare = dist && totalRatings ? Math.round(((dist[8] + dist[9]) / totalRatings) * 100) : 0;
  const compactN = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}K` : String(n));
  const notice = a.status === "current" ? airingNotice(a.nextRelease, latestInfo.nextAt) : null;
  if (latestInfo.nextAt) a.nextRelease = latestInfo.nextAt; // AniList pair: number and time stay consistent
  const lastAired = latestInfo.lastAired;
  // An airing season's planned length: Kitsu's count, else AniList's (airing snapshot). Aired only when reliable.
  const planned = a.status === "current" ? a.episodeCount || (await airing()).byKitsu.get(a.id)?.e || null : null;
  const airedCount = a.status === "current" && latestInfo.reliable && lastAired > 0 ? lastAired : null;
  const runtime = runtimeMinutes(airedOnly(a, airedCount)); // aired episodes only, for a show still airing
  // Airing shows list their newest aired episodes first. Kitsu's total also counts placeholder records for
  // episodes that haven't aired (One Piece: 1,410 records, 1,180 aired), so the heading uses the aired count.
  // Only with a reliable count: when AniList is rate-limited the fallback is Kitsu's air dates, which stop at
  // One Piece episode 743; then the list starts at episode 1 and the heading shows no count.
  const airingList = a.status === "current" && lastAired > 0 && latestInfo.reliable;
  const latestEps = airingList
    ? (lastAired > episodes.items.length ? (await getEpisodesAt(a.id, Math.max(0, lastAired - 6), 6)).items : episodes.items)
        .filter((e) => e.number !== null && e.number <= lastAired)
        .reverse()
    : [];
  const epList = latestEps.length ? latestEps : episodes.items;
  const epCount = airingList ? lastAired : a.status === "current" ? 0 : a.episodeCount || episodes.total;
  const studios = productions.filter((p) => p.role === "studio");
  const drop = insight ? dropStats(insight.dist) : null;
  const dropOk = drop && drop.started >= 200 ? drop : null;
  const benchGenre = insight?.genres.find((g) => g !== "Ecchi" && g !== "Hentai") ?? null;
  const bench = dropOk && benchGenre ? await genreDropBenchmark(benchGenre) : null;
  const guide: ParentsGuide | null = insight ? parentsGuide(insight.tags, insight.genres, a.ageRating) : null;
  const licensors = productions.filter((p) => p.role === "licensor");
  const nextN = a.status === "current" && a.nextRelease && latestInfo.reliable ? lastAired + 1 : null;
  const poster = posterUrl(a, "medium");
  const coverLarge = a.cover?.large || a.cover?.original || null;
  // Heavily blurred backdrop. Images are unoptimized on Workers, so Kitsu's "tiny" cover is ~120 KB and was the
  // page's LCP element; the tiny poster (~11 KB) blurs to the same colour wash.
  const cover = posterUrl(a, "tiny") || a.cover?.tiny || a.cover?.small || null;
  // One-line answers to each guide's question, linking to the full guide (depth + descriptive internal links).
  const base = animePath(a);
  const fillerInfo = a.subtype === "movie" ? null : fillerFor(a.slug, a.episodeCount ?? (lastAired || null));
  const cont = continuationFor(a.slug);
  const charRows = characterTable(a.slug);
  const charTall = charRows?.filter((r) => r.cm).sort((x, y) => y.cm! - x.cm!)[0] ?? null;
  const glance: Answer[] = [
    ...(runtime ? [{ q: "How long to watch", a: runtime >= 120 ? `About ${Math.round(runtime / 60)} hours${a.status === "current" ? " so far" : ""}` : `${runtime} minutes`, href: `${base}/how-long-to-watch` }] : []),
    ...(fillerInfo ? [{ q: "Filler episodes", a: `${fillerInfo.count} of ${fillerInfo.total} (${fillerInfo.share.toFixed(0)}%)`, href: `${base}/filler-list` }] : []),
    ...(guide ? [{ q: "Age rating", a: `${ageLabel(guide.suitable)}${a.ageRating ? ` · rated ${a.ageRating}` : ""}`, href: `${base}/parents-guide` }] : []),
    ...(franchise.length ? [{ q: "Watch order", a: "Every season, movie and OVA in order", href: `/watch-order/${a.slug}` }] : []),
    ...(cont ? [{ q: `Continue in the ${cont.medium}`, a: cont.chapter ? `From chapter ${cont.chapter}` : `From volume ${cont.volume}`, href: `${base}/manga` }] : []),
    { q: "Cast & voice actors", a: "Who voices who", href: `${base}/cast` },
    { q: `Anime like ${a.title}`, a: "20 shows to watch next", href: `/similar/${a.slug}` },
    ...(charRows ? [{ q: "Characters' ages & heights", a: charTall ? `Tallest: ${charTall.c.n}, ${charTall.cm} cm` : `${charRows.length} characters compared`, href: `${base}/characters` }] : []),
    ...(a.subtype !== "movie" && a.status === "finished" ? [{ q: "Season 2?", a: verdict ? SEQUEL_SHORT[verdict.kind](sequel) : "Status and release date", href: `${base}/next-season` }] : []),
  ];
  const faqExtra: FaqItem[] = [];
  const note = noteFor(a.slug);
  if (note?.start) faqExtra.push({ q: `Where should I start with ${a.title}?`, a: note.start });
  // Only questions people search for that this page answers best. "Kids?", "worth watching?", "what next?",
  // "how long?" and "do people finish?" each have their own page or section; repeating them as Q&A read as filler.
  // Source material this season adapts (data/manga-seasons.json): "Where does X end in the manga?"
  const adapt = adaptationFor(a.slug);
  const buyVol = volumeFor(a.slug, adapt);
  if (adapt) faqExtra.push({ q: `Where does ${a.title} end in the ${adapt.medium}?`, a: `${a.title} adapts ${adaptedRange(adapt)}.${continueAt(adapt) ? ` To read on from here in the ${adapt.medium}, start at ${continueAt(adapt)}.${buyVol && adapt.unit === "chapter" ? ` That's in volume ${buyVol.vol}.` : ""}` : ""}${adapt.notes ? ` ${adapt.notes}` : ""}` });
  const arcs = a.subtype === "movie" ? null : arcsFor(a.slug);
  if (arcs) faqExtra.push({ q: `What are the ${a.title} arcs in order?`, a: `${a.title} has ${arcs.length} story arcs: ${arcSummary(arcs)}.` });
  const dub = dubFor(a);
  const dubQ = dubFaq(dub, a.title);
  if (dubQ) faqExtra.push(dubQ);
  const faq = buildFaq(a, faqExtra, { planned, aired: airedCount }, notice);
  const year = a.startDate?.slice(0, 4);
  // When this render read Kitsu/AniList (pages re-render daily). Shown on every page; given to search engines as
  // dateModified only for airing and upcoming shows, whose details actually change from day to day.
  const refreshed = new Date().toISOString();
  // Researched per-country streaming (US, India, UK) for this franchise, when we have it.
  const streams = streamsFor(a);
  // "Should you watch it?" from the facts above: themes, scores, completion, length, audience, where, fan pairings.
  const verdict2 = released0(a) ? verdictLines({
    title: a.title,
    themes: insight ? themesOf(insight.tags) : [],
    score: combined ? { value: combined.score, sites: combined.sources.length } : null,
    finish: drop ? { rate: drop.completionRate, started: drop.started } : null,
    runtimeMin: runtime || null,
    episodes: a.subtype === "movie" ? null : epCount || null,
    movie: a.subtype === "movie",
    airing: a.status === "current",
    suits: guide?.suitable ?? null,
    // Streaming research is per franchise: shown for the series and films, not for OVAs and specials.
    watchOn: streams && ["TV", "movie", "ONA"].includes(a.subtype) ? [...new Set(servicesIn(streams, "US").filter((x) => x.kind !== "buy").map((x) => x.service))].slice(0, 3) : [],
    hindi: ["TV", "movie", "ONA"].includes(a.subtype) && dub?.status === "available",
    pairs: fanRecs.slice(0, 2).map((r) => r.title),
  }) : [];
  const changing = a.status === "current" || a.status === "upcoming";
  const community = dbEnabled();
  const released = a.status === "current" || a.status === "finished";
  // Read when the page (re)renders, i.e. at most daily: fresh enough for search engines; the widget shows live numbers.
  const fanRating = community && released ? aggregateRating(summarize(await ratingStats(a.id))) : undefined;

  const director = keyStaff.find((k) => k.role === "Director")?.people ?? [];
  const creator = keyStaff.find((k) => k.role === "Original creator")?.people ?? [];
  const music = keyStaff.find((k) => k.role === "Music")?.people ?? [];
  const person = (p: { id: number; name: string; voices: boolean }) => ({ "@type": "Person", name: p.name, url: abs(personPath(p)) });
  const isMovie = a.subtype === "movie";
  const ld = {
    "@context": "https://schema.org",
    "@type": workType(a),
    "@id": workId(a),
    name: a.title,
    alternateName: [a.titleEn, a.titleJp].filter(Boolean),
    url: abs(animePath(a)),
    mainEntityOfPage: abs(animePath(a)),
    image: posterUrl(a, "large") || undefined,
    description: excerpt(summaryFor(a.slug)?.summary ?? a.synopsis, 300) || undefined,
    genre: publicGenres(a.categories).map((c) => c.title),
    inLanguage: "ja",
    countryOfOrigin: { "@type": "Country", name: "Japan" },
    datePublished: a.startDate || undefined,
    // TVSeries is a CreativeWorkSeries: it runs from startDate to endDate.
    ...(isMovie ? { duration: a.episodeLength ? isoDuration(a.episodeLength) : undefined } : { startDate: a.startDate || undefined, endDate: a.status === "finished" ? a.endDate || undefined : undefined, numberOfEpisodes: a.episodeCount || undefined, timeRequired: runtime ? isoDuration(runtime) : undefined }),
    contentRating: a.ageRating || undefined,
    productionCompany: studios.length ? studios.map((p) => ({ "@type": "Organization", name: p.producer.name, url: abs(`/studio/${p.producer.slug}`) })) : undefined,
    director: director.length ? director.map(person) : undefined,
    creator: creator.length ? creator.map(person) : undefined,
    musicBy: music.length ? music.map(person) : undefined,
    character: characters.length ? characters.map((c) => ({ "@type": "Person", name: c.name, url: abs(`/character/${c.slug}`) })) : undefined,
    // Only AniLumi's own fan ratings, and only past RATING_SNIPPET_MIN votes: Google's review-snippet policy
    // requires ratings collected on this site, never scores aggregated from Kitsu/AniList/MAL.
    aggregateRating: fanRating,
    ...(changing ? { dateModified: refreshed } : {}),
    // Google needs an upload date; the premiere date stands in for it, so only once the show has started.
    trailer: a.youtubeVideoId && a.startDate && !isFuture(a.startDate) ? { "@type": "VideoObject", name: `${a.title} trailer`, embedUrl: `https://www.youtube.com/embed/${a.youtubeVideoId}`, thumbnailUrl: `https://img.youtube.com/vi/${a.youtubeVideoId}/hqdefault.jpg`, uploadDate: a.startDate || undefined, description: `Official trailer for ${a.title}` } : undefined,
  };

  const facts: [string, string | null][] = [
    ["Type", subtypeLabel(a.subtype)],
    ["Status", statusLabel(a.status)],
    ["Episodes", a.episodeCount ? String(a.episodeCount) : a.status === "current" ? "Ongoing" : "TBA"],
    ["Episode length", a.episodeLength ? `${a.episodeLength} min` : null],
    ["Total runtime", runtime ? fmtMinutes(runtime) : null],
    ["Aired", a.startDate ? `${fmtDate(a.startDate)}${a.endDate ? ` → ${fmtDate(a.endDate)}` : a.status === "current" ? " → present" : ""}` : "TBA"],
    ["Next episode", a.nextRelease ? fmtDate(a.nextRelease, { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Tokyo" }) + " JST" : null],
    ["Age rating", a.ageRating ? `${a.ageRating}${a.ageRatingGuide ? ` – ${a.ageRatingGuide}` : ""}` : null],
    ["Japanese title", a.titleJp],
    ["Popularity rank", a.popularityRank ? `#${a.popularityRank}` : null],
    ["Rating rank", a.ratingRank ? `#${a.ratingRank}` : null],
  ];

  const watchItem = { id: a.id, slug: a.slug, title: a.title, poster: posterUrl(a, "small"), status: a.status, nextRelease: a.nextRelease };
  const GENRES_SHOWN = 6;
  const hasStats = Boolean(a.rating || a.userCount > 0 || dropOk);
  const sections: NavSection[] = [
    { id: "overview", label: "Overview" },
    ...(epList.length ? [{ id: "episodes", label: "Episodes" }] : []),
    ...(characters.length ? [{ id: "characters", label: "Characters" }] : []),
    ...(hasStats ? [{ id: "stats", label: "Stats" }] : []),
    ...(guide ? [{ id: "guide", label: "Parents' guide" }] : []),
    { id: "plan", label: "Plan & track" },
    { id: "faq", label: "FAQ" },
  ];
  // Hero stat tiles: label, value and a short note, so each number says what it measures.
  const facts2: { k: string; v: string; sub?: string; icon: IconName }[] = [
    ...(a.ratingRank ? [{ v: "Score rank", k: `#${a.ratingRank.toLocaleString()}`, sub: "of all anime", icon: "top" as const }] : []),
    ...(a.popularityRank ? [{ v: "Popularity", k: `#${a.popularityRank.toLocaleString()}`, sub: "most followed", icon: "flame" as const }] : []),
    ...(a.status === "current" && planned && airedCount
      ? [{ v: "Episodes", k: `${airedCount} / ${planned}`, sub: planned > airedCount ? `${planned - airedCount} left` : "final one aired", icon: "play" as const }]
      : a.episodeCount
      ? [{ v: a.episodeCount === 1 ? "Episode" : "Episodes", k: String(a.episodeCount), sub: a.status === "current" ? "planned" : a.episodeLength ? `${a.episodeLength} min each` : undefined, icon: "play" as const }]
      : a.status === "current" ? [airedCount ? { v: "Episodes", k: String(airedCount), sub: "aired so far", icon: "play" as const } : { v: "Episodes", k: "Ongoing", sub: "still airing", icon: "play" as const }] : []),
    ...(runtime > 0 ? [{ v: "Binge time", k: fmtMinutes(runtime), sub: "start to finish", icon: "time" as const }] : []),
    ...(a.userCount ? [{ v: "Members", k: compactN(a.userCount), sub: "tracking it", icon: "characters" as const }] : []),
  ];

  return (
    <article>
      <JsonLd data={ld} />

      {/* ───────── Hero ───────── */}
      <header id="hero" className="relative isolate overflow-clip">
        <div className="absolute inset-0 -z-10" aria-hidden>
          {cover && (
            <div className="parallax-bg absolute inset-0">
              <Image src={cover} alt="" fill className="scale-110 object-cover opacity-40 blur-2xl" sizes="96px" quality={40} loading="eager" />
            </div>
          )}
          {coverLarge && <Backdrop src={coverLarge} className="opacity-[.42] [mask-image:linear-gradient(180deg,#000_55%,transparent)]" position="center 25%" />}
          <div className="aurora opacity-50"><span /></div>
          <div className="absolute inset-0 veil-down" />
          <div className="absolute inset-0 veil-side max-lg:hidden" />
        </div>

        <div className="container-x pb-8 pt-6 max-md:grid max-md:grid-cols-[6.5rem_1fr] max-md:items-center max-md:gap-x-4 sm:max-md:grid-cols-[8.5rem_1fr] lg:pt-10">
          <div className="max-md:col-span-2"><Breadcrumbs items={[{ href: "/", label: "Home" }, ...(mainGenre ? [{ href: `/genre/${mainGenre.slug}`, label: mainGenre.title }] : []), { href: animePath(a), label: a.title }]} /></div>
          <div className="mt-2 flex flex-col gap-6 max-md:contents md:flex-row md:items-end lg:gap-10">
            <div className="rise w-full shrink-0 max-md:row-span-3 max-md:self-start md:w-52 lg:w-60">
              <TiltCard max={6} className="rounded-2xl">
                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl border border-white/15 bg-bg-2 shadow-[0_30px_70px_-25px_rgba(255,77,109,.55)]">
                  {poster && <Image src={poster} alt={`${a.title} poster`} fill sizes="(max-width: 640px) 176px, 240px" className="object-cover" priority fetchPriority="high" />}
                </div>
              </TiltCard>
            </div>

            <div className="min-w-0 flex-1 text-left max-md:contents">
              <p className="rise flex flex-wrap items-center justify-start gap-x-2 gap-y-1 text-xs font-semibold uppercase tracking-widest text-muted max-md:col-start-2 max-md:mt-1 max-md:text-[11px] max-md:tracking-wider">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${a.status === "current" ? "bg-accent-strong text-snow" : "bg-white/10 text-ink"}`}>
                  {a.status === "current" && <span className="live-dot" aria-hidden />}{statusLabel(a.status)}
                </span>
                <span>{subtypeLabel(a.subtype)}</span>
                {year && <><span aria-hidden>·</span><span>{year}</span></>}
                {a.ageRating && <><span aria-hidden>·</span><span>{a.ageRating}</span></>}
                {studios[0] && <><span aria-hidden>·</span><Link href={`/studio/${studios[0].producer.slug}`} className="hover:text-ink">{studios[0].producer.name}</Link></>}
              </p>
              <h1 className="rise-t mt-3 text-[1.7rem] font-black leading-[1.05] tracking-tight max-md:col-start-2 max-md:mt-2 sm:text-4xl md:text-5xl lg:text-6xl" style={{ ["--d" as string]: "60ms" }}>{a.title}</h1>
              {(a.titleEn && a.titleEn !== a.title) || a.titleJp ? (
                <p className="mt-2 text-base text-ink/70 max-md:col-start-2 max-md:self-start max-md:text-sm">{[a.titleEn !== a.title ? a.titleEn : null, a.titleJp].filter(Boolean).join(" · ")}</p>
              ) : null}

              {/* Key facts: the score, then a grid of labelled stat tiles */}
              <div className="rise mt-5 flex flex-col items-start gap-4 max-md:order-1 max-md:col-span-2" style={{ ["--d" as string]: "120ms" }}>
                {multi ? (
                  <a href="#stats" className="flex items-center gap-3">
                    <ScoreRing score={multi.score} label="AniLumi score" />
                    <div className="text-left leading-tight">
                      <p className="text-sm font-semibold text-ink">AniLumi score</p>
                      <p className="text-xs text-muted">Average of {multi.sources.map((x) => (x.key === "mal" ? "MAL" : x.label)).join(" · ")}</p>
                    </div>
                  </a>
                ) : a.rating ? (
                  <div className="flex items-center gap-3">
                    <ScoreRing score={a.rating / 10} label="Community score" />
                    <div className="text-left leading-tight">
                      <p className="text-sm font-semibold text-ink">Community score</p>
                      <p className="text-xs text-muted">{totalRatings ? `${compactN(totalRatings)} ratings` : "Kitsu members"}</p>
                    </div>
                  </div>
                ) : null}
                {facts2.length > 0 && (
                  <dl className="grid w-full max-w-2xl grid-cols-2 gap-2 sm:grid-cols-3 lg:grid-cols-5">
                    {facts2.map((f, idx) => (
                      <div key={f.v} className={`flex flex-col rounded-xl border border-line bg-bg-2/60 px-3 py-2.5 text-left backdrop-blur-sm ${idx === facts2.length - 1 && facts2.length % 2 === 1 ? "col-span-2 sm:col-span-1" : ""}`}>
                        <dt className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wider text-muted">
                          <NavIcon name={f.icon} className="h-3.5 w-3.5 text-violet" />{f.v}
                        </dt>
                        <dd className="mt-1 text-xl font-bold tabular-nums leading-none text-ink">{f.k}</dd>
                        {f.sub && <dd className="mt-1 text-xs text-muted">{f.sub}</dd>}
                      </div>
                    ))}
                  </dl>
                )}
              </div>

              {/* Genres: first few, the rest behind a toggle */}
              {a.categories.length > 0 && (
                <div className="mt-5 flex flex-wrap items-center justify-start gap-2 max-md:order-1 max-md:col-span-2">
                  {publicGenres(a.categories).slice(0, GENRES_SHOWN).map((c) => <Link key={c.id} href={`/genre/${c.slug}`} className="chip">{c.title}</Link>)}
                  {publicGenres(a.categories).length > GENRES_SHOWN && (
                    <details className="group contents">
                      <summary className="chip cursor-pointer list-none group-open:hidden">+{publicGenres(a.categories).length - GENRES_SHOWN} more</summary>
                      {publicGenres(a.categories).slice(GENRES_SHOWN).map((c) => <Link key={c.id} href={`/genre/${c.slug}`} className="chip">{c.title}</Link>)}
                    </details>
                  )}
                </div>
              )}

              {a.status === "current" && a.nextRelease && (
                <Link href={nextN ? episodePath(a, nextN) : `${animePath(a)}/episodes`} className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/40 max-md:col-span-2 bg-accent/10 p-3 text-left text-sm backdrop-blur transition hover:border-accent">
                  <span><strong className="text-accent-2">{nextN ? `Episode ${nextN}${planned && nextN <= planned ? ` of ${planned}` : ""}:` : "Next episode:"}</strong> {fmtDate(a.nextRelease, { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Tokyo" })} JST<LocalTime iso={a.nextRelease} /></span>
                  <Countdown iso={a.nextRelease} label="in" kitsuId={a.id} />
                </Link>
              )}
              {notice && <div className="text-left max-md:col-span-2"><AiringNoticeBanner n={notice} title={a.title} /></div>}

              <div className="mt-5 flex flex-wrap justify-start gap-2 max-md:col-span-2">
                <a href="#watch" className="btn-primary px-5 py-3 max-md:hidden!">▶ Where to watch</a>
                <Link href={`/watch-order/${a.slug}`} className="btn-outline px-4 py-3">{order ? `Watch order · ${order.entries.length}` : franchise.length ? `Watch order · ${franchise.length + 1}` : "Watch order"}</Link>
                <WatchButton item={watchItem} />
                {community && !released && <HypeButton animeId={a.id} />}
                <Link href={`/similar/${a.slug}`} className="btn-outline px-4 py-3">More like this</Link>
              </div>
            </div>
          </div>

          <EditorWatched anime={a} className="mt-5" />
          <div className="mt-6 grid grid-cols-1 gap-4 max-md:contents md:grid-cols-2 md:grid-rows-[auto_1fr]">
          <div id="watch" data-section className="self-start rounded-2xl max-md:col-span-2 max-md:mt-6 md:col-start-1 md:row-start-1 border-2 border-accent/50 bg-accent/[.07] p-4 shadow-[0_0_45px_-18px_rgba(255,77,109,.7)] backdrop-blur sm:p-5">
            <WhereToWatch
              animeId={a.id}
              title={a.title}
              links={a.streaming.map((x) => ({ id: x.id, url: x.url, site: x.site, dubs: x.dubs, subs: x.subs }))}
              extra={<>{streams && <Link href={streamsPath(streams.s)} className="btn-outline">🌍 Where to watch in the US, India &amp; UK</Link>}<AmazonLink query={`${a.title} manga`} source="anime" className="btn-outline">📚 Manga on Amazon</AmazonLink></>}
            />
            {a.streaming.length > 0 && <p className="mt-3 text-[11px] text-muted">Official, legal streams. Catalogues differ by country. · <Refreshed iso={refreshed} /></p>}
            <AffiliateNote className="mt-1" />
            {a.streaming.length === 0 && (<>
              <p className="mt-2 text-sm text-muted">No licensed streams listed yet. <AmazonLink query={`${a.title} manga`} source="anime" className="text-violet hover:underline">Read the manga on Amazon →</AmazonLink></p>
              <p className="mt-2 text-[11px] text-muted"><Refreshed iso={refreshed} /></p>
            </>)}
          </div>
          <WatchOrderCard anime={a} order={order} relations={relations} className="max-md:order-2 max-md:col-span-2 max-md:mt-4 md:col-start-2 md:row-span-2 md:row-start-1" />
          {/* Fills the space under Where to watch; the watch-order answer is the card beside it. */}
          <MobileFold label="quick answers" className="max-md:order-2 max-md:col-span-2 max-md:mt-4 md:col-start-1 md:row-start-2"><QuickAnswers title={a.title} items={glance.filter((x) => !x.href.startsWith("/watch-order/"))} /></MobileFold>
          </div>
          {community && (a.status === "current" || !released) && (<>
            <PushButton className="mt-4 max-md:order-2 max-md:col-span-2" topic={animeTopic(a.id)} source={a.status === "current" ? "anime-alert" : "anime-premiere"}
              label={a.status === "current" ? "Alert me when new episodes air" : "Alert me when it premieres"} onLabel={a.status === "current" ? "Episode alerts on" : "Premiere alert on"} />
            <LeadForm
              className="mt-4 max-md:order-2 max-md:col-span-2"
              kind="alert"
              source={a.status === "current" ? "anime-alert" : "anime-premiere"}
              animeId={a.id}
              animeTitle={a.title}
              title={a.status === "current" ? `🔔 Get an email when the next ${a.title} episode airs` : `🔔 Get an email when ${a.title} premieres`}
              blurb="One short email per episode, at air time. Nothing else."
            />
          </>)}
        </div>
      </header>

      {/* One wrapper for tabs + content, so the sticky tabs stay pinned through every section. */}
      <div className="container-x">
        <SectionNav sections={sections} />

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-14">
          {/* ───────── Overview ───────── */}
          <section id="overview" data-section aria-labelledby="h-overview">
            {verdict && (
              <div className={`card mb-6 flex flex-wrap items-center justify-between gap-3 p-4 ${verdict.kind === "none" ? "" : "border-emerald-500/40 bg-emerald-500/[.06]"}`}>
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wider text-muted">Is there a season 2?</p>
                  <p className="mt-1 font-semibold text-ink">{verdict.headline}</p>
                  <p className="mt-0.5 text-sm text-muted">{verdict.detail}</p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {sequel?.href && <Link href={sequel.href} className="btn-outline px-3 py-2 text-sm">{sequel.title} →</Link>}
                  <Link href={`${animePath(a)}/next-season`} className="text-sm font-medium text-violet hover:text-violet-2">{a.title} next season →</Link>
                </div>
              </div>
            )}
            {note && <EditorNote title={a.title} note={note} />}
            <h2 id="h-overview" className="h-section mb-3">{summaryFor(a.slug) ? "What it's about" : "Synopsis"}</h2>
            {summaryFor(a.slug) ? (
              <>
                <p className="prose-anime">{summaryFor(a.slug)!.summary}</p>
                <p className="mt-2 text-xs text-muted">Spoiler-free summary by AniLumi, {SUMMARIES_REVIEWED ? "checked" : "draft"}; facts checked against {summaryFor(a.slug)!.sources.length} sources. <Link href="/how-we-check" className="underline">How we check</Link></p>
              </>
            ) : a.synopsis ? (
              <>
                <ClampText text={excerpt(a.synopsis, 480)} lines={5} />
                <p className="mt-2 text-xs text-muted">Synopsis excerpt via <a href={`https://kitsu.app/anime/${a.slug}`} target="_blank" rel="noopener nofollow" className="underline">Kitsu</a>.</p>
              </>
            ) : <p className="text-muted">No synopsis available yet.</p>}
            {verdict2.length >= 3 && (
              <div className="card mt-6 border-violet/30 p-4" aria-labelledby="h-verdict">
                <h3 id="h-verdict" className="text-sm font-bold uppercase tracking-wider text-violet-2">Should you watch {a.title}?</h3>
                <p className="mt-2 text-sm leading-6 text-ink/90">{verdict2.join(" ")}</p>
                <p className="mt-2 text-[11px] text-muted">Built from AniList, Kitsu and MyAnimeList scores and viewer stats, AniList tags and our streaming research. <Link href={`/similar/${a.slug}`} className="underline">More like this</Link></p>
              </div>
            )}
            {a.youtubeVideoId && (
              <div className="mt-8">
                <h3 className="mb-3 text-lg font-bold">Trailer</h3>
                <YouTubeFacade id={a.youtubeVideoId} title={`${a.title} trailer`} />
              </div>
            )}
            {adapt && (
              <div className="card mt-8 p-4">
                <p className="text-xs font-semibold uppercase tracking-wider text-muted">📚 Source material</p>
                <p className="mt-1 text-sm text-ink/90">This season adapts <strong className="text-ink">{adaptedRange(adapt)}</strong>.{continueAt(adapt) && <> To read on from here in the {adapt.medium}, start at <strong className="text-ink">{continueAt(adapt)}</strong>.</>}</p>
                {adapt.notes && <p className="mt-1 text-xs text-muted">{adapt.notes}</p>}
                {buyVol && (
                  <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-2">
                    <AmazonLink query={buyVol.search} source="buy-volume" className="btn-primary">📖 Get volume {buyVol.vol}</AmazonLink>
                    {volumeLine(adapt, buyVol) && <span className="text-xs text-muted">{volumeLine(adapt, buyVol)}</span>}
                  </div>
                )}
                {buyVol && <AffiliateNote className="mt-2" />}
                <p className="mt-2 text-[11px] text-muted">{ADAPT_REVIEWED ? "Checked" : `Draft${ADAPT_CHECKED ? `, cross-checked on ${new Date(`${ADAPT_CHECKED}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" })}` : ""}`} against the series wiki and episode lists. <Link href="/how-we-check" className="underline">How we check</Link></p>
              </div>
            )}
            <HindiDub dub={dub} title={a.title} className="mt-8" />
            <MerchBlock name={a.title} source="anime" manga={false} className="mt-8" />
            {franchise.length > 0 && (
              <MobileFold label="franchise" className="mt-8">
                <div className="mb-3 flex items-end justify-between">
                  <h3 className="text-lg font-bold">Franchise</h3>
                  <Link href={`/watch-order/${a.slug}`} className="text-sm font-medium text-violet hover:underline">{a.title} watch order →</Link>
                </div>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {franchise.slice(0, 8).map((r) => (
                    <li key={r.anime.id}>
                      <Link href={animePath(r.anime)} className="card group flex items-center gap-3 p-2 pr-3 text-sm transition hover:-translate-y-0.5 hover:border-violet/60">
                        <span className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-bg-2">{posterUrl(r.anime, "tiny") && <Image src={posterUrl(r.anime, "tiny")!} alt={`${r.anime.title} poster`} fill sizes="40px" className="object-cover" />}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium group-hover:text-violet-2">{r.anime.title}</span>
                          <span className="text-[11px] uppercase tracking-wide text-muted">{r.role.replace("_", " ")}{r.anime.startDate ? ` · ${r.anime.startDate.slice(0, 4)}` : ""}</span>
                        </span>
                        <span className="text-muted transition group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden>→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </MobileFold>
            )}
          </section>

          <AdSlot slot="anime-mid" />

          {/* ───────── Episodes ───────── */}
          {epList.length > 0 && (
            <section id="episodes" data-section aria-labelledby="h-episodes">
              <div className="mb-3 flex items-end justify-between gap-3">
                <div>
                  <h2 id="h-episodes" className="h-section">{latestEps.length ? "Latest episodes" : "Episodes"}{epCount ? ` (${epCount.toLocaleString()}${airingList ? (planned ? ` of ${planned} aired` : " aired") : ""})` : ""}</h2>
                  {latestEps.length > 0 && <p className="mt-1 text-xs text-muted">Newest first</p>}
                </div>
                <Link href={`${animePath(a)}/episodes`} className="shrink-0 text-sm font-medium text-violet hover:underline">{a.title} episode list →</Link>
              </div>
              <ol className="grid gap-3 sm:grid-cols-2">
                {epList.map((e, i) => (
                  <li key={e.id}>
                    <Link href={e.number ? episodePath(a, e.number) : `${animePath(a)}/episodes`} className="card group flex gap-3 overflow-hidden p-2 transition hover:-translate-y-0.5 hover:border-violet/60">
                      <span className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-bg-2">
                        {e.thumbnail && e.number ? (
                          <SpoilerGate animeId={a.id} ep={e.number}><span className="relative block aspect-video w-32"><Image src={e.thumbnail} alt="" fill sizes="128px" className="object-cover transition duration-300 group-hover:scale-105" /></span></SpoilerGate>
                        ) : <span className="grid h-full place-items-center text-xs text-muted">Ep {e.number ?? "–"}</span>}
                        <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 text-[10px] font-bold text-snow">EP {e.number ?? "–"}</span>
                        {latestEps.length > 0 && i === 0 && <span className="absolute left-1 top-1 rounded bg-accent-strong px-1.5 text-[10px] font-bold uppercase text-snow">Latest</span>}
                      </span>
                      <span className="min-w-0 flex-1 py-1">
                        <span className="line-clamp-2 text-sm font-semibold text-ink group-hover:text-violet-2">{e.title && e.number ? <SpoilerGate inline animeId={a.id} ep={e.number}>{e.title}</SpoilerGate> : e.title || `Episode ${e.number}`}</span>
                        {(e.airdate || (e.number === lastAired && latestInfo.lastAiredDate)) && <span className="mt-1 block text-xs text-muted">{fmtDate((e.airdate || latestInfo.lastAiredDate)!)}{e.length ? ` · ${e.length} min` : ""}</span>}
                      </span>
                    </Link>
                  </li>
                ))}
              </ol>
              <StoryGuide
                title={a.title}
                animeHref={animePath(a)}
                filler={fillerFor(a.slug, a.episodeCount ?? (lastAired || null))}
                episodeLength={a.episodeLength}
                cont={continuationFor(a.slug)}
              />
              {arcs && (
                <MobileFold label="arcs" className="mt-8">
                  <ArcList title={a.title} arcs={arcs} href={(n) => episodePath(a, n)} checked={ARCS_CHECKED} reviewed={ARCS_REVIEWED} sources={arcSources(a.slug)} />
                </MobileFold>
              )}
            </section>
          )}

          {/* ───────── Characters ───────── */}
          {characters.length > 0 && (
            <section id="characters" data-section aria-labelledby="h-characters">
              <div className="mb-1 flex items-end justify-between gap-3">
                <h2 id="h-characters" className="h-section">Characters</h2>
                <Link href={`${animePath(a)}/cast`} className="group text-sm font-medium text-violet hover:text-violet-2">Cast &amp; voice actors <span className="inline-block transition-transform group-hover:translate-x-1">→</span></Link>
              </div>
              <RailScroller label="Characters">
                {characters.map((c) => (
                  <Link key={c.id} href={`/character/${c.slug}`} className="group block w-28 sm:w-32">
                    <TiltCard max={7} className="rounded-xl">
                      <div className="cc-frame">
                        {c.image && <Image src={c.image} alt={c.name} fill sizes="128px" className="object-cover" />}
                        <div className="cc-shade" />
                        {c.role === "main" && <span className="cc-main">Main</span>}
                      </div>
                    </TiltCard>
                    <p className="cc-name">{c.name}</p>
                  </Link>
                ))}
              </RailScroller>
            </section>
          )}

          {/* ───────── Stats ───────── */}
          {hasStats && (
            <section id="stats" data-section aria-labelledby="h-stats">
              <MobileFold label="the numbers">
                <h2 id="h-stats" className="h-section mb-3">By the numbers</h2>
                {multi && <div className="mb-3"><ScoreCard title={a.title} c={multi} /></div>}
                <StatTiles
                  stats={[
                    ...(a.rating && !multi ? [{ label: "Community score", value: `${(a.rating / 10).toFixed(1)} / 10`, sub: totalRatings ? `${totalRatings.toLocaleString()} ratings` : undefined }] : []),
                    ...(a.ratingRank ? [{ label: "Rank by score", value: `#${a.ratingRank.toLocaleString()}`, sub: "of all anime on Kitsu" }] : []),
                    ...(a.popularityRank ? [{ label: "Popularity rank", value: `#${a.popularityRank.toLocaleString()}`, sub: `${compactN(a.userCount)} members` }] : []),
                    ...(a.userCount ? [{ label: "Favorited by", value: `${((a.favoritesCount / a.userCount) * 100).toFixed(1)}%`, sub: `${a.favoritesCount.toLocaleString()} of its members` }] : []),
                  ]}
                />
                {dist && totalRatings >= 20 && (
                  <div className="mt-3">
                    <BarChart
                      title="Score breakdown"
                      subtitle={`${topShare}% of ${totalRatings.toLocaleString()} ratings are 9★ or 10★`}
                      valueHeading="Ratings"
                      data={dist.map((n, i) => ({ key: String(i + 1), label: `${i + 1}★`, value: n, display: n.toLocaleString() }))}
                    />
                  </div>
                )}
                {dropOk && <ViewerBehaviour title={a.title} s={dropOk} airing={a.status === "current"} genre={benchGenre} bench={bench} />}
              </MobileFold>
            </section>
          )}

          {/* ───────── Parents' guide ───────── */}
          {guide && (
            <div id="guide" data-section>
              <MobileFold label="parents' guide">
                <ParentsGuideSection title={a.title} guide={guide} ageRating={a.ageRating} ageRatingGuide={a.ageRatingGuide} />
                <Link href={`${animePath(a)}/parents-guide`} className="mt-3 inline-block text-sm font-medium text-violet hover:text-violet-2">{a.title} parents&apos; guide: is it okay for kids? →</Link>
              </MobileFold>
            </div>
          )}

          {/* ───────── Plan & track ───────── */}
          <section id="plan" data-section aria-labelledby="h-plan">
            <MobileFold label="binge planner">
              <h2 id="h-plan" className="h-section mb-1">Plan &amp; track</h2>
              {(runtime > 0 || (a.episodeCount && a.episodeLength)) && (
                <BingePlanner title={a.title} episodes={a.episodeCount || 0} episodeLength={a.episodeLength || 24} totalMinutes={runtime} status={a.status} />
              )}
              <div className="card mt-4 space-y-3 p-4">
                {(a.status === "current" || a.status === "upcoming") && <CalendarLinks compact ids={[a.id]} />}
                <p className="text-sm text-muted">
                  <a href={`${animePath(a)}/feed.xml`} className="text-violet hover:underline">RSS feed</a> for new episodes ·{" "}
                  <Link href={`/watch-order/${a.slug}`} className="text-violet hover:underline">Watch order</Link> ·{" "}
                  <Link href={`${animePath(a)}/how-long-to-watch`} className="text-violet hover:underline">How long to watch</Link> ·{" "}
                  {a.subtype !== "movie" && <><Link href={`${animePath(a)}/next-season`} className="text-violet hover:underline">{a.status === "finished" ? "Is there a next season?" : "Next season"}</Link> ·{" "}</>}
                  <Link href={`${animePath(a)}/cast`} className="text-violet hover:underline">Voice cast</Link> ·{" "}
                  <Link href={`${animePath(a)}/openings-endings`} className="text-violet hover:underline">Openings &amp; endings</Link> ·{" "}
                  <Link href="/my" className="text-violet hover:underline">My list</Link>
                </p>
                {(a.status === "current" || a.status === "upcoming") && <EmbedSnippet slug={a.slug} title={a.title} />}
              </div>
            </MobileFold>
          </section>

          {/* ───────── FAQ ───────── */}
          <div id="faq" data-section>
            <MobileFold label="questions"><Faq items={faq} title={`${a.title} FAQ`} /></MobileFold>
          </div>
        </div>

        {/* ───────── Sidebar ───────── */}
        <aside className="lg:sticky lg:top-[130px] lg:self-start">
          {community && released && <div className="mb-3"><RatingWidget animeId={a.id} title={a.title} /></div>}
          <MobileFold label="details">
            <div className="card p-4">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">Details</h2>
              <dl className="divide-y divide-line/60 text-sm">
                {facts.filter(([, v]) => v).map(([k, v]) => (
                  <div key={k} className="flex justify-between gap-3 py-2">
                    <dt className="text-muted">{k}</dt>
                    <dd className="text-right font-medium">{v}</dd>
                  </div>
                ))}
                {studios.length > 0 && (
                  <div className="flex justify-between gap-3 py-2"><dt className="text-muted">Studio</dt><dd className="text-right font-medium">{studios.map((p, i) => <span key={p.producer.id}>{i > 0 && ", "}<Link href={`/studio/${p.producer.slug}`} className="text-violet hover:underline">{p.producer.name}</Link></span>)}</dd></div>
                )}
                {keyStaff.filter((k) => k.role !== "Script").map((k) => (
                  <div key={k.role} className="flex justify-between gap-3 py-2"><dt className="text-muted">{k.role}</dt><dd className="text-right font-medium">{k.people.slice(0, 2).map((pp, i) => <span key={pp.id}>{i > 0 && ", "}<Link href={personPath(pp)} className="text-violet hover:underline">{pp.name}</Link></span>)}</dd></div>
                ))}
                {licensors.length > 0 && <div className="flex justify-between gap-3 py-2"><dt className="text-muted">Licensor</dt><dd className="text-right font-medium">{licensors.map((p) => p.producer.name).join(", ")}</dd></div>}
                <div className="flex justify-between gap-3 py-2"><dt className="text-muted">Members</dt><dd className="font-medium">{a.userCount.toLocaleString()}</dd></div>
                <div className="flex justify-between gap-3 py-2"><dt className="text-muted">Favorites</dt><dd className="font-medium">{a.favoritesCount.toLocaleString()}</dd></div>
              </dl>
            </div>
          </MobileFold>
          <AdSlot slot="anime-side" />
        </aside>
      </div>
      </div>

      <div className="container-x">
        {relatedItems.length > 0 && (
          <section className="mt-14">
            <h2 className="h-section mb-3">Compare {a.title} with…</h2>
            <div className="flex flex-wrap gap-2">
              {relatedItems.filter((o) => franchiseRoot(o.title) !== franchiseRoot(a.title)).slice(0, 5).map((o) => (
                <Link key={o.id} href={comparePath(a, o)} className="chip">{a.title} vs {o.title}</Link>
              ))}
              <Link href="/compare" className="chip chip-active">Pick any anime →</Link>
            </div>
          </section>
        )}
        {news.length > 0 && (
          <section className="reveal mt-12" aria-labelledby="anime-news-h">
            <h2 id="anime-news-h" className="h-section mb-2">Latest {a.title} news</h2>
            <div className="card max-w-3xl px-4 sm:px-5"><NewsList items={news} compact /></div>
          </section>
        )}
        <FanRecs title={a.title} recs={fanRecs} tags={insight?.tags} />
        {mainGenre && <AnimeRail title={`More ${mainGenre.title} anime`} href={`/genre/${mainGenre.slug}`} items={relatedItems} />}
      </div>

      <StickyActions item={watchItem} />
    </article>
  );
}
