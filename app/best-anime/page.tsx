import type { Metadata } from "next";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import Faq, { type FaqItem } from "@/components/Faq";
import PickList, { type Pick } from "@/components/PickList";
import JoinChannels from "@/components/JoinChannels";
import { itemList } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { kitsuByAniListIds, posterUrl, type Anime } from "@/lib/kitsu";
import { allTimePicks, type GenrePick } from "@/lib/picks";
import { snapshotOrder } from "@/lib/wosnap";
import { dubFor, platformKind } from "@/lib/hindidub";
import { freeIn, servicesIn, streamsFor } from "@/lib/streams";
import { WATCH_ORDER_OVERRIDES } from "@/data/watch-orders";

export const revalidate = 86400;
const TOP = 50;
const y = new Date().getFullYear();

const why = (p: GenrePick) => `${p.themes.length ? `${p.themes.join(", ")}. ` : ""}Rated ${p.score.toFixed(1)}/10 by ${p.votes.toLocaleString("en-US")} AniList members.`;
const name = (a: Anime) => WATCH_ORDER_OVERRIDES[a.slug]?.label ?? (a.titleEn && a.titleEn.length <= 45 ? a.titleEn : a.title);

/**
 * The best anime of all time from the AniList snapshot (lib/picks.ts allTimePicks), one entry per franchise and only
 * where you'd start it, with India streaming and Hindi dubs. Then the same list cut for Indian viewers: in Hindi,
 * free and legal, short, and films.
 */
async function load() {
  const ranked = allTimePicks();
  const kitsu = await kitsuByAniListIds(ranked.slice(0, 250).map((p) => p.anilistId)).catch(() => new Map<number, Anime>());
  const seen = new Set<string>();
  const all: Pick[] = [];
  for (const p of ranked.slice(0, 250)) {
    const a = kitsu.get(p.anilistId);
    if (!a) continue;
    const root = snapshotOrder(a.id)?.root.slug ?? a.slug;
    // A sequel's score speaks for the series, but nobody should start Attack on Titan at Season 3.
    if (root !== a.slug || seen.has(root)) continue;
    seen.add(root);
    all.push({ anime: a, why: why(p), score: p.score });
  }
  const top = all.slice(0, TOP);
  const hindi = all.filter((x) => dubFor(x.anime)?.status === "available");
  const freeHindi = (x: Pick) => dubFor(x.anime)?.platforms.some((p) => platformKind(p.name) === "free") ?? false;
  const free = all.filter((x) => freeHindi(x) || (streamsFor(x.anime) ? freeIn(streamsFor(x.anime)!, "IN").length > 0 : false));
  const short = all.filter((x) => x.anime.subtype === "TV" && (x.anime.episodeCount ?? 99) <= 13);
  const movies = all.filter((x) => x.anime.subtype === "movie");
  return { top, hindi, free, short, movies };
}

export async function generateMetadata(): Promise<Metadata> {
  const { top, hindi } = await load();
  return {
    title: fitTitle([`Best Anime of All Time (${y}): Top ${TOP} Ranked, Where to Watch in India`, `Best Anime of All Time (${y}): Top ${TOP} Ranked & Where to Watch`, `Best Anime of All Time (${y}): Top ${TOP}`]),
    description: fitDescription(`The ${TOP} best anime ever, ranked by AniList score weighted by how many rated them: ${top.slice(0, 4).map((x) => name(x.anime)).join(", ")} and more. Where each streams in India, ${hindi.length} with a Hindi dub, and the free legal ones.`),
    alternates: { canonical: "/best-anime" },
  };
}

