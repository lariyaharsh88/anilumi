import Link from "@/components/Link";
import type { Metadata } from "next";
import { getTrending, listAnime, getSeason, seasonOf, cap, getCategories, animePath, posterUrl, subtypeLabel, MAIN_GENRES } from "@/lib/kitsu";
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
import { bdPath } from "@/lib/birthdays";
import Image from "next/image";
import PollCard from "@/components/PollCard";
import { currentPoll } from "@/data/polls";
import { dbEnabled } from "@/lib/db";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: `${site.name} – ${site.tagline}`,
  description: site.description,
  alternates: { canonical: "/" },
};

export default async function Home() {
  const { season, year } = seasonOf();
  const jst = nowJst();
  const [trending, airing, seasonal, upcoming, topRated, movies, genres, news, quote, premieres, pick] = await Promise.all([
    getTrending(10),
    listAnime({ filter: { status: "current" }, sort: "-userCount", limit: 12 }),
    getSeason(year, season, 1, 12),
    listAnime({ filter: { status: "upcoming" }, sort: "-userCount", limit: 12 }),
    listAnime({ sort: "ratingRank", limit: 12 }),
    listAnime({ filter: { subtype: "movie" }, sort: "-userCount", limit: 12 }),
    getCategories(60),
    getNews(),
    getQuoteOfDay(),
    premieresOn(jst.m, jst.d, 12),
    animeOfTheDay(jst.y, jst.m, jst.d),
  ]);
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
  const HUES = [350, 262, 40, 190, 300, 140, 20, 220];
  // Mainstream genres only on the home page (Kitsu's biggest tags include adult-leaning ones).
  const tiles = genres.filter((g) => MAIN_GENRES.has(g.slug) && !["ecchi", "harem"].includes(g.slug)).slice(0, 12);

  return (
    <div className="container-x py-6 sm:py-8">
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
        <div className="rise mt-5 flex flex-wrap gap-2 text-xs" style={{ ["--d" as string]: "360ms" }}>
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
          { label: "Airing right now", value: airing.total.toLocaleString(), sub: "series with new episodes" },
          { label: `${cap(season)} ${year} lineup`, value: seasonal.total.toLocaleString(), sub: "titles this season" },
          { label: "Announced", value: upcoming.total.toLocaleString(), sub: "not aired yet" },
          { label: "Watch-order guides", value: String(Object.keys(WATCH_ORDER_OVERRIDES).length), sub: "with editor notes" },
        ]}
      />

      <AnimeRail title="Trending right now" href="/top/popular" items={trending} bigRank />
      <AnimeRail title="Airing this season" href="/schedule" items={airing.items} />
      <AdSlot slot="home-mid" />
      <AnimeRail title={`${cap(season)} ${year} lineup`} href={`/season/${year}/${season}`} items={seasonal.items} />
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
              <Link href={animePath(pick)} className="relative h-36 w-24 shrink-0 overflow-hidden rounded-lg bg-bg-2">{posterUrl(pick, "small") && <Image src={posterUrl(pick, "small")!} alt="" fill sizes="96px" className="object-cover" />}</Link>
              <div className="min-w-0">
                <p className="text-xs font-semibold uppercase tracking-wider text-accent-2">Anime of the day</p>
                <h2 className="mt-1 text-lg font-bold text-ink"><Link href={animePath(pick)} className="hover:text-violet-2">{pick.title}</Link></h2>
                <p className="mt-1 line-clamp-3 text-sm leading-6 text-ink/75">{pick.synopsis}</p>
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
                      <span className="relative block aspect-[5/7] overflow-hidden rounded-lg bg-bg-2">{posterUrl(p.anime!, "small") && <Image src={posterUrl(p.anime!, "small")!} alt="" fill sizes="(max-width:640px) 45vw, 140px" className="object-cover transition duration-500 group-hover:scale-105" />}<span className="absolute left-1.5 top-1.5 rounded bg-black/75 px-1.5 py-0.5 text-[11px] font-bold text-snow">{p.year}</span></span>
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
      {dbEnabled() && currentPoll(new Date().toISOString().slice(0, 10)) && <div className="mt-12"><PollCard poll={currentPoll(new Date().toISOString().slice(0, 10))!} /></div>}
      {quote && (
        <figure className="reveal card relative mt-12 overflow-hidden p-6 sm:p-8" aria-label="Anime quote of the day">
          <span aria-hidden className="pointer-events-none absolute -left-2 -top-8 select-none text-[9rem] font-black leading-none text-white/5">“</span>
          <p className="text-xs font-semibold uppercase tracking-wider text-accent-2">Quote of the day</p>
          <blockquote className="mt-2 max-w-3xl text-lg font-semibold leading-relaxed text-ink sm:text-xl">“{quote.text}”</blockquote>
          <figcaption className="mt-3 text-sm text-muted">
            <span className="text-ink/90">{quote.character}</span>, {quote.slug ? <Link href={`/anime/${quote.slug}`} className="text-violet hover:text-violet-2">{quote.anime}</Link> : quote.anime}
          </figcaption>
        </figure>
      )}
      <AnimeRail title="Top rated of all time" href="/top/rated" items={topRated.items} rank />
      <AnimeRail title="Coming soon" href="/top/upcoming" items={upcoming.items} />
      <AnimeRail title="Best anime movies" href="/top/movies" items={movies.items} />

      <section className="reveal mt-14">
        <div className="mb-3 flex items-end justify-between">
          <h2 className="h-section">Browse by genre</h2>
          <Link href="/genre" className="text-sm font-medium text-violet hover:text-violet-2">All genres →</Link>
        </div>
        <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
          {tiles.map((g, i) => (
            <li key={g.id}>
              <Link href={`/genre/${g.slug}`} className="genre-tile card group flex h-20 flex-col justify-between p-3 transition duration-300 hover:-translate-y-0.5 hover:border-white/20" style={{ ["--h" as string]: String(HUES[i % HUES.length]) }}>
                <span className="font-semibold text-ink">{g.title}</span>
                <span className="flex items-center justify-between text-xs text-muted">
                  {g.count ? `${g.count.toLocaleString()} titles` : "Browse"}
                  <span className="translate-x-0 opacity-0 transition duration-300 group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden>→</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
