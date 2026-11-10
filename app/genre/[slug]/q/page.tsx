// Query-string variants (?page=, ?sort=, filters). Reached only through the rewrites in next.config.ts;
import { MAIN_GENRES } from "@/lib/kitsu";
import { robotsFor, genreIndexed } from "@/lib/indexing";
// the plain URL is served by ../page.tsx from the ISR cache.
import type { Metadata } from "next";
import Link from "@/components/Link";
import { notFound } from "next/navigation";
import { getCategory, listAnime, TREND_GENRES, posterUrl } from "@/lib/kitsu";
import AnimeGrid from "@/components/AnimeGrid";
import PageHero from "@/components/PageHero";
import Pagination from "@/components/Pagination";
import Faq from "@/components/Faq";
import AdSlot from "@/components/AdSlot";
import PickList, { type Pick } from "@/components/PickList";
import { genrePicks, hiddenGems, type GenrePick } from "@/lib/picks";
import { kitsuByAniListIds } from "@/lib/kitsu";
import { snapshotOrder } from "@/lib/wosnap";

const LIMIT = 20;
const why = (p: GenrePick, genre: string) => (p.themes.length ? `${p.themes.join(", ")}.` : `A top-rated ${genre} anime.`) + ` Rated ${p.score.toFixed(1)}/10 by ${p.votes.toLocaleString("en-US")} AniList members.`;

