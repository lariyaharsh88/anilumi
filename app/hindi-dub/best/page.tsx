import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import Faq from "@/components/Faq";
import JoinChannels from "@/components/JoinChannels";
import JsonLd from "@/components/JsonLd";
import MadeBy from "@/components/MadeBy";
import SectionNav from "@/components/fx/SectionNav";
import { animeBySlugs, posterUrl, type Anime } from "@/lib/kitsu";
import { cheapestKind } from "@/lib/hindistats";
import { itemList } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { dubDate, dubHref, hindiDubbed, platformFor, type Dub } from "@/lib/hindidub";
import { regionalFor } from "@/lib/regionaldub";

export const revalidate = 86400;

/**
 * The best anime with an official Hindi dub, ranked by fan score. "best hindi dubbed anime" and "best anime in hindi
 * dubbed" about 2.6K a month together (Keyword Planner, India, Nov 2026), answered today by undated "top 10" lists;
 * this ranks every title the Hindi data confirms, with where each streams. A title needs MIN_USERS Kitsu members so
 * a handful of votes can't top the list.
 */
const MIN_USERS = 2000;
type Ranked = { d: Dub; a: Anime; score: number };

async function ranked(): Promise<Ranked[]> {
  const dubs = hindiDubbed();
  const kitsu = await animeBySlugs(dubs.map((d) => d.s));
  return dubs
    .flatMap((d) => { const a = kitsu.get(d.s); return a?.rating && a.userCount >= MIN_USERS ? [{ d, a, score: a.rating }] : []; })
    .sort((x, y) => y.score - x.score);
}
const score10 = (r: number) => (r / 10).toFixed(1);
const where = (d: Dub) => [...new Set(d.platforms.map((p) => p.name.replace(/ \(.*\)$/, "")))].slice(0, 3).join(", ");
/** Minutes to watch the whole entry (Kitsu's total, else episodes × length). Pure. */
const minutes = (a: Anime) => a.totalLength || (a.episodeCount && a.episodeLength ? a.episodeCount * a.episodeLength : null);
const hours = (m: number) => (m < 90 ? `${Math.round(m)} min` : `~${Math.round(m / 60)} h`);
/**
 * Binge by length, for the winter break and weekends ("anime to binge watch", and AI answers to "short anime in
 * Hindi to finish over the holidays"): finished titles only, so each one can be watched to the end. Counts are the
 * Kitsu entry the Hindi page covers (usually the first season).
 */
const LENGTHS: { id: string; label: string; note: string; fits: (a: Anime) => boolean }[] = [
  { id: "sitting", label: "One sitting", note: "Films", fits: (a) => a.subtype === "movie" },
  { id: "weekend", label: "A weekend", note: "Up to 13 episodes", fits: (a) => a.subtype !== "movie" && (a.episodeCount ?? 99) <= 13 },
  { id: "week", label: "A week of the holidays", note: "14 to 26 episodes", fits: (a) => a.subtype !== "movie" && (a.episodeCount ?? 0) >= 14 && (a.episodeCount ?? 0) <= 26 },
  { id: "break", label: "The whole winter break", note: "27 to 75 episodes", fits: (a) => a.subtype !== "movie" && (a.episodeCount ?? 0) >= 27 && (a.episodeCount ?? 0) <= 75 },
];
const kindLabel = { free: "Free", subscription: "Paid", tv: "TV" } as const;

export async function generateMetadata(): Promise<Metadata> {
  const list = await ranked().catch(() => []);
  const y = new Date().getFullYear();
  const free = list.filter((r) => cheapestKind(r.d) === "free").length;
  return {
    title: fitTitle([`Best Hindi Dubbed Anime (${y}): Top ${list.length} Ranked by Fans`, `Best Hindi Dubbed Anime (${y}), Ranked`, "Best Hindi Dubbed Anime"]),
    description: fitDescription(`The ${list.length} best anime with an official Hindi dub, ranked by fan score: ${list.slice(0, 4).map((r) => r.d.t).join(", ")} and more, with where each streams in India and the ${free} free ones. Checked ${dubDate()}.`),
    alternates: { canonical: "/hindi-dub/best" },
  };
}

