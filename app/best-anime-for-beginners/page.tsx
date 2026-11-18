import type { Metadata } from "next";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import Faq, { type FaqItem } from "@/components/Faq";
import PickList, { type Pick } from "@/components/PickList";
import { itemList } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { kitsuByAniListIds, posterUrl, type Anime } from "@/lib/kitsu";
import { allTimePicks, type GenrePick } from "@/lib/picks";
import { snapshotOrder } from "@/lib/wosnap";
import { dubFor, platformKind } from "@/lib/hindidub";
import { freeIn, streamsFor } from "@/lib/streams";
import { WATCH_ORDER_OVERRIDES } from "@/data/watch-orders";

export const revalidate = 86400;
const TOP = 20;
/** Widely watched: a first anime should be one most fans know, not a cult favourite. */
const MIN_VOTES = 100_000;
/** Finishable: a complete series of up to two cours, or a film. */
const MAX_EPISODES = 26;
const y = new Date().getFullYear();

const name = (a: Anime) => WATCH_ORDER_OVERRIDES[a.slug]?.label ?? (a.titleEn && a.titleEn.length <= 45 ? a.titleEn : a.title);
const hours = (a: Anime) => ((a.episodeCount ?? 1) * (a.episodeLength ?? 24)) / 60;
const why = (p: GenrePick, a: Anime) => `${p.themes.length ? `${p.themes.join(", ")}. ` : ""}${a.subtype === "movie" ? "One film" : `${a.episodeCount} episodes`}, about ${Math.max(1, Math.round(hours(a)))} hour${Math.round(hours(a)) === 1 ? "" : "s"}. Rated ${p.score.toFixed(1)}/10 by ${p.votes.toLocaleString("en-US")} AniList members.`;

/**
 * Best anime for beginners (Google India, Nov 2026: "anime for beginners" 880 a month, "best anime for beginners" 720,
 * "best anime to watch for beginners" 210). The same ranking as /best-anime (lib/picks.ts allTimePicks), narrowed by
 * rules rather than taste: at least MIN_VOTES ratings, a franchise's starting point only, and finished with at most
 * MAX_EPISODES episodes, or a film. Long series come after, as a next step.
 */
async function load() {
  const ranked = allTimePicks(MIN_VOTES).slice(0, 200);
  const kitsu = await kitsuByAniListIds(ranked.map((p) => p.anilistId)).catch(() => new Map<number, Anime>());
  const seen = new Set<string>();
  const starts: Pick[] = [];
  const films: Pick[] = [];
  const long: Pick[] = [];
  for (const p of ranked) {
    const a = kitsu.get(p.anilistId);
    if (!a) continue;
    const root = snapshotOrder(a.id)?.root.slug ?? a.slug;
    if (root !== a.slug || seen.has(root)) continue;
    seen.add(root);
    const pick = { anime: a, why: why(p, a), score: p.score };
    if (a.subtype === "movie") films.push(pick);
    else if ((a.subtype === "TV" || a.subtype === "ONA") && a.status === "finished" && (a.episodeCount ?? 99) <= MAX_EPISODES) starts.push(pick);
    else if (a.subtype === "TV") long.push(pick);
  }
  const hindi = starts.filter((x) => dubFor(x.anime)?.status === "available");
  const free = starts.filter((x) => (dubFor(x.anime)?.platforms.some((p) => platformKind(p.name) === "free") ?? false) || (streamsFor(x.anime) ? freeIn(streamsFor(x.anime)!, "IN").length > 0 : false));
  return { top: starts.slice(0, TOP), hindi, free, films: films.slice(0, 6), long: long.slice(0, 6) };
}

export async function generateMetadata(): Promise<Metadata> {
  const { top, hindi } = await load();
  return {
    title: fitTitle([`Best Anime for Beginners (${y}): ${top.length} Easy First Anime to Watch`, `Best Anime for Beginners (${y}): ${top.length} to Start With`, `Best Anime for Beginners (${y})`]),
    description: fitDescription(`${top.length} anime to start with: widely loved, finished and short enough to finish, like ${top.slice(0, 4).map((x) => name(x.anime)).join(", ")}. Where each streams in India, ${hindi.length} with a Hindi dub, and the free legal ones.`),
    alternates: { canonical: "/best-anime-for-beginners" },
  };
}

