import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getSeason, SEASONS, Season, cap, shiftSeason, seasonOf } from "@/lib/kitsu";
import AnimeGrid from "@/components/AnimeGrid";
import Breadcrumbs from "@/components/Breadcrumbs";
import Pagination from "@/components/Pagination";
import Faq from "@/components/Faq";
import AdSlot from "@/components/AdSlot";

type Props = { params: Promise<{ year: string; season: string }>; searchParams: Promise<{ page?: string }> };
const LIMIT = 20;

export async function generateStaticParams() {
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
  const data = await getSeason(y, s, page, LIMIT);
  const prev = shiftSeason(s, y, -1);
  const next = shiftSeason(s, y, 1);
  const now = seasonOf();
  const isCurrent = now.season === s && now.year === y;

  const months: Record<Season, string> = { winter: "January to March", spring: "April to June", summer: "July to September", fall: "October to December" };

  return (
    <div className="container-x py-8">
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { href: "/season", label: "Seasons" }, { href: `/season/${year}/${season}`, label: `${cap(season)} ${year}` }]} />
      <h1 className="text-3xl font-extrabold tracking-tight">{cap(season)} {year} anime</h1>
      <p className="mt-1 text-muted">{data.total} titles · {months[s]} · ranked by popularity</p>

      <div className="mt-4 flex flex-wrap items-center gap-2">
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
