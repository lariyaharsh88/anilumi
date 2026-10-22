import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { listAnime } from "@/lib/kitsu";
import AnimeGrid from "@/components/AnimeGrid";
import Breadcrumbs from "@/components/Breadcrumbs";
import Pagination from "@/components/Pagination";
import Faq from "@/components/Faq";
import AdSlot from "@/components/AdSlot";

const LIMIT = 20;
const MIN_YEAR = 1980;
const SORTS: Record<string, { label: string; sort: string }> = { rated: { label: "Top rated", sort: "ratingRank" }, popular: { label: "Most popular", sort: "-userCount" } };
type Props = { params: Promise<{ year: string }>; searchParams: Promise<{ page?: string; sort?: string }> };

const valid = (y: string) => /^\d{4}$/.test(y) && Number(y) >= MIN_YEAR && Number(y) <= new Date().getFullYear() + 1;

export function generateStaticParams() {
  const y = new Date().getFullYear();
  return [y, y - 1, y - 2, y - 3, y - 4].map((year) => ({ year: String(year) }));
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { year } = await params;
  const { page, sort } = await searchParams;
  if (!valid(year)) notFound();
  const s = SORTS[sort || "rated"] ? sort || "rated" : "rated";
  const cur = Number(year) === new Date().getFullYear();
  return {
    title: `Best Anime of ${year}${cur ? " (So Far)" : ""} – ${SORTS[s].label}${Number(page) > 1 ? ` Page ${page}` : ""}`,
    description: `The best anime that premiered in ${year}, ranked by ${SORTS[s].label.toLowerCase()} on Kitsu, with scores, episode counts and where to watch each one.`,
    alternates: { canonical: `/best/${year}${s !== "rated" ? `?sort=${s}` : ""}${Number(page) > 1 ? `${s !== "rated" ? "&" : "?"}page=${page}` : ""}` },
  };
}

export default async function BestOfYear({ params, searchParams }: Props) {
  const { year } = await params;
  const { page: pageStr, sort: sortStr } = await searchParams;
  if (!valid(year)) notFound();
  const y = Number(year);
  const sortKey = SORTS[sortStr || "rated"] ? sortStr || "rated" : "rated";
  const page = Math.min(25, Math.max(1, Number(pageStr) || 1));
  const data = await listAnime({ filter: { seasonYear: year }, sort: SORTS[sortKey].sort, limit: LIMIT, offset: (page - 1) * LIMIT });
  const cur = y === new Date().getFullYear();
  return (
    <div className="container-x py-8">
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { href: "/lists", label: "Lists" }, { href: `/best/${year}`, label: `Best of ${year}` }]} />
      <h1 className="text-3xl font-extrabold tracking-tight">Best anime of {year}{cur ? " so far" : ""}</h1>
      <p className="mt-2 max-w-2xl text-muted">{data.total} titles premiered in {year}. Ranked by {SORTS[sortKey].label.toLowerCase()}{cur ? ", updated hourly as the year goes on" : ""}.</p>
      <div className="mt-4 flex flex-wrap gap-2">
        {Object.entries(SORTS).map(([k, v]) => (
          <Link key={k} href={`/best/${year}${k !== "rated" ? `?sort=${k}` : ""}`} className={`chip ${k === sortKey ? "chip-active" : ""}`}>{v.label}</Link>
        ))}
        <span className="mx-2 text-muted">·</span>
        {[y - 2, y - 1, y, y + 1].filter((yy) => valid(String(yy))).map((yy) => (
          <Link key={yy} href={`/best/${yy}`} className={`chip ${yy === y ? "chip-active" : ""}`}>{yy}</Link>
        ))}
      </div>
      <AdSlot slot="best-top" />
      <div className="mt-6"><AnimeGrid items={data.items} startRank={(page - 1) * LIMIT + 1} /></div>
      <Pagination page={page} total={Math.min(data.total, LIMIT * 25)} limit={LIMIT} base={`/best/${year}${sortKey !== "rated" ? `?sort=${sortKey}` : ""}`} />
      <Faq
        items={[
          { q: `What is the best anime of ${year}?`, a: data.items[0] ? `By community rating, ${data.items[0].title} leads ${year}${data.items[0].rating ? ` with a score of ${(data.items[0].rating / 10).toFixed(1)}/10` : ""}.` : `Rankings for ${year} will appear once titles are rated.` },
          { q: `How many anime came out in ${year}?`, a: `Kitsu lists ${data.total} anime that premiered in ${year}, including TV series, movies, OVAs and web shorts.` },
        ]}
      />
    </div>
  );
}
