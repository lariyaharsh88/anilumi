import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import Faq, { type FaqItem } from "@/components/Faq";
import AnswerLead from "@/components/AnswerLead";
import MadeBy from "@/components/MadeBy";
import { itemList } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { GEMS_UPDATED, GEM_RULES, gems, gemsIn, gemMovies, hitPopularity, formatLabel, type Gem } from "@/lib/underrated";

export const revalidate = 86400;

const y = new Date().getFullYear();
const fmt = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const k = (n: number) => (n >= 1000 ? `${Math.round(n / 1000)}K` : String(n));
const list = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}` : xs[0] ?? "");
const GENRES = ["Drama", "Comedy", "Romance", "Sports", "Fantasy", "Sci-Fi", "Psychological", "Slice of Life"];

export function generateMetadata(): Metadata {
  const all = gems();
  return {
    title: fitTitle([`Underrated Anime: ${all.length} Hidden Gems Fans Rate Highly (${y})`, `Underrated Anime (${y}): ${all.length} Hidden Gems`, `Underrated Anime: Hidden Gems to Watch (${y})`, "Underrated Anime"]),
    description: fitDescription(`${all.length} underrated anime that fans score ${GEM_RULES.minScore}+ but few have watched, from ${all.slice(0, 3).map((g) => g.t).join(", ")} to hidden films, by genre, with where to watch each.`),
    alternates: { canonical: "/underrated-anime" },
  };
}

function Card({ g, rank }: { g: Gem; rank?: number }) {
  return (
    <li className="card flex gap-3 p-3">
      <span className="relative h-24 w-16 shrink-0 overflow-hidden rounded-lg bg-bg-2">{g.i && <Image src={g.i} alt={g.t} fill sizes="64px" className="object-cover" />}</span>
      <div className="min-w-0 text-sm">
        <Link href={`/anime/${g.k}`} className="font-semibold text-ink hover:text-violet-2 hover:underline">{rank ? `${rank}. ` : ""}{g.t}</Link>
        {g.r && <p className="truncate text-xs text-muted">{g.r}</p>}
        <p className="mt-1 text-xs text-muted">{formatLabel(g.f)}{g.y ? ` · ${g.y}` : ""}{g.f !== "MOVIE" && g.e ? ` · ${g.e} ep` : ""}{g.c === "CN" ? " · Chinese" : g.c === "KR" ? " · Korean" : ""}</p>
        <p className="mt-1.5 flex flex-wrap items-center gap-1.5">
          <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">★ {g.s}/100</span>
          <span className="rounded-full bg-white/[.06] px-2 py-0.5 text-[11px] text-ink/80">{k(g.p)} members</span>
        </p>
        <p className="mt-1.5 text-xs text-muted">{[...g.g.slice(0, 3), ...g.tags.slice(0, 2)].join(" · ")}</p>
      </div>
    </li>
  );
}

/** High-rated anime few have watched: the top picks, by genre and films, from AniList scores and member counts. */
export default function UnderratedAnimePage() {
  const all = gems();
  const top = all.slice(0, 24);
  const hits = hitPopularity(10);
  const movies = gemMovies();
  const byGenre = GENRES.map((g) => ({ g, rows: gemsIn(g) })).filter((x) => x.rows.length >= 3);
  const fewest = [...all].filter((g) => g.s >= 80).sort((a, b) => a.p - b.p)[0];

  const faq: FaqItem[] = [
    { q: "What is the most underrated anime?", a: `By our measure, ${all[0].t} (${all[0].y}): AniList members score it ${all[0].s}/100, yet only about ${k(all[0].p)} have it on their list. ${all[1] ? `Next come ${list(all.slice(1, 4).map((g) => `${g.t} (${g.s})`))}.` : ""}` },
    { q: "How do you decide an anime is underrated?", a: `It needs an average AniList score of ${GEM_RULES.minScore} or more from at least ${k(GEM_RULES.minPopularity)} members, but fewer than ${k(GEM_RULES.maxPopularity)} members in total. For comparison, the ten most-watched anime each have over ${k(hits)}. We count first seasons and stand-alone films only, and leave out anything from this year as too new to judge.` },
    ...(fewest ? [{ q: "Which highly rated anime has the fewest viewers?", a: `${fewest.t} (${fewest.y}): rated ${fewest.s}/100 by only about ${k(fewest.p)} AniList members.` }] : []),
    ...(movies.length ? [{ q: "What are some underrated anime movies?", a: `${list(movies.slice(0, 5).map((g) => `${g.t} (${g.y}, ${g.s}/100)`))}.` }] : []),
    { q: "Where can I watch these underrated anime?", a: "Open any title: its AniLumi page lists every legal place it streams in your country, with sub and dub." },
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={itemList("Underrated anime", top.map((g) => ({ url: `/anime/${g.k}`, name: g.t })))} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/lists", label: "Lists" }, { href: "/underrated-anime", label: "Underrated anime" }]}
        eyebrow="💎 Hidden gems"
        title={<>Underrated anime: <span className="text-gradient">hidden gems fans rate highly</span></>}
        subtitle={`${all.length} anime that score ${GEM_RULES.minScore}+ with the fans who've seen them, but have a fraction of the audience of the big hits.`}
        facts={[
          { value: String(all.length), label: "hidden gems" },
          { value: `${GEM_RULES.minScore}+`, label: "fan score" },
          { value: `<${k(GEM_RULES.maxPopularity)}`, label: "members each" },
          { value: `${k(hits)}+`, label: "for the top 10 hits" },
        ]}
        hue={170}
      >
        <p className="flex flex-wrap gap-2 text-sm">
          <Link href="/top/rated" className="chip">Top rated anime</Link>
          <Link href="/what-anime-should-i-watch" className="chip">What should I watch?</Link>
          <Link href="/random-anime-generator" className="chip">🎲 Random anime</Link>
        </p>
      </PageHero>

      <AnswerLead checked={fmt(GEMS_UPDATED)}>
        The most underrated anime by fan score are {list(all.slice(0, 5).map((g) => `${g.t} (${g.s}/100)`))}. Each is rated {GEM_RULES.minScore}+ on AniList but has fewer than {k(GEM_RULES.maxPopularity)} members, while the ten most-watched anime each have over {k(hits)}.
      </AnswerLead>

      <section className="reveal pt-10" aria-labelledby="top-h">
        <h2 id="top-h" className="h-section mb-1">The {top.length} most underrated anime</h2>
        <p className="mb-4 max-w-3xl text-sm text-muted">Highest fan score first; when two tie, the one fewer people have seen ranks higher.</p>
        <ol className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{top.map((g, i) => <Card key={g.id} g={g} rank={i + 1} />)}</ol>
      </section>

      {movies.length >= 3 && (
        <section className="reveal pt-10" aria-labelledby="films-h">
          <h2 id="films-h" className="h-section mb-4">Underrated anime films</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">{movies.map((g) => <Card key={g.id} g={g} />)}</ul>
        </section>
      )}

      {byGenre.map(({ g, rows }) => (
        <section key={g} className="reveal pt-10" aria-labelledby={`g-${g}`}>
          <h2 id={`g-${g}`} className="h-section mb-4">Underrated {g.toLowerCase()} anime</h2>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">{rows.map((x) => <Card key={x.id} g={x} />)}</ul>
        </section>
      ))}

      <MadeBy className="mt-8" path="/underrated-anime" method={`Built from AniList: average score ${GEM_RULES.minScore}+ from at least ${k(GEM_RULES.minPopularity)} members, under ${k(GEM_RULES.maxPopularity)} members in total, first seasons and stand-alone films only, nothing from this year, no adult titles.`} date={GEMS_UPDATED} />
      <Faq title="Underrated anime: FAQ" items={faq} />
    </div>
  );
}