/** Every Hindi dubbed anime ranked by Kitsu fan score, with the platform and whether it's free. */
export default async function BestHindiDubbed() {
  const list = await ranked();
  const free = list.filter((r) => cheapestKind(r.d) === "free");
  const movies = list.filter((r) => r.a.subtype === "movie");
  const top = list.slice(0, 10);
  const done = list.filter((r) => r.a.status === "finished" && minutes(r.a));
  const binge = LENGTHS.map((L) => ({ ...L, items: done.filter((r) => L.fits(r.a)).slice(0, 8) })).filter((b) => b.items.length >= 3);
  const langs = (r: Ranked) => (["ta", "te"] as const).filter((l) => regionalFor({ id: r.a.id, slug: r.d.s }, l)).map((l) => (l === "ta" ? "Tamil" : "Telugu"));
  const faq = [
    ...binge.filter((b) => b.id === "weekend" || b.id === "week").map((b) => ({ q: b.id === "weekend" ? "Which Hindi dubbed anime can I finish in a weekend?" : "What Hindi dubbed anime can I binge over the holidays?", a: `${b.items.slice(0, 5).map((r) => `${r.d.t} (${r.a.episodeCount} episodes, ${hours(minutes(r.a)!)}, ${where(r.d)})`).join(", ")}. All are finished, with an official Hindi dub.` })),
    { q: "What is the best anime in Hindi dubbed?", a: `By fan score, ${top.slice(0, 5).map((r) => `${r.d.t} (${score10(r.score)}/10, ${where(r.d)})`).join(", ")}.` },
    ...(free.length ? [{ q: "Which good anime are free in Hindi?", a: `${free.slice(0, 6).map((r) => `${r.d.t} (${where(r.d)})`).join(", ")}${free.length > 6 ? ` and ${free.length - 6} more` : ""}, all official and free with ads.` }] : []),
    ...(movies.length ? [{ q: "What is the best anime movie in Hindi?", a: `${movies.slice(0, 4).map((r) => `${r.d.t} (${score10(r.score)}/10, ${where(r.d)})`).join(", ")}. Every film is on the anime movies in Hindi page.` }] : []),
    { q: "How is this list ranked?", a: `By Kitsu's average fan score, out of 10, for every anime with a Hindi dub that an official platform confirms and at least ${MIN_USERS.toLocaleString("en-US")} fans rating it. It's taste, averaged: a high score means fans who watched it rated it well, not that everyone will.` },
  ];
  const Row = ({ r, i }: { r: Ranked; i: number }) => (
    <li className="card flex items-center gap-3 p-2.5">
      <span className="w-7 shrink-0 text-center text-sm font-bold text-muted">{i + 1}</span>
      <span className="relative h-16 w-11 shrink-0 overflow-hidden rounded bg-bg-2">{posterUrl(r.a, "tiny") && <Image src={posterUrl(r.a, "tiny")!} alt={`${r.d.t} poster`} fill sizes="44px" className="object-cover" />}</span>
      <span className="min-w-0 flex-1">
        <Link href={dubHref(r.d)} className="font-semibold text-ink hover:text-violet-2">{r.d.t}</Link>
        <span className="block text-xs text-muted">{r.a.subtype === "movie" ? "Film" : `${r.a.episodeCount ?? "?"} episodes`} · {where(r.d)}</span>
      </span>
      <span className="shrink-0 text-right">
        <span className="block text-sm font-bold text-ink">★ {score10(r.score)}</span>
        <span className={`text-[11px] font-semibold ${cheapestKind(r.d) === "free" ? "text-emerald-400" : "text-muted"}`}>{kindLabel[cheapestKind(r.d)]}</span>
      </span>
    </li>
  );

  return (
    <div className="container-x pb-8">
      <JsonLd data={itemList("Best Hindi dubbed anime", list.map((r) => ({ url: dubHref(r.d), name: `${r.d.t} (Hindi dub)` })))} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/hindi-dub", label: "Hindi dubbed anime" }, { href: "/hindi-dub/best", label: "Best" }]}
        eyebrow="🇮🇳 Hindi dub"
        title={<>Best <span className="text-gradient">Hindi dubbed</span> anime</>}
        subtitle="Every anime with an official Hindi dub, ranked by what fans scored it, with where it streams in India and which ones are free."
        facts={[
          { value: String(list.length), label: "ranked" },
          { value: String(free.length), label: "free to watch" },
          ...(top[0] ? [{ value: `★ ${score10(top[0].score)}`, label: `#1: ${top[0].d.t}` }] : []),
        ]}
        hue={25}
        posters={top.slice(0, 3).map((r) => posterUrl(r.a, "medium"))}
      />
      <MadeBy className="mt-4" method={`Hindi dubs are confirmed on each platform's own page or the licensor's announcement; scores are Kitsu's fan averages, for titles with at least ${MIN_USERS.toLocaleString("en-US")} members.`} />

      <SectionNav sections={[
        { id: "list", label: `All ${list.length}` },
        ...(free.length ? [{ id: "free", label: "Best free" }] : []),
        ...(binge.length ? [{ id: "binge", label: "By length" }] : []),
        { id: "faq", label: "FAQ" },
      ]} />

      <section id="list" data-section className="reveal pt-10" aria-labelledby="list-h">
        <h2 id="list-h" className="h-section mb-1">The {list.length} best Hindi dubbed anime, ranked</h2>
        <p className="mb-4 text-sm text-muted">Checked {dubDate()}. Each title links to its Hindi dub details: which seasons, which platform, how to switch the audio.</p>
        <ol className="grid gap-2 lg:grid-cols-2">{list.map((r, i) => <Row key={r.d.s} r={r} i={i} />)}</ol>
      </section>

      {free.length > 0 && (
        <section id="free" data-section className="reveal pt-10" aria-labelledby="free-h">
          <h2 id="free-h" className="h-section mb-1">The best ones you can watch free</h2>
          <p className="mb-4 text-sm text-muted">Official and free with ads, mostly on YouTube channels run by the licensors. <Link href="/hindi-dub#free" className="text-violet hover:underline">All free Hindi anime →</Link></p>
          <ol className="grid gap-2 lg:grid-cols-2">{free.slice(0, 12).map((r, i) => <Row key={r.d.s} r={r} i={i} />)}</ol>
        </section>
      )}

      {binge.length > 0 && (
        <section id="binge" data-section className="reveal pt-10" aria-labelledby="binge-h">
          <h2 id="binge-h" className="h-section mb-1">Binge by length: what fits your weekend or holidays</h2>
          <p className="mb-4 text-sm text-muted">Finished series and films with an official Hindi dub, best-rated first, grouped by how long they take to watch. Tamil and Telugu show where those dubs exist too.</p>
          <div className="grid gap-4 lg:grid-cols-2">
            {binge.map((b) => (
              <div key={b.id} className="card p-4">
                <h3 className="font-semibold text-ink">{b.label} <span className="text-sm font-normal text-muted">· {b.note}</span></h3>
                <ol className="mt-2 space-y-1.5 text-sm">
                  {b.items.map((r) => (
                    <li key={r.d.s} className="flex items-baseline justify-between gap-3">
                      <span className="min-w-0"><Link href={dubHref(r.d)} className="font-medium text-ink hover:text-violet-2">{r.d.t}</Link>{langs(r).length > 0 && <span className="ml-1.5 text-xs text-muted">+ {langs(r).join(", ")}</span>}</span>
                      <span className="shrink-0 tabular-nums text-xs text-muted">{r.a.subtype === "movie" ? "" : `${r.a.episodeCount} ep · `}{hours(minutes(r.a)!)} · ★ {score10(r.score)}</span>
                    </li>
                  ))}
                </ol>
              </div>
            ))}
          </div>
          <p className="mt-3 flex flex-wrap gap-2 text-sm"><Link href="/tamil-dub" className="chip">All Tamil dubs</Link><Link href="/telugu-dub" className="chip">All Telugu dubs</Link></p>
        </section>
      )}

      <p className="mt-10 flex flex-wrap gap-2 text-sm">
        <Link href="/hindi-dub/movies" className="chip">🎬 Anime movies in Hindi</Link>
        <Link href="/hindi-dub/this-week" className="chip">📅 This week&apos;s Hindi episodes</Link>
        <Link href="/new-dubs" className="chip">New Hindi dubs</Link>
        {[...new Map(list.flatMap((r) => r.d.platforms.flatMap((p) => { const pf = platformFor(p.name); return pf ? [[pf.slug, pf] as const] : []; }))).values()].slice(0, 5).map((pf) => <Link key={pf.slug} href={`/hindi-dub/${pf.slug}`} className="chip">{pf.label}</Link>)}
      </p>

      <JoinChannels source="hindi-best" className="mt-8" />
      <div id="faq" data-section className="pt-2"><Faq title="Best Hindi dubbed anime: FAQ" items={faq} /></div>
    </div>
  );
}
