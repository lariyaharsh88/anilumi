import type { Metadata } from "next";
import Link from "next/link";
import { listAnime, getCategories, posterUrl } from "@/lib/kitsu";
import AnimeGrid from "@/components/AnimeGrid";
import PageHero from "@/components/PageHero";
import Pagination from "@/components/Pagination";
import Faq from "@/components/Faq";
import AdSlot from "@/components/AdSlot";

const LIMIT = 20;
type Props = { searchParams: Promise<{ page?: string; genre?: string; max?: string }> };
const MAXES = [12, 13, 24, 26];

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { genre, max, page } = await searchParams;
  const m = MAXES.includes(Number(max)) ? Number(max) : 13;
  const g = genre ? ` ${genre.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}` : "";
  const qs = [genre ? `genre=${genre}` : "", m !== 13 ? `max=${m}` : "", Number(page) > 1 ? `page=${page}` : ""].filter(Boolean).join("&");
  return {
    title: `Best Short${g} Anime (${m} Episodes or Less) – Weekend Binges`,
    description: `Top-rated${g} anime you can finish in a weekend: complete series with ${m} episodes or fewer, ranked by score, with runtime and where to watch.`,
    alternates: { canonical: `/short-anime${qs ? `?${qs}` : ""}` },
  };
}

export default async function ShortAnime({ searchParams }: Props) {
  const { page: pageStr, genre, max } = await searchParams;
  const m = MAXES.includes(Number(max)) ? Number(max) : 13;
  const page = Math.min(25, Math.max(1, Number(pageStr) || 1));
  const [data, genres] = await Promise.all([
    listAnime({ filter: { subtype: "TV", status: "finished", episodeCount: `1..${m}`, ...(genre ? { categories: genre } : {}) }, sort: "ratingRank", limit: LIMIT, offset: (page - 1) * LIMIT }),
    getCategories(14),
  ]);
  const base = `/short-anime${[genre ? `genre=${genre}` : "", m !== 13 ? `max=${m}` : ""].filter(Boolean).length ? `?${[genre ? `genre=${genre}` : "", m !== 13 ? `max=${m}` : ""].filter(Boolean).join("&")}` : ""}`;
  const gTitle = genre ? genres.find((x) => x.slug === genre)?.title || genre : null;
  return (
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/lists", label: "Lists" }, { href: "/short-anime", label: "Short anime" }]}
        eyebrow="Weekend binges"
        title={<>Best short{gTitle ? ` ${gTitle.toLowerCase()}` : ""} anime, <span className="text-gradient">{m} episodes or less</span></>}
        subtitle={`Complete TV series only, so every pick has an ending. Ranked by community score. Roughly ${Math.round((m * 24) / 60)} hours or less per show.`}
        hue={190}
        posters={data.items.slice(0, 3).map((x) => posterUrl(x, "medium"))}
      >
      <div className="flex flex-wrap gap-2">
        {MAXES.map((x) => <Link key={x} href={`/short-anime?${[genre ? `genre=${genre}` : "", x !== 13 ? `max=${x}` : ""].filter(Boolean).join("&")}`} className={`chip ${x === m ? "chip-active" : ""}`}>≤ {x} ep</Link>)}
        <span className="mx-2 text-muted">·</span>
        <Link href={`/short-anime${m !== 13 ? `?max=${m}` : ""}`} className={`chip ${!genre ? "chip-active" : ""}`}>All genres</Link>
        {genres.map((g) => <Link key={g.id} href={`/short-anime?genre=${g.slug}${m !== 13 ? `&max=${m}` : ""}`} className={`chip ${g.slug === genre ? "chip-active" : ""}`}>{g.title}</Link>)}
      </div>
      </PageHero>
      <AdSlot slot="short-top" />
      <div className="mt-6"><AnimeGrid items={data.items} startRank={(page - 1) * LIMIT + 1} /></div>
      <Pagination page={page} total={Math.min(data.total, LIMIT * 25)} limit={LIMIT} base={base} />
      <Faq
        items={[
          { q: "How long does a 12-episode anime take to watch?", a: "About 4 to 5 hours: 12 episodes of roughly 24 minutes each, or closer to 4 hours if you skip openings and endings. The binge planner on each title gives an exact figure." },
          { q: `What is the best short${gTitle ? ` ${gTitle.toLowerCase()}` : ""} anime?`, a: data.items[0] ? `${data.items[0].title} is the highest-rated complete series here with ${data.items[0].episodeCount} episodes${data.items[0].rating ? ` and a ${(data.items[0].rating / 10).toFixed(1)}/10 score` : ""}.` : "Results appear once the filter matches a title." },
        ]}
      />
    </div>
  );
}
