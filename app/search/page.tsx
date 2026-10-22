import type { Metadata } from "next";
import { searchAnime, getTrending } from "@/lib/kitsu";
import AnimeGrid from "@/components/AnimeGrid";
import SearchBox from "@/components/SearchBox";

type Props = { searchParams: Promise<{ q?: string }> };

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { q } = await searchParams;
  return { title: q ? `"${q}" – Anime search results` : "Search anime", robots: { index: false, follow: true } };
}

export default async function SearchPage({ searchParams }: Props) {
  const { q = "" } = await searchParams;
  const results = q ? await searchAnime(q, 20) : [];
  const trending = q ? [] : await getTrending(10);
  return (
    <div className="container-x py-8">
      <h1 className="text-3xl font-extrabold tracking-tight">{q ? `Results for “${q}”` : "Search anime"}</h1>
      <div className="mt-4 max-w-xl"><SearchBox defaultValue={q} /></div>
      <div className="mt-8">
        {q ? <AnimeGrid items={results} emptyText={`No anime matched “${q}”. Try the Japanese or English title.`} /> : <><h2 className="h-section mb-3">Trending searches</h2><AnimeGrid items={trending} /></>}
      </div>
    </div>
  );
}
