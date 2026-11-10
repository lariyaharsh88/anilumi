import type { Metadata } from "next";
import Link from "@/components/Link";
import { listAnime, uniqueById, posterUrl, publicGenres, getAniListId, type Anime } from "@/lib/kitsu";
import { quizFilter, describe, type Answers } from "@/lib/quiz";
import PageHero from "@/components/PageHero";
import PickList, { type Pick } from "@/components/PickList";
import { snapshotOrder } from "@/lib/wosnap";
import { dubFor } from "@/lib/hindidub";
import { REGIONS, servicesIn, streamsFor } from "@/lib/streams";
import { alAnime } from "@/lib/alsnap";
import { themesOf } from "@/lib/picks";

export const metadata: Metadata = { title: "Your Anime Picks", robots: { index: false, follow: true } };
type Props = { searchParams: Promise<Answers> };

/** Whether an English dub is on record: our researched services, else Kitsu's streaming links. */
const englishDub = (a: Anime) => { const s = streamsFor(a); return s ? REGIONS.some((r) => servicesIn(s, r).some((x) => x.audio.includes("en"))) : a.streaming.some((x) => x.dubs.includes("en")); };

export default async function QuizResults({ searchParams }: Props) {
  const a = await searchParams;
  const filter = quizFilter(a);
  // Most-followed matches first, then ranked by score so the picks are both well known and well liked.
  let pool = (await Promise.all([0, 20, 40].map((offset) => listAnime({ sort: "-userCount", limit: 20, offset, filter, revalidate: 86400 })))).flatMap((p) => p.items);
  let relaxed = false;
  if (pool.length < 6 && filter.seasonYear) {
    const { seasonYear: _drop, ...rest } = filter;
    void _drop;
    pool = (await listAnime({ sort: "-userCount", limit: 20, filter: rest, revalidate: 86400 })).items;
    relaxed = true;
  }
  // One per franchise, and only where you'd start it; then the dub the reader asked for.
  const seen = new Set<string>();
  const starts = uniqueById(pool).filter((x) => {
    const root = snapshotOrder(x.id)?.root.slug ?? x.slug;
    if (root !== x.slug || seen.has(root)) return false;
    seen.add(root);
    return true;
  });
  const dubbed = a.audio === "hi" ? starts.filter((x) => dubFor(x)?.status === "available") : a.audio === "en" ? starts.filter(englishDub) : starts;
  const noDubMatch = (a.audio === "hi" || a.audio === "en") && dubbed.length === 0;
  const ranked = (noDubMatch ? starts : dubbed).filter((x) => x.rating).sort((x, y) => (y.rating || 0) - (x.rating || 0)).slice(0, 12);
  const picks: Pick[] = await Promise.all(ranked.map(async (x) => {
    const al = await getAniListId(x.id).catch(() => null);
    const themes = al ? themesOf(alAnime(al)?.t ?? []) : [];
    const genres = publicGenres(x.categories).slice(0, 3).map((c) => c.title);
    return { anime: x, why: `${themes.length ? themes.join(", ") : genres.join(", ")}.${x.rating ? ` ${(x.rating / 10).toFixed(1)}/10 from Kitsu fans.` : ""}` };
  }));
  const share = `/quiz/results?${new URLSearchParams(a as Record<string, string>).toString()}`;
  const first = picks[0]?.anime;
  return (
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/quiz", label: "Quiz" }, { href: share, label: "Your picks" }]}
        eyebrow="🎯 Your picks"
        title={first ? <>Start with <span className="text-gradient">{first.titleEn && first.titleEn.length <= 40 ? first.titleEn : first.title}</span></> : "No exact match"}
        subtitle={picks.length ? `Matched for: ${describe(a)}.${relaxed ? " We widened the years to find enough good fits." : ""}${noDubMatch ? ` None of the matches has a confirmed ${a.audio === "hi" ? "Hindi" : "English"} dub, so these are subtitled picks.` : ""}` : "Nothing matched every answer. Try a different era or length."}
        facts={first?.rating ? [{ value: (first.rating / 10).toFixed(1), label: "fan score" }, { value: String(picks.length), label: "picks" }] : undefined}
        hue={262}
        posters={ranked.slice(0, 3).map((x) => posterUrl(x, "medium"))}
      >
        <div className="flex flex-wrap gap-2">
          <Link href="/quiz" className="btn-primary">Retake the quiz</Link>
          <Link href="/random-anime-generator" className="btn-outline">Random anime generator 🎲</Link>
        </div>
      </PageHero>
      <div className="mt-10">{picks.length ? <PickList picks={picks} /> : <p className="text-sm text-muted">No picks for this combination.</p>}</div>
      <p className="mt-6 text-xs text-muted">Only first seasons and standalone films, so every pick is somewhere you can start. ✓ marks series Harsh has watched.</p>
    </div>
  );
}
