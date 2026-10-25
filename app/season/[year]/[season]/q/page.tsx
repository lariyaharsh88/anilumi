// Query-string variants (?page=, ?sort=, filters). Reached only through the rewrites in next.config.ts;
// the plain URL is served by ../page.tsx from the ISR cache.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSeason, SEASONS, Season, cap, shiftSeason, seasonOf, countAnime, animePath, posterUrl } from "@/lib/kitsu";
import StatTiles from "@/components/viz/StatTiles";
import StackedBar from "@/components/viz/StackedBar";
import BarChart from "@/components/viz/BarChart";
import AnimeGrid from "@/components/AnimeGrid";
import PageHero from "@/components/PageHero";
import Pagination from "@/components/Pagination";
import Faq from "@/components/Faq";
import AdSlot from "@/components/AdSlot";

type Props = { params: Promise<{ year: string; season: string }>; searchParams: Promise<{ page?: string }> };
const LIMIT = 20;

export async function generateStaticParamsList() {
  const now = seasonOf();
  const out: { year: string; season: string }[] = [];
  for (let d = -4; d <= 2; d++) {
    const s = shiftSeason(now.season, now.year, d);
    out.push({ year: String(s.year), season: s.season });
  }
  return out;
}

function valid(year: string, season: string) {
  const y = Number(year);
  return SEASONS.includes(season as Season) && y >= 1960 && y <= new Date().getFullYear() + 2;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { year, season } = await params;
  const { page } = await searchParams;
  if (!valid(year, season)) notFound();
  const p = Number(page) > 1 ? ` – Page ${page}` : "";
  return {
    title: `${cap(season)} ${year} Anime – Full Season Chart${p}`,
    description: `Every anime airing in ${cap(season)} ${year}: new series, sequels and movies ranked by popularity, with release dates, ratings and streaming links.`,
    alternates: { canonical: `/season/${year}/${season}${Number(page) > 1 ? `?page=${page}` : ""}` },
  };
}

export default async function SeasonPage({ params, searchParams }: Props) {
  const { year, season } = await params;
  const { page: pageStr } = await searchParams;
  if (!valid(year, season)) notFound();
  const y = Number(year);
  const s = season as Season;
  const page = Math.max(1, Number(pageStr) || 1);
  const sf = { season: s, seasonYear: year };
  const FORMATS = [["TV", "TV series"], ["movie", "Movies"], ["ONA", "ONA (web)"], ["OVA", "OVA"], ["special", "Specials"], ["music", "Music"]] as const;
  const [data, formatCounts, airingNow, upcomingCount] = await Promise.all([
    getSeason(y, s, page, LIMIT),
    page === 1 ? Promise.all(FORMATS.map(([f]) => countAnime({ ...sf, subtype: f }))) : Promise.resolve([] as number[]),
    page === 1 ? countAnime({ ...sf, status: "current" }) : Promise.resolve(0),
    page === 1 ? countAnime({ ...sf, status: "upcoming" }) : Promise.resolve(0),
  ]);
  const rated = data.items.filter((a) => a.rating);
  const avgScore = rated.length ? rated.reduce((n, a) => n + (a.rating || 0), 0) / rated.length / 10 : null;
  const prev = shiftSeason(s, y, -1);
  const next = shiftSeason(s, y, 1);
  const now = seasonOf();
  const isCurrent = now.season === s && now.year === y;

  const months: Record<Season, string> = { winter: "January to March", spring: "April to June", summer: "July to September", fall: "October to December" };

  return (
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/season", label: "Seasons" }, { href: `/season/${year}/${season}`, label: `${cap(season)} ${year}` }]}
        eyebrow={`Seasonal chart · ${months[s]}`}
        title={<><span className="text-gradient">{cap(season)} {year}</span> anime</>}
        subtitle={`Every new series, sequel and film of the season, ranked by how many fans follow it.`}
        hue={{ winter: 200, spring: 330, summer: 40, fall: 20 }[s]}
        posters={data.items.slice(0, 3).map((x) => posterUrl(x, "medium"))}
      >
      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/season/${prev.year}/${prev.season}`} className="chip">← {cap(prev.season)} {prev.year}</Link>
        {SEASONS.map((ss) => (
          <Link key={ss} href={`/season/${year}/${ss}`} className={`chip ${ss === s ? "chip-active" : ""}`}>{cap(ss)}</Link>
        ))}
        <Link href={`/season/${next.year}/${next.season}`} className="chip">{cap(next.season)} {next.year} →</Link>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        {[y - 2, y - 1, y, y + 1].map((yy) => (
          <Link key={yy} href={`/season/${yy}/${season}`} className={`chip ${yy === y ? "chip-active" : ""}`}>{yy}</Link>
        ))}
      </div>
      </PageHero>

      {page === 1 && data.total > 0 && (
        <section className="mt-6 space-y-3" aria-label="Season at a glance">
          <StatTiles
            stats={[
              { label: "Titles this season", value: data.total.toLocaleString() },
              { label: "Airing now", value: airingNow.toLocaleString() },
              { label: "Not started yet", value: upcomingCount.toLocaleString() },
              { label: "Avg score, top 20", value: avgScore ? avgScore.toFixed(1) : "–", sub: avgScore ? `${rated.length} rated titles` : "No ratings yet" },
            ]}
          />
          <div className="grid gap-3 lg:grid-cols-2">
            <StackedBar title="Format mix" subtitle={`What ${cap(season)} ${year} is made of`} segments={FORMATS.map(([k, label], i) => ({ key: k, label, value: formatCounts[i] || 0 }))} />
            <BarChart
              orientation="bar"
              title="Most followed"
              subtitle="Kitsu members tracking each title"
              valueHeading="Members"
              data={[...data.items].sort((x, y) => y.userCount - x.userCount).slice(0, 8).map((a) => ({ key: a.id, label: a.title, value: a.userCount, display: a.userCount.toLocaleString(), href: animePath(a) }))}
            />
          </div>
        </section>
      )}

      <AdSlot slot="season-top" />
      <div className="mt-6">
        <AnimeGrid items={data.items} startRank={(page - 1) * LIMIT + 1} emptyText="No titles listed for this season yet." />
      </div>
      <Pagination page={page} total={data.total} limit={LIMIT} base={`/season/${year}/${season}`} />

      <Faq
        title={`About the ${cap(season)} ${year} season`}
        items={[
          { q: `When does the ${cap(season)} ${year} anime season start?`, a: `The ${season} season covers anime that premiere between ${months[s]} ${year}. Most TV series begin in the first two weeks of the season.` },
          { q: `How many anime are airing in ${cap(season)} ${year}?`, a: `Kitsu currently lists ${data.total} titles for ${cap(season)} ${year}, including TV series, movies, OVAs and web shorts. ${isCurrent ? "This number grows as late announcements are added." : ""}` },
          { q: `What is the most popular anime of ${cap(season)} ${year}?`, a: data.items[0] ? `${data.items[0].title} is the most-tracked title of the season with ${data.items[0].userCount.toLocaleString()} users on Kitsu.` : "Rankings will appear once titles are added." },
        ]}
      />
    </div>
  );
}