export default async function BestAnime() {
  const { top, hindi, free, short, movies } = await load();
  const inIndia = (x: Pick) => { const s = streamsFor(x.anime); return s ? [...new Set(servicesIn(s, "IN").filter((v) => v.kind !== "buy").map((v) => v.service))] : []; };
  const faq: FaqItem[] = [
    ...(top[0] ? [{ q: "What is the best anime of all time?", a: `By AniList score weighted by how many people rated it: ${top.slice(0, 5).map((x, i) => `${i + 1}. ${name(x.anime)} (${x.score?.toFixed(1)})`).join(", ")}. ${name(top[0].anime)}: ${top[0].why}` }] : []),
    ...(hindi.length ? [{ q: "What is the best anime to watch in Hindi?", a: `The highest rated with an official Hindi dub: ${hindi.slice(0, 6).map((x) => name(x.anime)).join(", ")}.` }] : []),
    ...(free.length ? [{ q: "Which of the best anime can I watch free in India?", a: `Legally and free with ads: ${free.slice(0, 6).map((x) => name(x.anime)).join(", ")}, on official YouTube channels or MX Player (Prime Video's free tier).` }] : []),
    ...(top[0] ? [{ q: `Where can I watch ${name(top[0].anime)} in India?`, a: inIndia(top[0]).length ? `On ${inIndia(top[0]).join(", ")}.` : "We found no legal streaming service for it in India; check its page for the latest." }] : []),
    { q: "How is this ranking made?", a: "From AniList scores, weighted towards the average for titles fewer people rated, so a 9.0 from a few thousand fans doesn't outrank an 8.8 from half a million. Only titles at least 25,000 members scored, one entry per franchise at its starting point, and no ecchi. Refreshed monthly." },
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={itemList("Best anime of all time", top.map((x) => ({ url: `/anime/${x.anime.slug}`, name: name(x.anime) })))} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/lists", label: "Lists" }, { href: "/best-anime", label: "Best anime of all time" }]}
        eyebrow="🏆 All-time ranking"
        title={<>The best <span className="text-gradient">anime of all time</span></>}
        subtitle={`The ${TOP} highest-rated anime ever, each with what it's about, how long it is and where to stream it in India, plus which are dubbed in Hindi and which you can watch free.`}
        facts={[{ value: String(TOP), label: "ranked" }, { value: String(hindi.length), label: "in Hindi" }, { value: String(free.length), label: "free & legal" }]}
        hue={45}
        posters={top.slice(0, 3).map((x) => posterUrl(x.anime, "medium"))}
      >
        <p className="flex flex-wrap gap-2 text-sm">
          <a href="#hindi" className="chip">🇮🇳 Best in Hindi</a>
          <a href="#free" className="chip">🆓 Free & legal</a>
          <a href="#short" className="chip">⏱ Short</a>
          <a href="#movies" className="chip">🎬 Movies</a>
        </p>
      </PageHero>

      <section className="reveal mt-10" aria-labelledby="top-h">
        <h2 id="top-h" className="h-section mb-1">Top {TOP} anime of all time</h2>
        <p className="mb-4 text-sm text-muted">Ranked by AniList score, weighted so a high score from a few thousand people doesn&apos;t outrank one from hundreds of thousands. Streaming shown for India.</p>
        <PickList picks={top} region="IN" />
      </section>

      {hindi.length > 0 && (
        <section id="hindi" className="reveal mt-12 scroll-mt-24" aria-labelledby="hindi-h">
          <h2 id="hindi-h" className="h-section mb-1">🇮🇳 The best anime to watch in Hindi</h2>
          <p className="mb-4 text-sm text-muted">The highest rated with an official Hindi dub. <Link href="/hindi-dub" className="text-violet hover:underline">All Hindi dubbed anime →</Link></p>
          <PickList picks={hindi.slice(0, 10)} region="IN" compact />
          <JoinChannels source="best-anime" className="mt-5" />
        </section>
      )}

      {free.length > 0 && (
        <section id="free" className="reveal mt-12 scroll-mt-24" aria-labelledby="free-h">
          <h2 id="free-h" className="h-section mb-1">🆓 The best anime you can watch free, legally</h2>
          <p className="mb-4 text-sm text-muted">On the licensors&rsquo; own YouTube channels or MX Player (Prime Video&rsquo;s free tier), with ads. <Link href="/anime-streaming-sites" className="text-violet hover:underline">Every legal streaming site in India →</Link></p>
          <PickList picks={free.slice(0, 8)} region="IN" compact />
        </section>
      )}

      {short.length > 0 && (
        <section id="short" className="reveal mt-12 scroll-mt-24" aria-labelledby="short-h">
          <h2 id="short-h" className="h-section mb-1">⏱ The best short anime: 13 episodes or fewer</h2>
          <p className="mb-4 text-sm text-muted">Done in a weekend. <Link href="/short-anime" className="text-violet hover:underline">More short anime →</Link></p>
          <PickList picks={short.slice(0, 8)} region="IN" compact />
        </section>
      )}

      {movies.length > 0 && (
        <section id="movies" className="reveal mt-12 scroll-mt-24" aria-labelledby="movies-h">
          <h2 id="movies-h" className="h-section mb-1">🎬 The best anime movies</h2>
          <p className="mb-4 text-sm text-muted"><Link href="/top/movies" className="text-violet hover:underline">Top anime movies →</Link></p>
          <PickList picks={movies.slice(0, 8)} region="IN" compact />
        </section>
      )}

      <p className="mt-10 flex flex-wrap gap-2 text-sm">
        <Link href="/top/rated" className="chip">Highest rated anime (updated daily)</Link>
        <Link href="/genre" className="chip">Best anime by genre</Link>
        <Link href="/similar" className="chip">Anime like your favourite</Link>
        <Link href="/quiz" className="chip">What should I watch?</Link>
      </p>

      <Faq title="Best anime of all time: FAQ" items={faq} />
    </div>
  );
}
