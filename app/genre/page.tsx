import type { Metadata } from "next";
import Link from "next/link";
import { getCategories } from "@/lib/kitsu";
import Breadcrumbs from "@/components/Breadcrumbs";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Anime Genres – Browse Every Genre and Theme",
  description: "Browse anime by genre: action, romance, isekai, slice of life, horror, sports and 60+ more themes, each ranked by popularity.",
  alternates: { canonical: "/genre" },
};

export default async function GenreIndex() {
  const genres = await getCategories(80);
  return (
    <div className="container-x py-8">
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { href: "/genre", label: "Genres" }]} />
      <h1 className="text-3xl font-extrabold tracking-tight">Anime genres</h1>
      <p className="mt-2 text-muted">Pick a genre to see its most popular series and movies.</p>
      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
        {genres.map((g) => (
          <li key={g.id}>
            <Link href={`/genre/${g.slug}`} className="card block p-4 transition hover:border-violet">
              <p className="font-semibold">{g.title}</p>
              <p className="text-xs text-muted">{g.count?.toLocaleString()} titles</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
