import { fitDescription } from "@/lib/titles";
import type { Metadata } from "next";
import EditorWatched from "@/components/EditorWatched";
import Link from "@/components/Link";
import { notFound } from "next/navigation";
import { getAnimeBySlug, listAnime, uniqueById, animePath, Anime, posterUrl, publicGenres } from "@/lib/kitsu";
import AnimeGrid from "@/components/AnimeGrid";
import PageHero from "@/components/PageHero";
import Faq from "@/components/Faq";
import AdSlot from "@/components/AdSlot";
import FanRecs from "@/components/FanRecs";
import { getFanRecommendations } from "@/lib/anilist";
import { getAniListInsight } from "@/lib/insights";
import { robotsFor, similarIndexed } from "@/lib/indexing";
import PickList from "@/components/PickList";
import { similarStrength, fanPicks } from "@/lib/picks";
import { getAniListId } from "@/lib/kitsu";
import { WATCH_ORDER_OVERRIDES } from "@/data/watch-orders";

export const revalidate = 604800;
// Render on first request, then serve from the ISR cache until revalidated.
export async function generateStaticParams() { return []; }
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

/** Indexed when Google already shows it, or when fans recommend 8+ titles and 5+ share themes with it. */
async function strong(kitsuId: string, slug: string) {
  const alId = await getAniListId(kitsuId).catch(() => null);
  return { alId, indexed: similarIndexed(slug) || (alId ? similarStrength(alId).strong : false) };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = await getAnimeBySlug(decodeURIComponent(slug));
  if (!a) notFound();
  // English name when it's what people search ("anime like my hero academia"), the real count and the year.
  const name = WATCH_ORDER_OVERRIDES[a.slug]?.label ?? (a.titleEn && a.titleEn.length <= 40 ? a.titleEn : a.title);
  const n = (await similarTo(a)).length;
  const { indexed, alId } = await strong(a.id, a.slug);
  const fans = indexed ? fanPicks(await getFanRecommendations(a.id, 12), alId, name).length : 0;
  return {
    title: indexed && fans >= 8 ? `Anime Like ${name}: ${fans} Picks Fans Recommend, and Why (${new Date().getFullYear()})` : `Anime Like ${name}: ${n || 20} Shows to Watch Next (${new Date().getFullYear()})`,
    description: fitDescription(`Finished ${name}? These anime share its ${publicGenres(a.categories).slice(0, 3).map((c) => c.title.toLowerCase()).join(", ")} DNA, ranked by how many fans watch them.`),
    alternates: { canonical: `/similar/${a.slug}` },
    robots: robotsFor(indexed),
  };
}

export default async function SimilarPage({ params }: Props) {
  const { slug } = await params;
  const a = await getAnimeBySlug(decodeURIComponent(slug));
  if (!a) notFound();
  const [items, recs, insight, { alId }] = await Promise.all([similarTo(a), getFanRecommendations(a.id, 12), getAniListInsight(a.id), strong(a.id, a.slug)]);
  const name = WATCH_ORDER_OVERRIDES[a.slug]?.label ?? (a.titleEn && a.titleEn.length <= 40 ? a.titleEn : a.title);
  const picks = fanPicks(recs, alId, name);
  return (
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: animePath(a), label: a.title }, { href: `/similar/${a.slug}`, label: "Similar anime" }]}
        eyebrow="What to watch next"
        title={<>Anime like <span className="text-gradient">{a.title}</span></>}
        subtitle={`Matched on ${publicGenres(a.categories).slice(0, 4).map((c) => c.title).join(", ")}. Titles that share more of these tags rank higher; ties go to the more popular show.`}
        hue={262}
        backdrop={a.cover?.large || null}
        posters={[posterUrl(a, "medium"), ...items.slice(0, 2).map((x) => posterUrl(x, "medium"))]}
      >
        <div className="flex flex-wrap gap-2">{publicGenres(a.categories).slice(0, 6).map((c) => <Link key={c.id} href={`/genre/${c.slug}`} className="chip">{c.title}</Link>)}</div>
      </PageHero>
      <EditorWatched anime={a} className="mt-4" />
      {picks.length >= 4 ? (
        <section className="reveal mt-10" aria-labelledby="picks-h">
          <h2 id="picks-h" className="h-section mb-1">{picks.length} anime {name} fans recommend, and why</h2>
          <p className="mb-4 text-sm text-muted">Ordered by how many AniList members recommend each to {name} fans. The reason line is what the two share, from AniList&apos;s community tags.</p>
          <PickList picks={picks} />
        </section>
      ) : <FanRecs title={a.title} recs={recs} heading={`What ${a.title} fans recommend`} tags={insight?.tags} />}
      <AdSlot slot="similar-top" />
      <h2 className="h-section mb-3 mt-12">Same genres and themes</h2>
      <div><AnimeGrid items={items} startRank={1} ld={`Anime like ${a.title}`} emptyText="Not enough genre data to find matches yet." /></div>
      <Faq
        items={[
          ...(recs[0] ? [{ q: `What do ${a.title} fans recommend?`, a: `AniList members most often recommend ${recs.slice(0, 3).map((r) => `${r.title} (${r.votes.toLocaleString("en-US")} votes)`).join(", ")}.` }] : []),
          { q: `What should I watch after ${a.title}?`, a: items[0] ? `${items.slice(0, 3).map((x) => x.title).join(", ")} are the closest matches: they share ${a.title}'s main genres and have large audiences.` : "Recommendations appear once the title has genre tags." },
          { q: "How are these picked?", a: "Automatically, from genre and theme tags on Kitsu, weighted by how many tags overlap and then by popularity. No editorial opinion is involved, so treat it as a starting point." },
        ]}
      />
    </div>
  );
}
