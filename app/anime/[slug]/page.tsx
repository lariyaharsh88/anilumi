import type { Metadata } from "next";
import Link from "@/components/Link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getAnimeBySlug, getCharacters, getEpisodes, listAnime, getRelations, getLastAiredBest, getProductions, buildWatchOrder, type LastAired, type WatchOrder, comparePath, franchiseRoot, airingNotice, episodePath, posterUrl, fmtDate, statusLabel, subtypeLabel, animePath, weekdayOf, runtimeMinutes, fmtMinutes, Anime } from "@/lib/kitsu";
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
import WatchOrderCard from "@/components/WatchOrderCard";
import SpoilerGate from "@/components/SpoilerGate";
import StoryGuide from "@/components/StoryGuide";
import EditorNote from "@/components/EditorNote";
import QuickAnswers, { type Answer } from "@/components/QuickAnswers";
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
import { amazonSearch, affiliateRel } from "@/lib/affiliate";
import LocalTime from "@/components/LocalTime";
import Backdrop from "@/components/fx/Backdrop";
import ScoreRing from "@/components/fx/ScoreRing";
import ScoreCard from "@/components/ScoreCard";
import FanRecs from "@/components/FanRecs";
import NewsList from "@/components/NewsList";
import { getNews, newsAbout } from "@/lib/news";
import { getFanRecommendations, getKeyStaff, personPath } from "@/lib/anilist";
import { combineScores, kitsuScore, aniListScore, getMalScore } from "@/lib/scores";
import SectionNav, { type NavSection } from "@/components/fx/SectionNav";
import ClampText from "@/components/fx/ClampText";
import StickyActions from "@/components/fx/StickyActions";
import TiltCard from "@/components/fx/TiltCard";
import RailScroller from "@/components/fx/RailScroller";

export const revalidate = 86400;
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
  const title = `${a.title}${year ? ` (${year})` : ""} – Episodes, Release Date & Where to Watch`;
  const description = `${a.title}: ${a.episodeCount ? `${a.episodeCount} episodes` : subtypeLabel(a.subtype)}, ${statusLabel(a.status).toLowerCase()}${a.rating ? `, rated ${(a.rating / 10).toFixed(1)}/10` : ""}. ${a.synopsis.slice(0, 120).replace(/\s+\S*$/, "")}…`;
  return {
    title,
    description,
    alternates: { canonical: animePath(a) },
    openGraph: { title, description, type: "video.tv_show" },
    twitter: { card: "summary_large_image", title, description },
  };
}

