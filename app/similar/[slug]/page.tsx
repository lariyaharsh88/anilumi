import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getAnimeBySlug, listAnime, uniqueById, animePath, Anime, posterUrl } from "@/lib/kitsu";
import AnimeGrid from "@/components/AnimeGrid";
import PageHero from "@/components/PageHero";
import Faq from "@/components/Faq";
import AdSlot from "@/components/AdSlot";

export const revalidate = 86400;
type Props = { params: Promise<{ slug: string }> };

/** Candidates sharing the title's top genres, scored by genre overlap then popularity. */
async function similarTo(a: Anime): Promise<Anime[]> {
  const cats = a.categories.map((c) => c.slug).slice(0, 4);
  if (!cats.length) return [];
  const queries = [cats.slice(0, 3).join(","), cats.slice(0, 2).join(","), cats[0]].filter((q, i, arr) => q && arr.indexOf(q) === i);
  const pages = await Promise.all(queries.map((q) => listAnime({ filter: { categories: q }, sort: "-userCount", limit: 20 })));
  const seen = new Set<string>();
  const scored: { a: Anime; score: number }[] = [];
  pages.forEach((p, qi) => {
    for (const x of p.items) {
      if (x.id === a.id || seen.has(x.id)) continue;
      seen.add(x.id);
      scored.push({ a: x, score: (queries.length - qi) * 1000 + Math.log10(x.userCount + 1) });
    }
  });
  return uniqueById(scored.sort((x, y) => y.score - x.score).map((s) => s.a)).slice(0, 20);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = await getAnimeBySlug(decodeURIComponent(slug));
  if (!a) notFound();
  return {
    title: `20 Anime Like ${a.title} – Similar Shows to Watch Next`,
    description: `Finished ${a.title}? These anime share its ${a.categories.slice(0, 3).map((c) => c.title.toLowerCase()).join(", ")} DNA, ranked by how many fans watch them.`,
    alternates: { canonical: `/similar/${a.slug}` },
  };
}

export default async function SimilarPage({ params }: Props) {
  const { slug } = await params;
  const a = await getAnimeBySlug(decodeURIComponent(slug));
  if (!a) notFound();
  const items = await similarTo(a);
  return (
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: animePath(a), label: a.title }, { href: `/similar/${a.slug}`, label: "Similar anime" }]}
        eyebrow="What to watch next"
        title={<>Anime like <span className="text-gradient">{a.title}</span></>}
        subtitle={`Matched on ${a.categories.slice(0, 4).map((c) => c.title).join(", ")}. Titles that share more of these tags rank higher; ties go to the more popular show.`}
        hue={262}
        backdrop={a.cover?.large || null}
        posters={[posterUrl(a, "medium"), ...items.slice(0, 2).map((x) => posterUrl(x, "medium"))]}
      >
        <div className="flex flex-wrap gap-2">{a.categories.slice(0, 6).map((c) => <Link key={c.id} href={`/genre/${c.slug}`} className="chip">{c.title}</Link>)}</div>
      </PageHero>
      <AdSlot slot="similar-top" />
      <div className="mt-6"><AnimeGrid items={items} startRank={1} emptyText="Not enough genre data to find matches yet." /></div>
      <Faq
        items={[
          { q: `What should I watch after ${a.title}?`, a: items[0] ? `${items.slice(0, 3).map((x) => x.title).join(", ")} are the closest matches: they share ${a.title}'s main genres and have large audiences.` : "Recommendations appear once the title has genre tags." },
          { q: "How are these picked?", a: "Automatically, from genre and theme tags on Kitsu, weighted by how many tags overlap and then by popularity. No editorial opinion is involved, so treat it as a starting point." },
        ]}
      />
    </div>
  );
}
