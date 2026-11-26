import { fitDescription } from "@/lib/titles";
import Link from "@/components/Link";
import type { Metadata } from "next";
import { listAnime, getSeason, seasonOf, shiftSeason, cap, getCategories, animePath, posterUrl, subtypeLabel, MAIN_GENRES } from "@/lib/kitsu";
import { previewSnapshot } from "@/lib/preview";
import HeroSpotlight, { type Spot } from "@/components/fx/HeroSpotlight";
import AnimeRail from "@/components/AnimeRail";
import AdSlot from "@/components/AdSlot";
import { site } from "@/lib/site";
import StatTiles from "@/components/viz/StatTiles";
import { WATCH_ORDER_OVERRIDES } from "@/data/watch-orders";
import NewsList from "@/components/NewsList";
import { getNews } from "@/lib/news";
import { getQuoteOfDay } from "@/lib/quote";
import { premieresOn, animeOfTheDay, nowJst, otdPath } from "@/lib/onthisday";
import { bdPath, bdLabel, birthdaysOn, monthPath, MONTHS } from "@/lib/birthdays";
import { characterPathFor } from "@/lib/charsnap";
import Image from "next/image";
import PollCard from "@/components/PollCard";
import { currentPoll } from "@/data/polls";
import { dbEnabled } from "@/lib/db";
import { excerpt } from "@/lib/excerpt";
import GenreTile, { GENRE_HUES } from "@/components/GenreTile";
import ToolBand, { type Tool } from "@/components/ToolBand";
import BingeSearch from "@/components/BingeSearch";
import AiringNext, { type AirTimes, type NextEp } from "@/components/AiringNext";
import { airing as airingSnapshot } from "@/lib/airing";
import { onNow } from "@/lib/trending";
import { bingeFranchises } from "@/lib/franchiselist";
import { hindiDubbed, hindiDubPath, platformKind } from "@/lib/hindidub";
import { hindiDubIndexed, demandCharacters, indexedCharacterSlugs } from "@/lib/indexing";
import { characterNote } from "@/lib/charnotes";
import { snapByPage } from "@/lib/charsnap";
import { hindiArrivals } from "@/lib/hindistats";

export const revalidate = 1800;

/** Franchises for the home "Plan your binge" search: every one with 2+ parts, most-followed first. */
// Only the chips ship with the page; the full list (~40 KB) loads when the search box is first used.
const BINGE_POPULAR = bingeFranchises().slice(0, 8);

/** Tool cards between the rails (components/ToolBand): planning tools up top, games and comparisons lower down. */
const PLAN_TOOLS: Tool[] = [
  { href: "/tonight", title: "What to watch tonight", blurb: "Complete shows that fit the time you have", icon: "tonight", hue: 262 },
  { href: "/how-long-to-watch", title: "How long to watch", blurb: "Total binge time for any series", icon: "time", hue: 190 },
  { href: "/filler-lists", title: "Skip the filler", blurb: "Episode lists for Naruto, One Piece and more", icon: "filler", hue: 20 },
  { href: "/what-anime-is-this", title: "What anime is this?", blurb: "Find a show from a screenshot", icon: "camera", hue: 140 },
];
// Two full rows of four from lg up (a fifth card alone left a gap): the daily game and trivia first, they bring
// people back; then the pickers and utilities.
const FUN_TOOLS: Tool[] = [
  { href: "/guess-the-anime-character", title: "Guess the character", blurb: "A new anime character every day, 8 guesses", icon: "characters", hue: 280 },
  { href: "/anime-quiz", title: "Anime trivia quiz", blurb: "10 questions on Naruto, One Piece and more", icon: "quiz", hue: 200 },
  { href: "/what-anime-should-i-watch", title: "What should I watch?", blurb: "Four taps, three picks, Hindi dub filter", icon: "explore", hue: 300 },
  { href: "/quiz", title: "Which character are you?", blurb: "Personality quizzes for your favourite shows", icon: "flame", hue: 330 },
  { href: "/tier-list", title: "Tier list maker", blurb: "Rank your favourites, share the image", icon: "tier", hue: 40 },
  { href: "/anime-name-generator", title: "Anime name generator", blurb: "Character names with kanji and a title", icon: "random", hue: 160 },
  { href: "/compare", title: "Compare two anime", blurb: "Scores, runtime and genres side by side", icon: "compare", hue: 220 },
  { href: "/parents-guide", title: "Parents' guide", blurb: "Is it OK for kids? Content notes per show", icon: "parents", hue: 350 },
];