function buildFaq(a: Anime, extra: FaqItem[] = []): FaqItem[] {
  const items: FaqItem[] = [];
  const next = a.nextRelease ? fmtDate(a.nextRelease, { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : null;
  if (a.status === "current") {
    items.push({ q: `When does the next episode of ${a.title} come out?`, a: next ? `The next episode of ${a.title} is scheduled for ${next} (Japan time). New episodes air weekly on ${weekdayOf(a.nextRelease)}s.` : `${a.title} is currently airing. Check the episode list for the latest air dates.` });
  }
  if (a.status === "upcoming") {
    items.push({ q: `When does ${a.title} release?`, a: a.startDate ? `${a.title} is scheduled to premiere on ${fmtDate(a.startDate, { month: "long", day: "numeric", year: "numeric" })}.` : `${a.title} is announced but does not have a confirmed release date yet.` });
  }
  items.push({ q: `How many episodes does ${a.title} have?`, a: a.episodeCount ? `${a.title} has ${a.episodeCount} episode${a.episodeCount === 1 ? "" : "s"}${a.episodeLength ? `, each around ${a.episodeLength} minutes` : ""}.` : a.status === "current" ? `${a.title} is still airing and the final episode count has not been announced.` : `The episode count for ${a.title} has not been published yet.` });
  if (a.streaming.length) {
    items.push({ q: `Where can I watch ${a.title}?`, a: `${a.title} is available to stream on ${a.streaming.map((s) => s.site).join(", ")}. Availability varies by region.` });
  }
  items.push({ q: `Is ${a.title} finished?`, a: a.status === "finished" ? `Yes. ${a.title} finished airing${a.endDate ? ` on ${fmtDate(a.endDate)}` : ""}.` : a.status === "current" ? `No, ${a.title} is currently airing.` : `${a.title} has not started airing yet.` });
  const rt = runtimeMinutes(a);
  if (rt) items.push({ q: `How long does it take to watch ${a.title}?`, a: `${a.title} runs about ${fmtMinutes(rt)} in total${a.episodeCount && a.episodeLength ? ` (${a.episodeCount} episodes of ${a.episodeLength} minutes)` : ""}. At two hours a day you can finish it in ${Math.max(1, Math.ceil(rt / 120))} day${Math.ceil(rt / 120) === 1 ? "" : "s"}.` });
  items.push(...extra);
  if (a.rating) items.push({ q: `Is ${a.title} worth watching?`, a: `${a.title} holds a community score of ${(a.rating / 10).toFixed(1)}/10 from ${a.userCount.toLocaleString()} Kitsu users${a.ratingRank ? ` and ranks #${a.ratingRank} among all anime by rating` : ""}.` });
  return items;
}

export default async function AnimePage({ params }: Props) {
  const { slug } = await params;
  const a = await getAnimeBySlug(decodeURIComponent(slug));
  if (!a) notFound();

  const mainGenre = a.categories[0];
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
  // Full order for the "Watch order" card. It can need a few more Kitsu calls (one per season), so it gets a
  // short budget; past that the card shows the direct prequel/sequel and the walk finishes in the background,
  // warming the fetch cache for the next render.
  const order = relations.some((r) => r.role === "prequel" || r.role === "sequel")
    ? await Promise.race([
        buildWatchOrder(a, (id) => (id === a.id ? Promise.resolve(relations) : getRelations(id))).catch(() => null),
        new Promise<WatchOrder | null>((r) => setTimeout(() => r(null), 4000)),
      ])
    : null;
  const runtime = runtimeMinutes(a);
  const dist = a.ratingDist || null;
  const totalRatings = dist ? dist.reduce((n, v) => n + v, 0) : 0;
  const topShare = dist && totalRatings ? Math.round(((dist[8] + dist[9]) / totalRatings) * 100) : 0;
  const compactN = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}K` : String(n));
  const notice = a.status === "current" ? airingNotice(a.nextRelease, latestInfo.nextAt) : null;
  if (latestInfo.nextAt) a.nextRelease = latestInfo.nextAt; // AniList pair: number and time stay consistent
  const lastAired = latestInfo.lastAired;
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
  const cover = a.cover?.tiny || a.cover?.small || a.cover?.large || null; // heavily blurred backdrop: served ~96px wide by the optimizer
  // One-line answers to each guide's question, linking to the full guide (depth + descriptive internal links).
  const base = animePath(a);
  const fillerInfo = a.subtype === "movie" ? null : fillerFor(a.slug, a.episodeCount ?? (lastAired || null));
  const cont = continuationFor(a.slug);
  const glance: Answer[] = [
    ...(runtime ? [{ q: "How long to watch", a: runtime >= 120 ? `About ${Math.round(runtime / 60)} hours${a.status === "current" ? " so far" : ""}` : `${runtime} minutes`, href: `${base}/how-long-to-watch` }] : []),
    ...(fillerInfo ? [{ q: "Filler episodes", a: `${fillerInfo.count} of ${fillerInfo.total} (${fillerInfo.share.toFixed(0)}%)`, href: `${base}/filler-list` }] : []),
    ...(guide ? [{ q: "Age rating", a: `${ageLabel(guide.suitable)}${a.ageRating ? ` · rated ${a.ageRating}` : ""}`, href: `${base}/parents-guide` }] : []),
    ...(franchise.length ? [{ q: "Watch order", a: "Every season, movie and OVA in order", href: `/watch-order/${a.slug}` }] : []),
    ...(cont ? [{ q: `Continue in the ${cont.medium}`, a: cont.chapter ? `From chapter ${cont.chapter}` : `From volume ${cont.volume}`, href: `${base}/manga` }] : []),
    { q: "Cast & voice actors", a: "Who voices who", href: `${base}/cast` },
    ...(a.subtype !== "movie" && a.status === "finished" ? [{ q: "Season 2?", a: "Status and release date", href: `${base}/next-season` }] : []),
  ];
  const faqExtra: FaqItem[] = [];
  const note = noteFor(a.slug);
  if (note?.start) faqExtra.push({ q: `Where should I start with ${a.title}?`, a: note.start });
  if (note) faqExtra.push({ q: `What should I watch after ${a.title}?`, a: `If you liked ${a.title}, try ${note.next.map(([, t]) => t).join(", ")}.` });
  if (guide) {
    const flagged = guide.areas.filter((x) => x.level === "strong" || x.level === "moderate").map((x) => x.label.toLowerCase());
    faqExtra.push({ q: `Is ${a.title} appropriate for kids?`, a: `${a.title} is best for ${guide.suitable.toLowerCase()}${a.ageRating ? ` and is rated ${a.ageRating}${a.ageRatingGuide ? ` (${a.ageRatingGuide})` : ""}` : ""}. ${flagged.length ? `Viewers flag ${flagged.join(", ")}.` : "Viewers don't flag any strong content."} See the parents' guide on this page for details.` });
  }
  if (dropOk) faqExtra.push({ q: `Do people finish ${a.title}?`, a: `${dropOk.dropRate.toFixed(1)}% of AniList members who start ${a.title} drop it${a.status === "current" ? " so far" : `, and ${dropOk.completionRate.toFixed(0)}% finish it`}${bench && benchGenre ? `. The median for popular ${benchGenre.toLowerCase()} anime is ${bench.toFixed(1)}%` : ""}.` });
  const faq = buildFaq(a, faqExtra);
  const year = a.startDate?.slice(0, 4);
  const community = dbEnabled();
  const released = a.status === "current" || a.status === "finished";
  // Read when the page (re)renders, i.e. at most daily: fresh enough for search engines; the widget shows live numbers.
  const fanRating = community && released ? aggregateRating(summarize(await ratingStats(a.id))) : undefined;

  const ld = {
    "@context": "https://schema.org",
    "@type": a.subtype === "movie" ? "Movie" : "TVSeries",
    name: a.title,
    alternateName: [a.titleEn, a.titleJp].filter(Boolean),
    url: abs(animePath(a)),
    image: posterUrl(a, "large") || undefined,
    description: a.synopsis,
    genre: a.categories.map((c) => c.title),
    datePublished: a.startDate || undefined,
    numberOfEpisodes: a.episodeCount || undefined,
    contentRating: a.ageRating || undefined,
    // Only AniLumi's own fan ratings, and only past RATING_SNIPPET_MIN votes: Google's review-snippet policy
    // requires ratings collected on this site, never scores aggregated from Kitsu/AniList/MAL.
    aggregateRating: fanRating,
    trailer: a.youtubeVideoId ? { "@type": "VideoObject", name: `${a.title} trailer`, embedUrl: `https://www.youtube.com/embed/${a.youtubeVideoId}`, thumbnailUrl: `https://img.youtube.com/vi/${a.youtubeVideoId}/hqdefault.jpg`, uploadDate: a.startDate || undefined, description: `Official trailer for ${a.title}` } : undefined,
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
    ...(episodes.items.length ? [{ id: "episodes", label: "Episodes" }] : []),
    ...(characters.length ? [{ id: "characters", label: "Characters" }] : []),
    ...(hasStats ? [{ id: "stats", label: "Stats" }] : []),
    ...(guide ? [{ id: "guide", label: "Parents' guide" }] : []),
    { id: "plan", label: "Plan & track" },
    { id: "faq", label: "FAQ" },
  ];
  const facts2: { k: string; v: string; sub?: string }[] = [
    ...(a.ratingRank ? [{ k: `#${a.ratingRank.toLocaleString()}`, v: "by score" }] : []),
    ...(a.popularityRank ? [{ k: `#${a.popularityRank.toLocaleString()}`, v: "popularity" }] : []),
    ...(a.episodeCount ? [{ k: String(a.episodeCount), v: a.episodeCount === 1 ? "episode" : "episodes", sub: a.episodeLength ? `${a.episodeLength} min each` : undefined }] : a.status === "current" ? [{ k: lastAired ? String(lastAired) : "–", v: "aired so far" }] : []),
    ...(runtime > 0 ? [{ k: fmtMinutes(runtime), v: "to binge" }] : []),
    ...(a.userCount ? [{ k: compactN(a.userCount), v: "members" }] : []),
  ];

  return (
    <article>
      <JsonLd data={ld} />

      {/* ───────── Hero ───────── */}
      <header id="hero" className="relative isolate overflow-hidden">
        <div className="absolute inset-0 -z-10" aria-hidden>
          {cover && (
            <div className="parallax-bg absolute inset-0">
              <Image src={cover} alt="" fill className="scale-110 object-cover opacity-40 blur-2xl" sizes="96px" quality={40} priority />
            </div>
          )}
          {coverLarge && <Backdrop src={coverLarge} className="opacity-[.42] [mask-image:linear-gradient(180deg,#000_55%,transparent)]" position="center 25%" />}
          <div className="aurora opacity-50"><span /></div>
          <div className="absolute inset-0 veil-down" />
          <div className="absolute inset-0 veil-side max-lg:hidden" />
        </div>

        <div className="container-x pb-8 pt-6 lg:pt-10">
          <Breadcrumbs items={[{ href: "/", label: "Home" }, ...(mainGenre ? [{ href: `/genre/${mainGenre.slug}`, label: mainGenre.title }] : []), { href: animePath(a), label: a.title }]} />
          <div className="mt-2 flex flex-col gap-6 md:flex-row md:items-end lg:gap-10">
            <div className="rise mx-auto w-44 shrink-0 sm:w-52 md:mx-0 lg:w-60">
              <TiltCard max={6} className="rounded-2xl">
                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-2xl border border-white/15 bg-bg-2 shadow-[0_30px_70px_-25px_rgba(255,77,109,.55)]">
                  {poster && <Image src={poster} alt={`${a.title} poster`} fill sizes="(max-width: 640px) 176px, 240px" className="object-cover" priority fetchPriority="high" />}
                </div>
              </TiltCard>
            </div>

            <div className="min-w-0 flex-1 text-center md:text-left">
              <p className="rise flex flex-wrap items-center justify-center gap-x-2 gap-y-1 text-xs font-semibold uppercase tracking-widest text-muted md:justify-start">
                <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 ${a.status === "current" ? "bg-accent-strong text-snow" : "bg-white/10 text-ink"}`}>
                  {a.status === "current" && <span className="live-dot" aria-hidden />}{statusLabel(a.status)}
                </span>
                <span>{subtypeLabel(a.subtype)}</span>
                {year && <><span aria-hidden>·</span><span>{year}</span></>}
                {a.ageRating && <><span aria-hidden>·</span><span>{a.ageRating}</span></>}
                {studios[0] && <><span aria-hidden>·</span><Link href={`/studio/${studios[0].producer.slug}`} className="hover:text-ink">{studios[0].producer.name}</Link></>}
              </p>
              <h1 className="rise-t mt-3 text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl" style={{ ["--d" as string]: "60ms" }}>{a.title}</h1>
              {(a.titleEn && a.titleEn !== a.title) || a.titleJp ? (
                <p className="mt-2 text-base text-ink/70">{[a.titleEn !== a.title ? a.titleEn : null, a.titleJp].filter(Boolean).join(" · ")}</p>
              ) : null}

              {/* Key facts */}
              <div className="rise mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 md:justify-start" style={{ ["--d" as string]: "120ms" }}>
                {multi ? (
                  <a href="#stats" className="flex items-center gap-3">
                    <ScoreRing score={multi.score} label="AniLumi score" />
                    <div className="text-left leading-tight">
                      <p className="text-sm font-semibold text-ink">AniLumi score</p>
                      <p className="text-xs text-muted">{multi.sources.map((x) => (x.key === "mal" ? "MAL" : x.label)).join(" · ")}</p>
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
                {facts2.length > 0 && <span className="hidden h-10 w-px bg-white/10 sm:block" aria-hidden />}
                <dl className="flex flex-wrap justify-center gap-x-6 gap-y-2 md:justify-start">
                  {facts2.map((f) => (
                    <div key={f.v} className="text-left leading-tight">
                      <dt className="sr-only">{f.v}</dt>
                      <dd className="text-lg font-bold text-ink">{f.k}</dd>
                      <dd className="text-xs text-muted">{f.v}{f.sub ? ` · ${f.sub}` : ""}</dd>
                    </div>
                  ))}
                </dl>
              </div>

              {/* Genres: first few, the rest behind a toggle */}
              {a.categories.length > 0 && (
                <div className="mt-5 flex flex-wrap items-center justify-center gap-2 md:justify-start">
                  {a.categories.slice(0, GENRES_SHOWN).map((c) => <Link key={c.id} href={`/genre/${c.slug}`} className="chip">{c.title}</Link>)}
                  {a.categories.length > GENRES_SHOWN && (
                    <details className="group contents">
                      <summary className="chip cursor-pointer list-none group-open:hidden">+{a.categories.length - GENRES_SHOWN} more</summary>
                      {a.categories.slice(GENRES_SHOWN).map((c) => <Link key={c.id} href={`/genre/${c.slug}`} className="chip">{c.title}</Link>)}
                    </details>
                  )}
                </div>
              )}

              {a.status === "current" && a.nextRelease && (
                <Link href={nextN ? episodePath(a, nextN) : `${animePath(a)}/episodes`} className="mt-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-3 text-left text-sm backdrop-blur transition hover:border-accent">
                  <span><strong className="text-accent-2">{nextN ? `Episode ${nextN}:` : "Next episode:"}</strong> {fmtDate(a.nextRelease, { weekday: "long", month: "long", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: "Asia/Tokyo" })} JST<LocalTime iso={a.nextRelease} /></span>
                  <Countdown iso={a.nextRelease} label="in" />
                </Link>
              )}
              {notice && <div className="text-left"><AiringNoticeBanner n={notice} title={a.title} /></div>}

              <div className="mt-5 flex flex-wrap justify-center gap-2 md:justify-start">
                <a href="#watch" className="btn-primary px-5 py-3">▶ Where to watch</a>
                <Link href={`/watch-order/${a.slug}`} className="btn-outline px-4 py-3">{order ? `Watch order · ${order.entries.length}` : franchise.length ? `Watch order · ${franchise.length + 1}` : "Watch order"}</Link>
                <WatchButton item={watchItem} />
                {community && !released && <HypeButton animeId={a.id} />}
                <Link href={`/similar/${a.slug}`} className="btn-outline px-4 py-3">More like this</Link>
              </div>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 md:items-start">
          <div id="watch" data-section className="rounded-2xl border-2 border-accent/50 bg-accent/[.07] p-4 shadow-[0_0_45px_-18px_rgba(255,77,109,.7)] backdrop-blur sm:p-5">
            <WhereToWatch
              animeId={a.id}
              title={a.title}
              links={a.streaming.map((x) => ({ id: x.id, url: x.url, site: x.site, dubs: x.dubs }))}
              extra={<a href={amazonSearch(`${a.title} manga`)} target="_blank" rel={affiliateRel} className="btn-outline">📚 Manga on Amazon</a>}
            />
            {a.streaming.length > 0 && <p className="mt-3 text-[11px] text-muted">Official, legal streams. Catalogues differ by country.</p>}
            {a.streaming.length === 0 && (
              <p className="mt-2 text-sm text-muted">No licensed streams listed yet. <a href={amazonSearch(`${a.title} manga`)} target="_blank" rel={affiliateRel} className="text-violet hover:underline">Read the manga on Amazon →</a></p>
            )}
          </div>
          <WatchOrderCard anime={a} order={order} relations={relations} />
          </div>
          {community && (a.status === "current" || !released) && (
            <LeadForm
              className="mt-4"
              kind="alert"
              source={a.status === "current" ? "anime-alert" : "anime-premiere"}
              animeId={a.id}
              animeTitle={a.title}
              title={a.status === "current" ? `🔔 Get an email when the next ${a.title} episode airs` : `🔔 Get an email when ${a.title} premieres`}
              blurb="One short email per episode, at air time. Nothing else."
            />
          )}
        </div>
      </header>

      {/* One wrapper for tabs + content, so the sticky tabs stay pinned through every section. */}
      <div className="container-x">
        <SectionNav sections={sections} />

      <div className="mt-8 grid gap-10 lg:grid-cols-[1fr_300px]">
        <div className="min-w-0 space-y-14">
          {/* ───────── Overview ───────── */}
          <section id="overview" data-section aria-labelledby="h-overview">
            {note && <EditorNote title={a.title} note={note} />}
            <QuickAnswers title={a.title} items={glance} />
            <h2 id="h-overview" className="h-section mb-3">Synopsis</h2>
            {a.synopsis ? <ClampText text={a.synopsis} lines={5} /> : <p className="text-muted">No synopsis available yet.</p>}
            {a.youtubeVideoId && (
              <div className="mt-8">
                <h3 className="mb-3 text-lg font-bold">Trailer</h3>
                <YouTubeFacade id={a.youtubeVideoId} title={`${a.title} trailer`} />
              </div>
            )}
            {franchise.length > 0 && (
              <div className="mt-8">
                <div className="mb-3 flex items-end justify-between">
                  <h3 className="text-lg font-bold">Franchise</h3>
                  <Link href={`/watch-order/${a.slug}`} className="text-sm font-medium text-violet hover:underline">Full watch order →</Link>
                </div>
                <ul className="grid gap-2 sm:grid-cols-2">
                  {franchise.slice(0, 8).map((r) => (
                    <li key={r.anime.id}>
                      <Link href={animePath(r.anime)} className="card group flex items-center gap-3 p-2 pr-3 text-sm transition hover:-translate-y-0.5 hover:border-violet/60">
                        <span className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-bg-2">{posterUrl(r.anime, "tiny") && <Image src={posterUrl(r.anime, "tiny")!} alt="" fill sizes="40px" className="object-cover" />}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate font-medium group-hover:text-violet-2">{r.anime.title}</span>
                          <span className="text-[11px] uppercase tracking-wide text-muted">{r.role.replace("_", " ")}{r.anime.startDate ? ` · ${r.anime.startDate.slice(0, 4)}` : ""}</span>
                        </span>
                        <span className="text-muted transition group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden>→</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </section>

          <AdSlot slot="anime-mid" />

          {/* ───────── Episodes ───────── */}
          {episodes.items.length > 0 && (
            <section id="episodes" data-section aria-labelledby="h-episodes">
              <div className="mb-3 flex items-end justify-between">
                <h2 id="h-episodes" className="h-section">Episodes{episodes.total ? ` (${episodes.total})` : ""}</h2>
                <Link href={`${animePath(a)}/episodes`} className="text-sm font-medium text-violet hover:underline">All episodes →</Link>
              </div>
              <ol className="grid gap-3 sm:grid-cols-2">
                {episodes.items.map((e) => (
                  <li key={e.id}>
                    <Link href={e.number ? episodePath(a, e.number) : `${animePath(a)}/episodes`} className="card group flex gap-3 overflow-hidden p-2 transition hover:-translate-y-0.5 hover:border-violet/60">
                      <span className="relative aspect-video w-32 shrink-0 overflow-hidden rounded-lg bg-bg-2">
                        {e.thumbnail && e.number ? (
                          <SpoilerGate animeId={a.id} ep={e.number}><span className="relative block aspect-video w-32"><Image src={e.thumbnail} alt="" fill sizes="128px" className="object-cover transition duration-300 group-hover:scale-105" /></span></SpoilerGate>
                        ) : <span className="grid h-full place-items-center text-xs text-muted">Ep {e.number ?? "–"}</span>}
                        <span className="absolute bottom-1 left-1 rounded bg-black/70 px-1.5 text-[10px] font-bold text-snow">EP {e.number ?? "–"}</span>
                      </span>
                      <span className="min-w-0 flex-1 py-1">
                        <span className="line-clamp-2 text-sm font-semibold text-ink group-hover:text-violet-2">{e.title && e.number ? <SpoilerGate inline animeId={a.id} ep={e.number}>{e.title}</SpoilerGate> : e.title || `Episode ${e.number}`}</span>
                        {e.airdate && <span className="mt-1 block text-xs text-muted">{fmtDate(e.airdate)}{e.length ? ` · ${e.length} min` : ""}</span>}
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
                      <div className="relative aspect-[5/6] w-full overflow-hidden rounded-xl border border-line bg-bg-2 transition-colors group-hover:border-violet/60">
                        {c.image && <Image src={c.image} alt="" fill sizes="128px" className="object-cover" />}
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-12 bg-gradient-to-t from-black/70 to-transparent" />
                        {c.role === "main" && <span className="absolute left-1.5 top-1.5 rounded bg-accent-strong px-1.5 py-0.5 text-[9px] font-bold uppercase text-snow">Main</span>}
                      </div>
                    </TiltCard>
                    <p className="mt-2 line-clamp-2 text-xs font-semibold group-hover:text-violet-2">{c.name}</p>
                  </Link>
                ))}
              </RailScroller>
            </section>
          )}

          {/* ───────── Stats ───────── */}
          {hasStats && (
            <section id="stats" data-section aria-labelledby="h-stats">
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
            </section>
          )}

          {/* ───────── Parents' guide ───────── */}
          {guide && (
            <div id="guide" data-section>
              <ParentsGuideSection title={a.title} guide={guide} ageRating={a.ageRating} ageRatingGuide={a.ageRatingGuide} />
              <Link href={`${animePath(a)}/parents-guide`} className="mt-3 inline-block text-sm font-medium text-violet hover:text-violet-2">Is {a.title} okay for kids? Full guide →</Link>
            </div>
          )}

          {/* ───────── Plan & track ───────── */}
          <section id="plan" data-section aria-labelledby="h-plan">
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
          </section>

          {/* ───────── FAQ ───────── */}
          <div id="faq" data-section>
            <Faq items={faq} title={`${a.title} FAQ`} />
          </div>
        </div>

        {/* ───────── Sidebar ───────── */}
        <aside className="lg:sticky lg:top-[130px] lg:self-start">
          {community && released && <div className="mb-3"><RatingWidget animeId={a.id} title={a.title} /></div>}
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
        <FanRecs title={a.title} recs={fanRecs} />
        {mainGenre && <AnimeRail title={`More ${mainGenre.title} anime`} href={`/genre/${mainGenre.slug}`} items={relatedItems} />}
      </div>

      <StickyActions item={watchItem} />
    </article>
  );
}
