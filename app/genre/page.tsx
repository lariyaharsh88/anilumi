import type { Metadata } from "next";
import { getCategories } from "@/lib/kitsu";
import PageHero from "@/components/PageHero";
import GenreTile, { GENRE_HUES } from "@/components/GenreTile";

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
            <GenreTile slug={g.slug} title={g.title} count={g.count} hue={GENRE_HUES[i % GENRE_HUES.length]} />
          </li>
        ))}
      </ul>
    </div>
  );
}
