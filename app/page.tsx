import Link from "next/link";
import type { Metadata } from "next";
import { getTrending, listAnime, getSeason, seasonOf, cap, getCategories } from "@/lib/kitsu";
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
    getCategories(16),
  ]);

  return (
    <div className="container-x py-8">
      <section className="card relative overflow-hidden bg-gradient-to-br from-bg-2 via-card to-violet/20 p-8 sm:p-12">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent">Updated every hour</p>
        <h1 className="mt-2 max-w-2xl text-3xl font-extrabold tracking-tight sm:text-5xl">Know what&apos;s airing, when the next episode drops, and where to watch it.</h1>
        <p className="mt-4 max-w-xl text-muted">
          {cap(season)} {year} charts, weekly airing schedule in your time zone, auto-built franchise watch orders, a binge planner for every title and streaming links – no sign-up, no clutter.
        </p>
        <div className="mt-6 flex flex-wrap gap-3">
          <Link href="/schedule" className="btn-primary">This week&apos;s schedule</Link>
          <Link href={`/season/${year}/${season}`} className="btn-outline">{cap(season)} {year} anime</Link>
          <Link href="/top/rated" className="btn-outline">Top 100</Link>
          <Link href="/watch-order" className="btn-outline">Watch orders</Link>
        </div>
      </section>

      <StatTiles
        className="mt-6"
        stats={[
          { label: "Airing right now", value: airing.total.toLocaleString(), sub: "series with new episodes" },
          { label: `${cap(season)} ${year} lineup`, value: seasonal.total.toLocaleString(), sub: "titles this season" },
          { label: "Announced", value: upcoming.total.toLocaleString(), sub: "not aired yet" },
          { label: "Watch-order guides", value: String(Object.keys(WATCH_ORDER_OVERRIDES).length), sub: "with editor notes" },
        ]}
      />

      <AnimeRail title="Trending right now" href="/top/popular" items={trending} rank />
      <AnimeRail title="Airing this season" href="/schedule" items={airing.items} />
      <AdSlot slot="home-mid" />
      <AnimeRail title={`${cap(season)} ${year} lineup`} href={`/season/${year}/${season}`} items={seasonal.items} />
      <AnimeRail title="Top rated of all time" href="/top/rated" items={topRated.items} rank />
      <AnimeRail title="Coming soon" href="/top/upcoming" items={upcoming.items} />
      <AnimeRail title="Best anime movies" href="/top/movies" items={movies.items} />

      <section className="mt-12">
        <h2 className="h-section mb-3">Browse by genre</h2>
        <div className="flex flex-wrap gap-2">
          {genres.map((g) => (
            <Link key={g.id} href={`/genre/${g.slug}`} className="chip">{g.title}</Link>
          ))}
          <Link href="/genre" className="chip chip-active">All genres →</Link>
        </div>
      </section>
    </div>
  );
}