export default async function BestAnimeForBeginners() {
  const { top, hindi, free, films, long } = await load();
  const faq: FaqItem[] = [
    ...(top[0] ? [{ q: "What is the best anime for beginners?", a: `The highest rated that are also widely watched, finished and short: ${top.slice(0, 5).map((x) => name(x.anime)).join(", ")}. ${name(top[0].anime)}: ${top[0].why}` }] : []),
    ...(hindi.length ? [{ q: "What is a good first anime to watch in Hindi?", a: `These beginner picks have an official Hindi dub: ${hindi.slice(0, 6).map((x) => name(x.anime)).join(", ")}.` }] : []),
    ...(free.length ? [{ q: "Can I watch beginner anime for free in India?", a: `Yes, legally and with ads: ${free.slice(0, 5).map((x) => name(x.anime)).join(", ")}, on official YouTube channels or Prime Video's free tier.` }] : []),
    ...(long.length ? [{ q: "Should a beginner start with One Piece or Naruto?", a: `Long series are better as a second step: they run to hundreds of episodes. Start with a short one above, then try ${long.slice(0, 3).map((x) => name(x.anime)).join(", ")}.` }] : []),
    { q: "How did you choose these?", a: `By rules, not taste: the same AniList ranking as our best anime of all time, kept to titles at least ${MIN_VOTES.toLocaleString("en-US")} members rated, only where a franchise starts, and only finished series of up to ${MAX_EPISODES} episodes (films listed separately). No ecchi. Refreshed monthly.` },
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={itemList("Best anime for beginners", top.map((x) => ({ url: `/anime/${x.anime.slug}`, name: name(x.anime) })))} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/lists", label: "Lists" }, { href: "/best-anime-for-beginners", label: "Best anime for beginners" }]}
        eyebrow="🌱 Your first anime"
        title={<>The best <span className="text-gradient">anime for beginners</span></>}
        subtitle={`${top.length} anime to start with: loved by hundreds of thousands, finished, and short enough to finish. Each with how long it takes and where to stream it in India.`}
        facts={[{ value: String(top.length), label: "to start with" }, { value: String(hindi.length), label: "in Hindi" }, { value: String(free.length), label: "free & legal" }]}
        hue={140}
        posters={top.slice(0, 3).map((x) => posterUrl(x.anime, "medium"))}
      >
        <p className="flex flex-wrap gap-2 text-sm">
          {hindi.length > 0 && <a href="#hindi" className="chip">🇮🇳 In Hindi</a>}
          {films.length > 0 && <a href="#films" className="chip">🎬 Films</a>}
          {long.length > 0 && <a href="#next" className="chip">➡️ After that</a>}
        </p>
      </PageHero>

      <section className="reveal mt-10" aria-labelledby="top-h">
        <h2 id="top-h" className="h-section mb-1">{top.length} anime to start with</h2>
        <p className="mb-4 text-sm text-muted">Highest rated first, among finished series of up to {MAX_EPISODES} episodes that at least {MIN_VOTES.toLocaleString("en-US")} AniList members rated. Streaming shown for India.</p>
        <PickList picks={top} region="IN" />
      </section>

      {hindi.length > 0 && (
        <section id="hindi" className="reveal mt-12 scroll-mt-24" aria-labelledby="hindi-h">
          <h2 id="hindi-h" className="h-section mb-1">🇮🇳 Beginner anime in Hindi</h2>
          <p className="mb-4 text-sm text-muted">The picks above with an official Hindi dub. <Link href="/hindi-dub" className="text-violet hover:underline">All Hindi dubbed anime →</Link></p>
          <PickList picks={hindi.slice(0, 8)} region="IN" compact />
        </section>
      )}

      {films.length > 0 && (
        <section id="films" className="reveal mt-12 scroll-mt-24" aria-labelledby="films-h">
          <h2 id="films-h" className="h-section mb-1">🎬 Or start with a film</h2>
          <p className="mb-4 text-sm text-muted">Two hours, no commitment. <Link href="/top/movies" className="text-violet hover:underline">Top anime movies →</Link></p>
          <PickList picks={films} region="IN" compact />
        </section>
      )}

      {long.length > 0 && (
        <section id="next" className="reveal mt-12 scroll-mt-24" aria-labelledby="next-h">
          <h2 id="next-h" className="h-section mb-1">➡️ After that: the long series</h2>
          <p className="mb-4 text-sm text-muted">Widely loved but long or still running: better once you know you like anime. Each has a <Link href="/watch-order" className="text-violet hover:underline">watch order</Link>.</p>
          <PickList picks={long} region="IN" compact />
        </section>
      )}

      <p className="mt-10 flex flex-wrap gap-2 text-sm">
        <Link href="/best-anime" className="chip">Best anime of all time</Link>
        <Link href="/short-anime" className="chip">Short anime</Link>
        <Link href="/quiz" className="chip">What should I watch?</Link>
        <Link href="/sub-vs-dub" className="chip">Sub or dub?</Link>
      </p>

      <Faq title="Best anime for beginners: FAQ" items={faq} />
    </div>
  );
}
