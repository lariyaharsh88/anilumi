import type { Metadata } from "next";
import Link from "next/link";
import { getCategories } from "@/lib/kitsu";
import PageHero from "@/components/PageHero";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Anime Genres – Browse Every Genre and Theme",
  description: "Browse anime by genre: action, romance, isekai, slice of life, horror, sports and 60+ more themes, each ranked by popularity.",
  alternates: { canonical: "/genre" },
};

export default async function GenreIndex() {
  const genres = await getCategories(80);
  return (
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/genre", label: "Genres" }]}
        eyebrow="Browse"
        title={<>Every anime <span className="text-gradient">genre</span></>}
        subtitle="Pick a genre to see its most popular series and movies, the best rated, what's airing and the newest."
        facts={[{ value: String(genres.length), label: "genres and themes" }]}
        hue={300}
      />
      <ul className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {genres.map((g, i) => (
          <li key={g.id} className="reveal">
            <Link href={`/genre/${g.slug}`} className="genre-tile card group flex h-24 flex-col justify-between p-4 transition duration-300 hover:-translate-y-0.5 hover:border-white/20" style={{ ["--h" as string]: String([350, 262, 40, 190, 300, 140, 20, 220][i % 8]) }}>
              <span className="font-semibold text-ink">{g.title}</span>
              <span className="flex items-center justify-between text-xs text-muted">{g.count?.toLocaleString()} titles<span className="opacity-0 transition group-hover:translate-x-0.5 group-hover:opacity-100" aria-hidden>→</span></span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
