import Link from "@/components/Link";
import type { Metadata } from "next";
import { getTrending, listAnime, getSeason, seasonOf, cap, getCategories, animePath, posterUrl, subtypeLabel, MAIN_GENRES } from "@/lib/kitsu";
import HeroSpotlight, { type Spot } from "@/components/fx/HeroSpotlight";
import AnimeRail from "@/components/AnimeRail";
import AdSlot from "@/components/AdSlot";
import { site } from "@/lib/site";
import StatTiles from "@/components/viz/StatTiles";
import { WATCH_ORDER_OVERRIDES } from "@/data/watch-orders";

export const revalidate = 1800;

export const metadata: Metadata = {
  title: `${site.name} – ${site.tagline}`,
  description: site.description,
  alternates: { canonical: "/" },
};

export default async function Home() {
  const { season, year } = seasonOf();
  const [trending, airing, seasonal, upcoming, topRated, movies, genres] = await Promise.all([
    getTrending(10),
    listAnime({ filter: { status: "current" }, sort: "-userCount", limit: 12 }),
    getSeason(year, season, 1, 12),
    listAnime({ filter: { status: "upcoming" }, sort: "-userCount", limit: 12 }),
    listAnime({ sort: "ratingRank", limit: 12 }),
    listAnime({ filter: { subtype: "movie" }, sort: "-userCount", limit: 12 }),
    getCategories(60),
  ]);

  const spots: Spot[] = trending.slice(0, 6).map((a, i) => ({
    id: a.id,
    href: animePath(a),
    title: a.title,
    poster: posterUrl(a, "large"),
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
