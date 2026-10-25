// Query-string variants (?page=, ?sort=, filters). Reached only through the rewrites in next.config.ts;
// the plain URL is served by ../page.tsx from the ISR cache.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listAnime, ListOpts, posterUrl } from "@/lib/kitsu";
import AnimeGrid from "@/components/AnimeGrid";
import PageHero from "@/components/PageHero";
import Pagination from "@/components/Pagination";
import Faq from "@/components/Faq";
import AdSlot from "@/components/AdSlot";

const LIMIT = 20;
const LISTS: Record<string, { title: string; h1: string; description: string; opts: ListOpts; intro: string }> = {
  rated: { title: "Top 100 Highest Rated Anime of All Time", h1: "Top rated anime of all time", description: "The highest-rated anime ever, ranked by community score on Kitsu. Updated daily.", opts: { sort: "ratingRank" }, intro: "Ranked purely by average community rating. Titles need a meaningful number of votes to appear here, so hidden gems and critically adored classics both make the cut." },
  popular: { title: "Most Popular Anime of All Time", h1: "Most popular anime", description: "The most-watched anime of all time ranked by how many fans track them on Kitsu.", opts: { sort: "-userCount" }, intro: "Popularity here means the number of people who have the title in their library, which tracks real viewership far better than hype." },
  airing: { title: "Top Airing Anime Right Now", h1: "Top airing anime", description: "The best anime currently airing, ranked by popularity, with next-episode dates and streaming links.", opts: { sort: "-userCount", filter: { status: "current" } }, intro: "Everything on this list is releasing new episodes right now. Open any title for its next air date and where to stream it." },
  upcoming: { title: "Upcoming Anime – Release Dates for Announced Series", h1: "Upcoming anime", description: "Every announced anime that has not aired yet, ranked by anticipation, with premiere dates as they are confirmed.", opts: { sort: "-userCount", filter: { status: "upcoming" } }, intro: "Announced sequels, adaptations and originals sorted by how many fans are already waiting on them. Premiere dates update as studios confirm them." },
  movies: { title: "Best Anime Movies of All Time", h1: "Best anime movies", description: "The most popular and best-rated anime films, from Studio Ghibli classics to new theatrical hits.", opts: { sort: "-userCount", filter: { subtype: "movie" } }, intro: "Feature-length anime only. Sorted by popularity so the all-time essentials come first." },
  tv: { title: "Most Popular Anime TV Series", h1: "Popular anime series", description: "Top anime TV series ranked by popularity.", opts: { sort: "-userCount", filter: { subtype: "TV" } }, intro: "Full TV series only, no movies or OVAs." },
};

type Props = { params: Promise<{ list: string }>; searchParams: Promise<{ page?: string }> };

export function generateStaticParamsList() {
  return Object.keys(LISTS).map((list) => ({ list }));
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { list } = await params;
  const { page } = await searchParams;
  const def = LISTS[list];
  if (!def) notFound();
  const p = Number(page) > 1 ? ` – Page ${page}` : "";
  return { title: def.title + p, description: def.description, alternates: { canonical: `/top/${list}${Number(page) > 1 ? `?page=${page}` : ""}` } };
}

export default async function TopPage({ params, searchParams }: Props) {
  const { list } = await params;
  const { page: pageStr } = await searchParams;
  const def = LISTS[list];
  if (!def) notFound();
  const page = Math.min(50, Math.max(1, Number(pageStr) || 1));
  const data = await listAnime({ ...def.opts, limit: LIMIT, offset: (page - 1) * LIMIT });

  return (
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: `/top/${list}`, label: def.h1 }]}
        eyebrow="Rankings · refreshed hourly"
        title={def.h1}
        subtitle={def.intro}
        hue={40}
        posters={data.items.slice(0, 3).map((x) => posterUrl(x, "medium"))}
      >
        <div className="flex flex-wrap gap-2">
          {Object.entries(LISTS).map(([k, v]) => (
            <Link key={k} href={`/top/${k}`} className={`chip ${k === list ? "chip-active" : ""}`}>{v.h1}</Link>
          ))}
        </div>
      </PageHero>
      <AdSlot slot="top-top" />
      <div className="mt-6">
        <AnimeGrid items={data.items} startRank={(page - 1) * LIMIT + 1} />
      </div>
      <Pagination page={page} total={Math.min(data.total, LIMIT * 50)} limit={LIMIT} base={`/top/${list}`} />
      <Faq
        items={[
          { q: "How is this ranking calculated?", a: list === "rated" ? "Titles are sorted by their average score from Kitsu community ratings, weighted so that a handful of votes cannot push an obscure title to the top." : "Titles are sorted by the number of Kitsu users who have added them to their library, which reflects real audience size rather than marketing." },
          { q: "How often is the list updated?", a: "Rankings are refreshed from the source every hour, so new seasons and surprise hits move up quickly." },
        ]}
      />
    </div>
  );
}
