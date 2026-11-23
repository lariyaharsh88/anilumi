// Query-string variants (?page=, ?sort=, filters). Reached only through the rewrites in next.config.ts;
// the plain URL is served by ../page.tsx from the ISR cache.
import { fitDescription } from "@/lib/titles";
import type { Metadata } from "next";
import Link from "@/components/Link";
import { notFound } from "next/navigation";
import { listAnime, posterUrl } from "@/lib/kitsu";
import AnimeGrid from "@/components/AnimeGrid";
import PageHero from "@/components/PageHero";
import Pagination from "@/components/Pagination";
import Faq from "@/components/Faq";
import AdSlot from "@/components/AdSlot";
import BrowseFilter from "@/components/BrowseFilter";
import AnswerLead from "@/components/AnswerLead";
import { LISTS } from "./lists";

const LIMIT = 20;

type Props = { params: Promise<{ list: string }>; searchParams: Promise<{ page?: string }> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { list } = await params;
  const { page } = await searchParams;
  const def = LISTS[list];
  if (!def) notFound();
  const p = Number(page) > 1 ? ` – Page ${page}` : "";
  return { title: def.title + p, description: fitDescription(def.description), alternates: { canonical: `/top/${list}${Number(page) > 1 ? `?page=${page}` : ""}` } };
}

export default async function TopPage({ params, searchParams }: Props) {
  const { list } = await params;
  const { page: pageStr } = await searchParams;
  const def = LISTS[list];
  if (!def) notFound();
  const page = Math.min(50, Math.max(1, Number(pageStr) || 1));
  const data = await listAnime({ ...def.opts, limit: LIMIT, offset: (page - 1) * LIMIT, withStreaming: true });

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
      {/* Names only: Kitsu's ratingRank weights vote counts, so raw scores would look out of order. "highest rated anime" and "top 100 anime" (Bing, Nov 2026: 836 impressions a month at position 7.5, 11 clicks). */}
      {page === 1 && data.items.length >= 5 && (
        <AnswerLead checked={new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" })}>
          {list === "rated" ? "The highest-rated anime of all time, by average fan score" : `${def.h1}, right now`}: {data.items.slice(0, 5).map((a, i) => `${i + 1}. ${a.title}`).join(", ")}. The full top 100 is below, with where to stream each one.
        </AnswerLead>
      )}
      <AdSlot slot="top-top" />
      <BrowseFilter source={`top=${list}`} label="this list's top 100">
        <div className="mt-6">
          <AnimeGrid items={data.items} startRank={(page - 1) * LIMIT + 1} ld={def.h1} />
        </div>
        <Pagination page={page} total={Math.min(data.total, LIMIT * 50)} limit={LIMIT} base={`/top/${list}`} />
      </BrowseFilter>
      <Faq
        items={[
          { q: "How is this ranking calculated?", a: list === "rated" ? "Titles are sorted by their average score from Kitsu community ratings, weighted so that a handful of votes cannot push an obscure title to the top." : "Titles are sorted by the number of Kitsu users who have added them to their library, which reflects real audience size rather than marketing." },
          { q: "How often is the list updated?", a: "Rankings are refreshed from the source every hour, so new seasons and surprise hits move up quickly." },
        ]}
      />
    </div>
  );
}
