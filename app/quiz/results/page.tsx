import type { Metadata } from "next";
import Link from "@/components/Link";
import { listAnime, uniqueById, posterUrl } from "@/lib/kitsu";
import { quizFilter, describe, type Answers } from "@/lib/quiz";
import PageHero from "@/components/PageHero";
import AnimeGrid from "@/components/AnimeGrid";

export const metadata: Metadata = { title: "Your Anime Picks", robots: { index: false, follow: true } };
type Props = { searchParams: Promise<Answers> };

export default async function QuizResults({ searchParams }: Props) {
  const a = await searchParams;
  const filter = quizFilter(a);
  // Most-followed matches first, then ranked by score so the picks are both well known and well liked.
  let pool = (await Promise.all([0, 20].map((offset) => listAnime({ sort: "-userCount", limit: 20, offset, filter, revalidate: 86400 })))).flatMap((p) => p.items);
  let relaxed = false;
  if (pool.length < 6 && filter.seasonYear) {
    const { seasonYear: _drop, ...rest } = filter;
    void _drop;
    pool = (await listAnime({ sort: "-userCount", limit: 20, filter: rest, revalidate: 86400 })).items;
    relaxed = true;
  }
  const picks = uniqueById(pool).filter((x) => x.rating).sort((x, y) => (y.rating || 0) - (x.rating || 0)).slice(0, 12);
  const share = `/quiz/results?${new URLSearchParams(a as Record<string, string>).toString()}`;
  return (
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/quiz", label: "Quiz" }, { href: share, label: "Your picks" }]}
        eyebrow="🎯 Your picks"
        title={picks[0] ? <>Start with <span className="text-gradient">{picks[0].title}</span></> : "No exact match"}
        subtitle={picks.length ? `Matched for: ${describe(a)}.${relaxed ? " We widened the years to find enough good fits." : ""}` : "Nothing matched every answer. Try a different era or length."}
        facts={picks[0]?.rating ? [{ value: (picks[0].rating / 10).toFixed(1), label: "fan score" }, { value: String(picks.length), label: "picks" }] : undefined}
        hue={262}
        posters={picks.slice(0, 3).map((x) => posterUrl(x, "medium"))}
      >
        <div className="flex flex-wrap gap-2">
          <Link href="/quiz" className="btn-primary">Retake the quiz</Link>
          <Link href={`/random${filter.categories ? `?genre=${filter.categories}` : ""}`} prefetch={false} className="btn-outline">Random pick 🎲</Link>
        </div>
      </PageHero>
      <div className="mt-10"><AnimeGrid items={picks} emptyText="No picks for this combination." /></div>
    </div>
  );
}