/** The genre's best titles with reasons (top 10, short ones, hidden gems), for the plain URL only. */
async function topPicks(slug: string, genre: string) {
  const ranked = genrePicks(slug);
  if (ranked.length < 6) return null;
  const gems = hiddenGems(ranked);
  const ids = [...new Set([...ranked.slice(0, 90), ...gems].map((p) => p.anilistId))];
  const kitsu = await kitsuByAniListIds(ids).catch(() => new Map());
  // One entry per franchise, and only where you'd start it: a sequel's score speaks for the series, but nobody
  // should begin Attack on Titan at Season 3. Titles with no watch order are standalone.
  const seen = new Set<string>();
  const toPick = (p: GenrePick): Pick | null => {
    const a = kitsu.get(p.anilistId);
    if (!a) return null;
    const order = snapshotOrder(a.id);
    const root = order?.root.slug ?? a.slug;
    if (root !== a.slug || seen.has(root)) return null;
    seen.add(root);
    return { anime: a, why: why(p, genre), score: p.score };
  };
  const all = ranked.slice(0, 90).map(toPick).filter((x): x is Pick => Boolean(x));
  const top = all.slice(0, 10);
  const short = all.filter((x) => x.anime.subtype === "TV" && (x.anime.episodeCount ?? 99) <= 13 && !top.includes(x)).slice(0, 6);
  const hidden: Pick[] = gems.flatMap((p) => { const a = kitsu.get(p.anilistId); const root = a ? snapshotOrder(a.id)?.root.slug ?? a.slug : null; return a && root === a.slug && !all.some((x) => x.anime.id === a.id) ? [{ anime: a, why: why(p, genre), score: p.score }] : []; });
  return top.length >= 6 ? { top, short, hidden } : null;
}
const SORTS: Record<string, { label: string; sort: string; filter?: Record<string, string> }> = {
  popular: { label: "Most popular", sort: "-userCount" },
  rated: { label: "Top rated", sort: "ratingRank" },
  airing: { label: "Airing now", sort: "-userCount", filter: { status: "current" } },
  new: { label: "Newest", sort: "-startDate", filter: { status: "finished,current" } },
  movies: { label: "Movies", sort: "-userCount", filter: { subtype: "movie" } },
};

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string; sort?: string }> };

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { page, sort } = await searchParams;
  const g = await getCategory(slug);
  if (!g) notFound();
  const s = SORTS[sort || "popular"] ? sort || "popular" : "popular";
  const qs = [s !== "popular" ? `sort=${s}` : "", Number(page) > 1 ? `page=${page}` : ""].filter(Boolean).join("&");
  return {
    title: qs ? `Best ${g.title} Anime – ${SORTS[s].label}${Number(page) > 1 ? ` (Page ${page})` : ""}` : genrePicks(slug).length >= 6 ? `Best ${g.title} Anime (${new Date().getFullYear()}): Top 10 Ranked, With Where to Watch` : `Best ${g.title} Anime – ${SORTS[s].label}`,
    description: `The best ${g.title.toLowerCase()} anime ranked by ${SORTS[s].label.toLowerCase()}. ${g.count?.toLocaleString()} titles with ratings, episode counts and where to watch.`,
    alternates: { canonical: `/genre/${slug}${qs ? `?${qs}` : ""}` },
    // Main genres and any search already shows; never the sorted or paged copies.
    robots: robotsFor(!qs && genreIndexed(slug, MAIN_GENRES.has(slug))),
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
  const plain = sortKey === "popular" && page === 1;
  const picks = plain ? await topPicks(slug, g.title.toLowerCase()) : null;

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
          <p className="mt-3 text-sm"><Link href={`/trends/${slug}`} className="text-violet underline decoration-violet/40 underline-offset-2 hover:text-violet-2 hover:decoration-violet-2">📈 How {g.title.toLowerCase()} has grown or shrunk since 2000 →</Link></p>
        )}
      </PageHero>
      {picks && (
        <section className="reveal mt-10" aria-labelledby="picks-h">
          <h2 id="picks-h" className="h-section mb-1">The 10 best {g.title.toLowerCase()} anime</h2>
          <p className="mb-4 text-sm text-muted">Ranked by AniList score, weighted so a high score from a few thousand people doesn&apos;t outrank one from hundreds of thousands. Each says what it&apos;s about and where to stream it.</p>
          <PickList picks={picks.top} />
          {picks.short.length > 0 && (<>
            <h3 className="mb-3 mt-8 text-lg font-semibold text-ink">Short ones: 13 episodes or fewer</h3>
            <PickList picks={picks.short} compact />
          </>)}
          {picks.hidden.length > 0 && (<>
            <h3 className="mb-3 mt-8 text-lg font-semibold text-ink">Hidden gems: rated highly by fewer people</h3>
            <PickList picks={picks.hidden} compact />
          </>)}
          <h2 className="h-section mb-1 mt-12">Every {g.title.toLowerCase()} anime, most popular first</h2>
        </section>
      )}
      <AdSlot slot="genre-top" />
      <div className="mt-6">
        <AnimeGrid items={data.items} startRank={(page - 1) * LIMIT + 1} ld={`Best ${g.title.toLowerCase()} anime`} />
      </div>
      <Pagination page={page} total={Math.min(data.total, LIMIT * 50)} limit={LIMIT} base={base} />
      <Faq
        items={[
          ...(picks ? [{ q: `What is the best ${g.title.toLowerCase()} anime?`, a: `By AniList score weighted by how many rated it: ${picks.top.slice(0, 5).map((x, i) => `${i + 1}. ${x.anime.title}`).join(", ")}. ${picks.top[0].anime.title}: ${picks.top[0].why}` }] : []),
          { q: `What is the most popular ${g.title.toLowerCase()} anime?`, a: data.items[0] && sortKey === "popular" ? `${data.items[0].title} is the most popular ${g.title.toLowerCase()} anime with ${data.items[0].userCount.toLocaleString()} fans tracking it on Kitsu.` : `Switch to the "Most popular" tab to see the ${g.title.toLowerCase()} anime with the largest audience.` },
          { q: `How many ${g.title.toLowerCase()} anime are there?`, a: `Kitsu tags ${g.count?.toLocaleString()} anime with the ${g.title} genre, including TV series, movies and OVAs.` },
        ]}
      />
    </div>
  );
}