export const metadata: Metadata = {
  title: `${site.name} – ${site.tagline}`,
  description: fitDescription(site.description),
  alternates: { canonical: "/" },
};

export default async function Home() {
  const { season, year } = seasonOf();
  const jst = nowJst();
  // Next season's most anticipated shows (weekly AniList snapshot), linking to its preview page.
  const nextSeason = shiftSeason(season, year, 1);
  const nextPreview = (previewSnapshot().seasons[`${nextSeason.year}-${nextSeason.season}`] || []).flatMap((i) => (i.anime ? [i.anime] : [])).slice(0, 12);
  const [seasonal, upcoming, topRated, movies, genres, news, quote, premieres, pick, airingSnap] = await Promise.all([
    getSeason(year, season, 1, 12),
    listAnime({ filter: { status: "upcoming" }, sort: "-userCount", limit: 12 }),
    listAnime({ sort: "ratingRank", limit: 12 }),
    listAnime({ filter: { subtype: "movie" }, sort: "-userCount", limit: 12 }),
    getCategories(60),
    getNews(),
    getQuoteOfDay(),
    premieresOn(jst.m, jst.d, 12),
    animeOfTheDay(jst.y, jst.m, jst.d),
    airingSnapshot(),
  ]);
  // "Airing next": the next 36 hours of episodes (and the last 2, for "Out now"), most-followed shows first, shown
  // in air-time order. Posters and titles from Kitsu, matching the rest of the site.
  const now = Date.now();
  const soon = airingSnap.shows
    .flatMap((x) => (x.k && x.s ? x.n.filter(([, t]) => t * 1000 > now - 2 * 3600_000 && t * 1000 < now + 36 * 3600_000).map(([episode, t]) => ({ x, episode, t })) : []))
    .sort((p, q) => q.x.p - p.x.p)
    .slice(0, 14)
    .sort((p, q) => p.t - q.t);
  const soonAnime = soon.length ? await listAnime({ filter: { id: [...new Set(soon.map((v) => v.x.k!))].join(",") }, limit: 20, revalidate: 86400 }) : null;
  const byId = new Map((soonAnime?.items || []).map((a) => [a.id, a]));

  // Trending and "Airing this week": this week's real broadcasts (lib/trending.ts).
  const { trending: trendingNow, airing: airingItems, airingCount } = await onNow(now);
  const trending = trendingNow.slice(0, 10);
  // Every airing show's upcoming episodes, for the visitor's own saved shows ("Your shows", in the browser).
  const airTimes: AirTimes = Object.fromEntries(airingSnap.shows.filter((x) => x.k && x.n.length).map((x) => [x.k!, x.n]));
  const nextEps: NextEp[] = soon.map(({ x, episode, t }) => {
    const a = byId.get(x.k!);
    return { href: a ? animePath(a) : `/anime/${x.s}`, title: a?.title || x.t, poster: a ? posterUrl(a, "tiny") : null, episode, at: new Date(t * 1000).toISOString() };
  });
  const onDay = premieres.filter((p) => p.anime).slice(0, 4);

  const spots: Spot[] = trending.slice(0, 6).map((a, i) => ({
    id: a.id,
    href: animePath(a),
    title: a.title,
    poster: posterUrl(a, "medium"), // shown at most ~250 px wide
    cover: a.cover?.large || a.cover?.original || null,
    rating: a.rating,
    rank: i + 1,
    meta: [subtypeLabel(a.subtype), a.startDate?.slice(0, 4), a.episodeCount ? `${a.episodeCount} episodes` : null].filter(Boolean).join(" · "),
  }));
  // Mainstream genres only on the home page (Kitsu's biggest tags include adult-leaning ones).
  const tiles = genres.filter((g) => MAIN_GENRES.has(g.slug) && !["ecchi", "harem"].includes(g.slug)).slice(0, 12);
  const indexedChars = new Set(indexedCharacterSlugs());
  const popularChars = demandCharacters().filter((k) => indexedChars.has(k)).slice(0, 16).map((k) => ({ k, n: characterNote(k)?.name ?? snapByPage(k)?.n ?? k }));

  return (
    <div className="container-x py-6 sm:py-8">
      <AiringNext items={nextEps} times={airTimes} />
      <HeroSpotlight items={spots}>
        <p className="rise inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs font-semibold uppercase tracking-widest text-accent-2 backdrop-blur">
          <span className="live-dot !bg-accent-2" aria-hidden /> Updated every hour
        </p>
        <h1 className="rise-t mt-4 max-w-2xl text-4xl font-black leading-[1.05] tracking-tight sm:text-5xl xl:text-6xl" style={{ ["--d" as string]: "90ms" }}>
          Know what&apos;s airing, when it drops, and <span className="text-gradient">where to watch it.</span>
        </h1>
        <p className="rise mt-5 max-w-xl text-base text-ink/75 sm:text-lg" style={{ ["--d" as string]: "180ms" }}>
          {cap(season)} {year} charts, a weekly schedule in your time zone, auto-built watch orders, a binge planner and streaming links. No sign-up, no clutter.
        </p>
        <div className="rise mt-7 flex flex-wrap gap-3" style={{ ["--d" as string]: "270ms" }}>
          <Link href="/schedule" className="btn-primary px-5 py-3">This week&apos;s schedule</Link>
          <Link href="/tonight" className="btn-outline px-5 py-3">What to watch tonight</Link>
        </div>
        <div className="rise mt-5 flex flex-wrap gap-2 text-xs max-sm:hidden" style={{ ["--d" as string]: "360ms" }}>
          <Link href={`/season/${year}/${season}`} className="chip">{cap(season)} {year}</Link>
          <Link href="/top/rated" className="chip">Top 100</Link>
          <Link href="/watch-order" className="chip">Watch orders</Link>
          <Link href="/compare" className="chip">Compare</Link>
          <Link href="/trends" className="chip">Genre trends</Link>
        </div>
      </HeroSpotlight>

      <StatTiles
        className="mt-6"
        stats={[
          { label: "Airing this week", value: airingCount.toLocaleString(), sub: "series with new episodes", href: "/schedule", icon: "schedule", hue: 350, live: true },
          { label: `${cap(season)} ${year} lineup`, value: seasonal.total.toLocaleString(), sub: "titles this season", href: `/season/${year}/${season}`, icon: "season", hue: 140 },
          { label: "Announced", value: upcoming.total.toLocaleString(), sub: "not aired yet", href: "/top/upcoming", icon: "flame", hue: 40 },
          { label: "Watch-order guides", value: String(Object.keys(WATCH_ORDER_OVERRIDES).length), sub: "with editor notes", href: "/watch-order", icon: "order", hue: 262 },
        ]}
      />

      <BingeSearch popular={BINGE_POPULAR} />
      <AnimeRail title="Trending right now" href={`/season/${year}/${season}`} items={trending} bigRank eager />
      <ToolBand eyebrow="Plan your next watch" title="Tools for your next binge" tools={PLAN_TOOLS} />
      <AnimeRail title="Airing this week" href="/schedule" items={airingItems} />
      <HindiBand />
      <section className="reveal mt-12" aria-labelledby="home-genres-h">
        <div className="mb-3 flex items-end justify-between">
          <h2 id="home-genres-h" className="h-section">Browse by genre</h2>
          <Link href="/genre" className="group text-sm font-medium text-violet hover:text-violet-2">All genres <span className="inline-block transition-transform group-hover:translate-x-1">→</span></Link>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {tiles.map((g, i) => (
            <li key={g.id} className={i >= 8 ? "hidden sm:block" : undefined}>
              <GenreTile slug={g.slug} title={g.title} count={g.count} hue={GENRE_HUES[i % GENRE_HUES.length]} />
            </li>
          ))}
        </ul>
      </section>
      {/* The characters people search most (data/character-demand.json order), linked from the homepage so Google sees
          them as important pages of the site, not orphans reached only through the sitemap (Nov 2026). */}
      <section className="reveal mt-12" aria-labelledby="home-chars-h">
        <div className="mb-3 flex items-end justify-between">
          <h2 id="home-chars-h" className="h-section">Popular characters</h2>
          <Link href="/characters" className="group text-sm font-medium text-violet hover:text-violet-2">All characters <span className="inline-block transition-transform group-hover:translate-x-1">→</span></Link>
        </div>
        <ul className="flex flex-wrap gap-2">
          {popularChars.map((c) => <li key={c.k}><Link href={`/character/${c.k}`} className="chip">{c.n}</Link></li>)}
          <li><Link href="/strongest-anime-characters" className="chip">⚔️ Strongest characters by series</Link></li>
        </ul>
      </section>
      <AdSlot slot="home-mid" />
      <AnimeRail title={`${cap(season)} ${year} lineup`} href={`/season/${year}/${season}`} items={seasonal.items} />
      {nextPreview.length >= 6 && <AnimeRail title={`${cap(nextSeason.season)} ${nextSeason.year} preview: most anticipated`} href={`/season/${nextSeason.year}/${nextSeason.season}/preview`} items={nextPreview} />}
      {news.length > 0 && (
        <section className="reveal mt-12" aria-labelledby="home-news-h">
          <div className="mb-2 flex items-end justify-between">
            <h2 id="home-news-h" className="h-section">Latest anime news</h2>
            <Link href="/news" className="group text-sm font-medium text-violet hover:text-violet-2">All news <span className="inline-block transition-transform group-hover:translate-x-1">→</span></Link>
          </div>
          <div className="card px-4 sm:px-5"><NewsList items={news.slice(0, 5)} compact /></div>
        </section>
      )}
      {(pick || onDay.length > 0) && (
        <section className="reveal mt-12 grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.2fr)]" aria-label="Today in anime">
          {pick && (
            <div className="card flex gap-4 p-4 sm:p-5">
              <Link href={animePath(pick)} aria-hidden="true" tabIndex={-1} className="relative h-36 w-24 shrink-0 overflow-hidden rounded-lg bg-bg-2">{posterUrl(pick, "small") && <Image src={posterUrl(pick, "small")!} alt={`${pick.title} poster`} fill sizes="96px" className="object-cover" />}</Link>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-accent-2">Anime of the day</p>
                <h2 className="mt-1 text-lg font-bold text-ink"><Link href={animePath(pick)} className="hover:text-violet-2">{pick.title}</Link></h2>
                <p className="mt-1 line-clamp-3 text-sm leading-6 text-ink/75">{excerpt(pick.synopsis, 240)}</p>
              </div>
            </div>
          )}
          {onDay.length > 0 && (
            <div className="card p-4 sm:p-5">
              <div className="flex items-baseline justify-between gap-3">
                <h2 className="text-xs font-semibold uppercase tracking-wider text-accent-2">On this day in anime</h2>
                <Link href="/on-this-day" className="shrink-0 text-sm font-medium text-violet hover:text-violet-2">All →</Link>
              </div>
              <ul className="mt-3 grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-4">
                {onDay.map((p) => (
                  <li key={p.anime!.id}>
                    <Link href={animePath(p.anime!)} className="group block">
                      <span className="relative block aspect-[5/7] overflow-hidden rounded-lg bg-bg-2">{posterUrl(p.anime!, "small") && <Image src={posterUrl(p.anime!, "small")!} alt={`${p.anime!.title} poster`} fill sizes="(max-width:640px) 45vw, 140px" className="object-cover transition duration-500 group-hover:scale-105" />}<span className="absolute left-1.5 top-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[11px] font-bold text-snow">{p.year}</span></span>
                      <span className="mt-1.5 block truncate text-sm font-semibold text-ink group-hover:text-violet-2">{p.anime!.title}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs text-muted"><Link href={otdPath(jst.m, jst.d)} className="hover:text-ink">Premiered on this date</Link> · <Link href={bdPath(jst.m, jst.d)} className="hover:text-ink">Today&apos;s character birthdays</Link></p>
            </div>
          )}
        </section>
      )}
      {(() => {
        // Birthdays bring most of the search clicks: a daily strip links today's date page from the home page.
        const born = birthdaysOn(jst.m, jst.d).characters;
        return born.length > 0 && (
          <section className="reveal card mt-6 p-4 sm:p-5" aria-labelledby="born-today-h">
            <div className="flex flex-wrap items-baseline justify-between gap-2">
              <h2 id="born-today-h" className="text-xs font-semibold uppercase tracking-wider text-accent-2">🎂 Born today, {bdLabel(jst.m, jst.d)}</h2>
              <span className="flex gap-3 text-sm"><Link href="/birthdays" className="font-medium text-violet hover:text-violet-2">All {born.length} →</Link><Link href={monthPath(jst.m)} className="text-muted hover:text-ink">{cap(MONTHS[jst.m - 1])} birthdays</Link></span>
            </div>
            <ul className="mt-3 flex gap-4 overflow-x-auto pb-1 [scrollbar-width:none]">
              {born.slice(0, 10).map((c) => {
                const href = characterPathFor(c.id) ?? (c.s ? animePath({ slug: c.s }) : bdPath(jst.m, jst.d));
                return (
                  <li key={c.id} className="w-16 shrink-0 text-center">
                    <Link href={href} className="group block">
                      <span className="relative mx-auto block h-14 w-14 overflow-hidden rounded-full border border-line bg-bg-2">{c.i && <Image src={c.i} alt={c.n} fill sizes="56px" className="object-cover object-top" />}</span>
                      <span className="mt-1 block truncate text-[11px] font-medium text-ink group-hover:text-violet-2">{c.n}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })()}
      {dbEnabled() && currentPoll(new Date().toISOString().slice(0, 10)) && <div className="mt-12"><PollCard poll={currentPoll(new Date().toISOString().slice(0, 10))!} /></div>}
      <AnimeRail title="Top rated of all time" href="/top/rated" items={topRated.items} rank />
      {quote && (
        <figure className="reveal card relative mt-12 overflow-hidden p-6 sm:p-8" aria-label="Anime quote of the day">
          <span aria-hidden className="pointer-events-none absolute -left-2 -top-8 select-none text-[9rem] font-black leading-none text-white/5">“</span>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-2">Quote of the day</p>
          <blockquote className="mt-2 max-w-3xl text-lg font-semibold leading-relaxed text-ink sm:text-xl">“{quote.text}”</blockquote>
          <figcaption className="mt-3 text-sm text-muted">
            <span className="text-ink/90">{quote.character}</span>, {quote.slug ? <Link href={`/anime/${quote.slug}`} className="text-violet underline decoration-violet/40 underline-offset-2 hover:text-violet-2 hover:decoration-violet-2">{quote.anime}</Link> : quote.anime}
          </figcaption>
        </figure>
      )}
      <AnimeRail title="Coming soon" href="/top/upcoming" items={upcoming.items} />
      <AnimeRail title="Best anime movies" href="/top/movies" items={movies.items} />
      <ToolBand eyebrow="Play and compare" title="Games and handy tools" tools={FUN_TOOLS} />
    </div>
  );
}

/**
 * Anime in Hindi on the home page: Hindi dub pages bring most of the site's visits (ChatGPT and Bing, Nov 2026), and
 * the home page linked none of them. Bundled dub data only, no API calls.
 */
function HindiBand() {
  const all = hindiDubbed();
  const free = all.filter((d) => d.platforms.some((p) => platformKind(p.name) === "free")).length;
  const fresh = hindiArrivals(30).slice(0, 5);
  const popular = all.filter((d) => hindiDubIndexed(d.s)).slice(0, 12);
  return (
    <section className="reveal mt-12 card border-orange-400/30 p-4 sm:p-5" aria-labelledby="home-hindi-h">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-2">
        <h2 id="home-hindi-h" className="h-section">🇮🇳 Anime in Hindi</h2>
        <Link href="/hindi-dub" className="text-sm text-violet hover:underline">All {all.length} Hindi dubbed anime →</Link>
      </div>
      <div className="grid gap-5 lg:grid-cols-[1fr_1.4fr]">
        {fresh.length > 0 && (
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-muted">New in Hindi</p>
            <ul className="mt-2 space-y-1.5 text-sm">
              {fresh.map((e) => (
                <li key={`${e.t}-${e.service}`} className="flex justify-between gap-3">
                  <span className="truncate">{e.slug ? <Link href={animePath({ slug: e.slug })} className="text-ink hover:text-violet-2">{e.t}</Link> : e.t}</span>
                  <span className="shrink-0 text-xs text-muted">{e.service.replace(/ \(.*\)$/, "")}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">Watch in Hindi</p>
          <p className="mt-2 flex flex-wrap gap-2 text-sm">
            {popular.map((d) => <Link key={d.s} href={hindiDubPath(d.s)} className="chip">{d.t}</Link>)}
          </p>
        </div>
      </div>
      <p className="mt-4 flex flex-wrap gap-2 text-sm">
        <Link href="/hindi-dub/this-week" className="chip">📅 This week&rsquo;s Hindi episodes</Link>
        <Link href="/hindi-dub/movies" className="chip">🎬 Anime movies in Hindi</Link>
        <Link href="/hindi-dub#free" className="chip">🆓 {free} free and legal</Link>
        <Link href="/new-dubs" className="chip">New &amp; upcoming Hindi dubs</Link>
      </p>
    </section>
  );
}
