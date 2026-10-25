// Query-string variants (?page=, ?sort=, filters). Reached only through the rewrites in next.config.ts;
// the plain URL is served by ../page.tsx from the ISR cache.
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getCategory, listAnime, getCategories, TREND_GENRES, posterUrl } from "@/lib/kitsu";
import AnimeGrid from "@/components/AnimeGrid";
import PageHero from "@/components/PageHero";
import Pagination from "@/components/Pagination";
import Faq from "@/components/Faq";
import AdSlot from "@/components/AdSlot";

const LIMIT = 20;
const SORTS: Record<string, { label: string; sort: string; filter?: Record<string, string> }> = {
  popular: { label: "Most popular", sort: "-userCount" },
  rated: { label: "Top rated", sort: "ratingRank" },
  airing: { label: "Airing now", sort: "-userCount", filter: { status: "current" } },
  new: { label: "Newest", sort: "-startDate", filter: { status: "finished,current" } },
  movies: { label: "Movies", sort: "-userCount", filter: { subtype: "movie" } },
};

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string; sort?: string }> };

export async function generateStaticParamsList() {
  try {
    return (await getCategories(30)).map((g) => ({ slug: g.slug }));
  } catch {
    return [];
  }
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { page, sort } = await searchParams;
  const g = await getCategory(slug);
  if (!g) notFound();
  const s = SORTS[sort || "popular"] ? sort || "popular" : "popular";
  const qs = [s !== "popular" ? `sort=${s}` : "", Number(page) > 1 ? `page=${page}` : ""].filter(Boolean).join("&");
  return {
    title: `Best ${g.title} Anime – ${SORTS[s].label}${Number(page) > 1 ? ` (Page ${page})` : ""}`,
    description: `The best ${g.title.toLowerCase()} anime ranked by ${SORTS[s].label.toLowerCase()}. ${g.count?.toLocaleString()} titles with ratings, episode counts and where to watch.`,
    alternates: { canonical: `/genre/${slug}${qs ? `?${qs}` : ""}` },
  };
}

export default async function GenrePage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page: pageStr, sort: sortStr } = await searchParams;
  const g = await getCategory(slug);
  if (!g) notFound();
  const sortKey = SORTS[sortStr || "popular"] ? sortStr || "popular" : "popular";
  const s = SORTS[sortKey];
  const page = Math.min(50, Math.max(1, Number(pageStr) || 1));
  const data = await listAnime({ filter: { categories: g.slug, ...(s.filter || {}) }, sort: s.sort, limit: LIMIT, offset: (page - 1) * LIMIT });
  const base = `/genre/${slug}${sortKey !== "popular" ? `?sort=${sortKey}` : ""}`;

  return (
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/genre", label: "Genres" }, { href: `/genre/${slug}`, label: g.title }]}
        eyebrow="Genre"
        title={<>Best <span className="text-gradient">{g.title.toLowerCase()}</span> anime</>}
        subtitle={<p className="line-clamp-3">{g.description || `${g.count?.toLocaleString()} ${g.title.toLowerCase()} titles, ranked so the essentials come first.`}</p>}
        facts={g.count ? [{ value: g.count.toLocaleString(), label: "titles in this genre" }] : undefined}
        hue={262}
        posters={data.items.slice(0, 3).map((x) => posterUrl(x, "medium"))}
      >
        <div className="flex flex-wrap gap-2">
          {Object.entries(SORTS).map(([k, v]) => (
            <Link key={k} href={`/genre/${slug}${k !== "popular" ? `?sort=${k}` : ""}`} className={`chip ${k === sortKey ? "chip-active" : ""}`}>{v.label}</Link>
          ))}
        </div>
        {TREND_GENRES.some(([t]) => t === slug) && (
          <p className="mt-3 text-sm"><Link href={`/trends/${slug}`} className="text-violet hover:text-violet-2">📈 How {g.title.toLowerCase()} has grown or shrunk since 2000 →</Link></p>
        )}
      </PageHero>
      <AdSlot slot="genre-top" />
      <div className="mt-6">
        <AnimeGrid items={data.items} startRank={(page - 1) * LIMIT + 1} />
      </div>
      <Pagination page={page} total={Math.min(data.total, LIMIT * 50)} limit={LIMIT} base={base} />
      <Faq
        items={[
          { q: `What is the most popular ${g.title.toLowerCase()} anime?`, a: data.items[0] && sortKey === "popular" ? `${data.items[0].title} is the most popular ${g.title.toLowerCase()} anime with ${data.items[0].userCount.toLocaleString()} fans tracking it on Kitsu.` : `Switch to the "Most popular" tab to see the ${g.title.toLowerCase()} anime with the largest audience.` },
          { q: `How many ${g.title.toLowerCase()} anime are there?`, a: `Kitsu tags ${g.count?.toLocaleString()} anime with the ${g.title} genre, including TV series, movies and OVAs.` },
        ]}
      />
    </div>
  );
}
