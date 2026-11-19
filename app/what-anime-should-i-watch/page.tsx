import type { Metadata } from "next";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import Faq, { type FaqItem } from "@/components/Faq";
import AnimePicker from "@/components/AnimePicker";
import { webPage } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { kitsuByAniListIds, posterUrl, type Anime } from "@/lib/kitsu";
import { allTimePicks } from "@/lib/picks";
import { alAnime } from "@/lib/alsnap";
import { snapshotOrder } from "@/lib/wosnap";
import { dubFor, platformKind } from "@/lib/hindidub";
import { freeIn, streamsFor } from "@/lib/streams";
import { MOODS, moodsOf, type PickItem } from "@/lib/picker";

export const revalidate = 86400;

/**
 * "What anime should I watch?" (Keyword Planner, Nov 2026: 2,900 a month in the US, 390 in India and rising): four
 * taps, three picks with reasons. The catalog is the /best-anime ranking (lib/picks.ts allTimePicks), one entry per
 * franchise (its starting point) plus films, joined with Kitsu, Hindi dub and free-streaming data; the picker
 * filters it in the browser (lib/picker.ts).
 */
const CATALOG = 260;
async function catalog(): Promise<PickItem[]> {
  const ranked = allTimePicks(10000).slice(0, 420);
  const kitsu = await kitsuByAniListIds(ranked.map((p) => p.anilistId)).catch(() => new Map<number, Anime>());
  const seen = new Set<string>();
  const out: PickItem[] = [];
  for (const p of ranked) {
    const a = kitsu.get(p.anilistId);
    if (!a || out.length >= CATALOG) continue;
    if (a.subtype !== "movie") {
      const root = snapshotOrder(a.id)?.root.slug ?? a.slug;
      if (root !== a.slug || seen.has(root)) continue;
      seen.add(root);
    }
    const al = alAnime(p.anilistId);
    const dub = dubFor(a);
    const hi = dub?.status === "available" ? [...new Set(dub.platforms.map((x) => x.name.replace(/ \(.*\)$/, "")))].slice(0, 2) : [];
    const streams = streamsFor(a);
    const free = (dub?.status === "available" && dub.platforms.some((x) => platformKind(x.name) === "free")) || (streams ? freeIn(streams, "IN").length > 0 : false);
    out.push({
      s: a.slug, t: a.titleEn && a.titleEn.length <= a.title.length ? a.titleEn : a.title, p: posterUrl(a, "small"),
      y: a.startDate ? Number(a.startDate.slice(0, 4)) : null, sub: a.subtype ?? "TV", st: a.status,
      e: a.episodeCount, min: a.episodeCount && a.episodeLength ? a.episodeCount * a.episodeLength : null,
      sc: p.score, moods: moodsOf(al?.g ?? [], (al?.t ?? []).filter((t) => t.rank >= 60).map((t) => t.name)), hi, free, why: p.themes,
    });
  }
  return out;
}

export async function generateMetadata(): Promise<Metadata> {
  const items = await catalog().catch(() => []);
  return {
    title: fitTitle(["What Anime Should I Watch? 3 Picks in 4 Taps (Free)", "What Anime Should I Watch? Get 3 Picks"]),
    description: fitDescription(`Answer 4 quick questions (mood, time, finished or airing, Hindi dub or free) and get 3 anime picks from the ${items.length || 250} best-rated titles, with where to watch in India.`),
    alternates: { canonical: "/what-anime-should-i-watch" },
  };
}

/** The picker, plus crawlable "best by mood" lists from the same catalog. */
export default async function WhatAnimeShouldIWatch() {
  const items = await catalog();
  const byMood = MOODS.map((m) => ({ m, top: items.filter((x) => x.moods.includes(m.key)).slice(0, 5) })).filter((g) => g.top.length >= 3);
  const hindi = items.filter((x) => x.hi.length).length;
  const faq: FaqItem[] = [
    { q: "How does the picker choose?", a: `From the ${items.length} best-rated anime on AniList (one per franchise, plus films), ranked by fan score weighted by how many people rated them. Your answers filter that list, and the best-rated matches come first.` },
    { q: "Can I get anime with a Hindi dub?", a: `Yes: pick "Hindi dub" in the last question. ${hindi} of the titles have an official Hindi dub, and each pick says where it streams. "Free only" keeps titles with a free, legal option in India.` },
    { q: "What if nothing matches?", a: "If fewer than 3 titles match every answer, the picker drops the least important ones (free only, then finished only, then length) and says so, so you always get something to watch." },
    { q: "Is it free?", a: "Yes, with no sign-up. It runs in your browser and doesn't store your answers." },
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={webPage("WebPage", "/what-anime-should-i-watch", "What anime should I watch?")} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/what-anime-should-i-watch", label: "What anime should I watch?" }]}
        eyebrow="🎯 Free tool"
        title={<>What anime <span className="text-gradient">should I watch?</span></>}
        subtitle="Four quick questions, three picks with reasons, and where to watch each one in India. Hindi dub and free-only filters included."
        facts={[{ value: String(items.length), label: "top-rated titles" }, { value: String(hindi), label: "with a Hindi dub" }, { value: "4", label: "taps" }]}
        hue={265}
      />

      <section className="reveal mt-8" aria-label="Anime picker"><AnimePicker items={items} /></section>

      <section className="reveal mt-12" aria-labelledby="mood-h">
        <h2 id="mood-h" className="h-section mb-3">Best anime by mood</h2>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {byMood.map(({ m, top }) => (
            <div key={m.key} className="card p-4">
              <h3 className="font-semibold text-ink">{m.emoji} {m.label}</h3>
              <ol className="mt-2 space-y-1 text-sm">
                {top.map((x, i) => <li key={x.s}><span className="text-muted">{i + 1}.</span> <Link href={`/anime/${x.s}`} className="text-ink/90 hover:text-violet-2">{x.t}</Link> <span className="text-xs text-muted">★ {x.sc.toFixed(1)}{x.hi.length ? " · Hindi" : ""}</span></li>)}
              </ol>
            </div>
          ))}
        </div>
      </section>

      <p className="mt-10 flex flex-wrap gap-2 text-sm">
        <Link href="/quiz" className="chip">More options (era, intensity, English dub): 30-second quiz</Link>
        <Link href="/best-anime-for-beginners" className="chip">Best anime for beginners</Link>
        <Link href="/random-anime-generator" className="chip">Random anime generator</Link>
        <Link href="/hindi-dub/best" className="chip">Best Hindi dubbed anime</Link>
        <Link href="/tonight" className="chip">Anime you can finish tonight</Link>
      </p>

      <Faq title="What anime should I watch: FAQ" items={faq} />
    </div>
  );
}
