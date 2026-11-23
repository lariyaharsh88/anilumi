// Query-string variants (?page=, ?sort=, filters). Reached only through the rewrites in next.config.ts;
import { fitDescription, fitTitle } from "@/lib/titles";
import { robotsFor, bestYearIndexed } from "@/lib/indexing";
// the plain URL is served by ../page.tsx from the ISR cache.
import type { Metadata } from "next";
import Link from "@/components/Link";
import { notFound } from "next/navigation";
import { listAnime, posterUrl } from "@/lib/kitsu";
import AnimeGrid from "@/components/AnimeGrid";
import PageHero from "@/components/PageHero";
import Pagination from "@/components/Pagination";
import Faq from "@/components/Faq";
import AdSlot from "@/components/AdSlot";
import AnswerLead from "@/components/AnswerLead";

const LIMIT = 20;
const MIN_YEAR = 1980;
const SORTS: Record<string, { label: string; sort: string }> = { rated: { label: "Top rated", sort: "ratingRank" }, popular: { label: "Most popular", sort: "-userCount" } };
type Props = { params: Promise<{ year: string }>; searchParams: Promise<{ page?: string; sort?: string }> };

const valid = (y: string) => /^\d{4}$/.test(y) && Number(y) >= MIN_YEAR && Number(y) <= new Date().getFullYear() + 1;

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { year } = await params;
  const { page, sort } = await searchParams;
  if (!valid(year)) notFound();
  const s = SORTS[sort || "rated"] ? sort || "rated" : "rated";
  const cur = Number(year) === new Date().getFullYear();
  return {
    // "top-rated anime of the year" and "best anime of <year>" (Bing, Nov 2026); year-end lists peak in December.
    title: Number(page) > 1 || s !== "rated"
      ? `Best Anime of ${year}${cur ? " (So Far)" : ""} – ${SORTS[s].label}${Number(page) > 1 ? ` Page ${page}` : ""}`
      : fitTitle([`Best Anime of ${year}${cur ? " (So Far)" : ""}: Top-Rated Shows of the Year, Ranked`, `Best Anime of ${year}${cur ? " (So Far)" : ""}: Top Rated, Ranked`, `Best Anime of ${year} – Top Rated`]),
    description: fitDescription(`The best anime that premiered in ${year}, ranked by ${s === "rated" ? "average fan score" : "how many fans watched them"} on Kitsu, with scores, episode counts, genres and where to watch each one legally.`),
    alternates: { canonical: `/best/${year}${s !== "rated" ? `?sort=${s}` : ""}${Number(page) > 1 ? `${s !== "rated" ? "&" : "?"}page=${page}` : ""}` },
    // The last ten years and any year search already shows; never the sorted or paged copies.
    robots: robotsFor(s === "rated" && !(Number(page) > 1) && bestYearIndexed(Number(year))),
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
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/lists", label: "Lists" }, { href: `/best/${year}`, label: `Best of ${year}` }]}
        eyebrow={`Year in review · ${year}`}
        title={<>Best anime of <span className="text-gradient">{year}</span>{cur ? " so far" : ""}</>}
        subtitle={`Ranked by ${SORTS[sortKey].label.toLowerCase()}${cur ? ", updated hourly as the year goes on" : ""}.`}
        facts={[{ value: data.total.toLocaleString(), label: `titles premiered in ${year}` }]}
        hue={40}
        posters={data.items.slice(0, 3).map((x) => posterUrl(x, "medium"))}
      >
      <div className="flex flex-wrap gap-2">
        {Object.entries(SORTS).map(([k, v]) => (
          <Link key={k} href={`/best/${year}${k !== "rated" ? `?sort=${k}` : ""}`} className={`chip ${k === sortKey ? "chip-active" : ""}`}>{v.label}</Link>
        ))}
        <span className="mx-2 text-muted">·</span>
        {[y - 2, y - 1, y, y + 1].filter((yy) => valid(String(yy))).map((yy) => (
          <Link key={yy} href={`/best/${yy}`} className={`chip ${yy === y ? "chip-active" : ""}`}>{yy}</Link>
        ))}
      </div>
      </PageHero>
      {page === 1 && sortKey === "rated" && data.items.length >= 3 && (
        <AnswerLead checked={cur ? new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }) : undefined}>
          The best anime of {year}{cur ? " so far" : ""}, by fan score: {data.items.slice(0, 5).map((a, i) => `${i + 1}. ${a.title}${a.rating ? ` (${(a.rating / 10).toFixed(1)})` : ""}`).join(", ")}. Kitsu lists {data.total.toLocaleString()} anime that premiered in {year}{cur ? "; the ranking updates as the year goes on" : ""}.
        </AnswerLead>
      )}
      <AdSlot slot="best-top" />
      <div className="mt-6"><AnimeGrid items={data.items} startRank={(page - 1) * LIMIT + 1} ld={`Best anime of ${year}: ${SORTS[sortKey].label.toLowerCase()}`} /></div>
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
