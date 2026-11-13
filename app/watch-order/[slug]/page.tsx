import { fitDescription } from "@/lib/titles";
import type { Metadata } from "next";
import EditorWatched from "@/components/EditorWatched";
import Link from "@/components/Link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getAnimeBySlug, buildWatchOrder, franchiseName, watchOrderSlug, animePath, posterUrl, fmtMinutes, runtimeMinutes, subtypeLabel, getStreamingFor, getProductions, WatchEntry } from "@/lib/kitsu";
import { abs } from "@/lib/site";
import { AUTHOR } from "@/lib/author";
import BingePlan from "@/components/BingePlan";
import HindiDub from "@/components/HindiDub";
import { dubFor, dubFaq } from "@/lib/hindidub";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import CheckedBy, { DraftLabel } from "@/components/CheckedBy";
import { robotsFor, watchOrderIndexed } from "@/lib/indexing";
import { webPage, workRef, reviewedBy } from "@/lib/ld";
import Faq from "@/components/Faq";
import AdSlot from "@/components/AdSlot";
import WatchChecklist from "@/components/WatchChecklist";
import { hasHindi, hindiIndexed, hindiPath } from "@/lib/hindi";
import { noteFor } from "@/data/notes";
import { affiliateRel, streamLink } from "@/lib/affiliate";
import AmazonLink from "@/components/AmazonLink";
import AffiliateNote from "@/components/AffiliateNote";
import { streamCoverage, oneLinkPerSite } from "@/lib/wostreams";
import { fillerFor } from "@/lib/filler";
import { timelineFor } from "@/lib/timeline";
import { adaptationFor, shortRange } from "@/lib/mangaseasons";
import BarChart from "@/components/viz/BarChart";
import LineChart from "@/components/viz/LineChart";

export const revalidate = 604800;
// Render on first request, then serve from the ISR cache until revalidated.
export async function generateStaticParams() { return []; }
type Props = { params: Promise<{ slug: string }> };

const KIND_LABEL: Record<WatchEntry["kind"], string> = { main: "Main", movie: "Movie", side: "Side story", recap: "Recap", spinoff: "Spin-off", alt: "Alt. version" };
const KIND_CLASS: Record<WatchEntry["kind"], string> = { main: "bg-accent-strong text-snow", movie: "bg-violet-strong text-snow", side: "bg-bg-2 text-ink", recap: "bg-line text-muted line-through", spinoff: "bg-bg-2 text-ink", alt: "bg-line text-muted" };

/** Drop the shared franchise prefix so sibling entries stay distinguishable in narrow labels. */
function shortTitle(title: string, franchise: string) {
  if (title === franchise || !title.toLowerCase().startsWith(franchise.toLowerCase())) return title;
  const rest = title.slice(franchise.length).replace(/^[\s:：\-–—]+/, "").trim();
  return rest ? rest.charAt(0).toUpperCase() + rest.slice(1) : title;
}

const plural = (n: number, one: string, many = `${one}s`) => `${n} ${n === 1 ? one : many}`;


/** "8 Seasons + 2 Movies & 5 OVAs": what searchers ask for ("aot watch order with ova and movies"). */
function counts(wo: Awaited<ReturnType<typeof buildWatchOrder>>) {
  const mains = wo.entries.filter((e) => e.kind === "main");
  const movies = wo.entries.filter((e) => e.kind === "movie").length;
  const extras = wo.entries.filter((e) => e.kind === "side").length;
  // "Seasons" when the follow-ups are numbered seasons; Naruto → Shippuden → Boruto are separate series.
  // Arc-named seasons count too: Demon Slayer's "Yuukaku-hen", "Katanakaji no Sato-hen".
  const seasonal = mains.slice(1).some((e) => /season|\b(2nd|3rd|\d+th)\b|part \d|final|-hen\b|\barc\b/i.test(`${e.anime.title} ${e.anime.slug}`));
  const core = plural(mains.length, seasonal ? "Season" : "Series", seasonal ? "Seasons" : "Series");
  const label = [core, movies && plural(movies, "Movie"), extras && plural(extras, "OVA")].filter(Boolean);
  return { label: label.length > 1 ? `${label.slice(0, -1).join(" + ")} & ${label[label.length - 1]}` : label[0], movies, extras };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const a = await getAnimeBySlug(decodeURIComponent(slug));
  if (!a) notFound();
  const year = new Date().getFullYear();
  const wo = await buildWatchOrder(a);
  const name = franchiseName(wo);
  const order = wo.entries.filter((e) => e.kind === "main" || e.kind === "movie");
  const c = counts(wo);
  return {
    title: wo.entries.length > 1 ? `${name} Watch Order: ${c.label} (${year})` : `${name} Watch Order (${year}): Standalone, No Sequels`,
    description: fitDescription(wo.entries.length > 1
      ? `Watch ${name} in this order: ${order.slice(0, 4).map((e, i) => `${i + 1}. ${e.anime.title}`).join(", ")}${order.length > 4 ? ", …" : ""}. Where every movie and OVA fits, which recaps to skip, and the total time (${fmtMinutes(wo.totalMinutes)}).`.slice(0, 300)
      : `${name} is a standalone title with no sequels, prequels or spin-offs on record.`),
    // One URL per franchise: every season's watch-order page points at it, so ranking signals aren't split.
    robots: robotsFor(watchOrderIndexed(watchOrderSlug(wo), wo.entries.length, wo.entries.filter((e) => e.kind === "main" || e.kind === "movie").length)),
    alternates: { canonical: `/watch-order/${watchOrderSlug(wo)}`, ...(hindiIndexed(watchOrderSlug(wo)) ? { languages: { en: `/watch-order/${watchOrderSlug(wo)}`, hi: hindiPath(watchOrderSlug(wo)), "x-default": `/watch-order/${watchOrderSlug(wo)}` } } : {}) },
  };
}

export default async function WatchOrderPage({ params }: Props) {
  const { slug } = await params;
  const a = await getAnimeBySlug(decodeURIComponent(slug));
  if (!a) notFound();
  const wo = await buildWatchOrder(a);
  const required = wo.entries.filter((e) => !e.optional || e.kind === "movie");
  const skippable = wo.entries.filter((e) => e.kind === "recap" || e.kind === "alt");
  const ordered = wo.entries.filter((e) => e.kind !== "recap" && e.kind !== "alt").map((e, i) => ({ ...e, step: i + 1 }));
  const name = franchiseName(wo);
  // "Watch order with movies" answers: each movie and the main entry it follows.
  const mainTitle = new Map(wo.entries.filter((e) => e.kind === "main").map((e) => [e.anime.id, e.anime.title]));
  const movieList = ordered.filter((e) => e.kind === "movie").map((e) => ({ anime: e.anime, after: e.attachedTo ? mainTitle.get(e.attachedTo) ?? null : null }));
  const timeline = timelineFor(wo.key);
  const firstMain = ordered.find((e) => e.kind === "main");
  const mainCount = mainTitle.size;
  const sideCount = ordered.filter((e) => e.kind === "side").length;
  const dub = firstMain ? dubFor(firstMain.anime) : null;
  const dubQ = dubFaq(dub, name);
  // Where each part streams (Kitsu links, cached a day), and each core season's studio for the comparison table.
  const mains = ordered.filter((e) => e.kind === "main");
  const core = ordered.filter((e) => e.kind === "main" || e.kind === "movie");
  const [streams, studiosOf] = ordered.length > 1
    ? await Promise.all([
        getStreamingFor(ordered.map((e) => e.anime.id)),
        Promise.all(mains.slice(0, 15).map((e) => getProductions(e.anime.id).then((p) => [e.anime.id, p.filter((x) => x.role === "studio").map((x) => x.producer.name)] as const))).then((r) => new Map(r)),
      ])
    : [new Map(), new Map<string, string[]>()];
  const coverage = streamCoverage(core.map((e) => e.anime.id), streams);
  const seasonRows = mains.map((e) => ({ e, score: e.anime.rating ? e.anime.rating / 10 : null, filler: fillerFor(e.anime.slug, e.anime.episodeCount), studio: studiosOf.get(e.anime.id)?.join(", ") || null, adapt: adaptationFor(e.anime.slug) }));
  const sourceUnit = seasonRows.find((r) => r.adapt)?.adapt?.medium ?? null;
  const bestSeason = seasonRows.filter((r) => r.score).sort((x, y) => y.score! - x.score!)[0] ?? null;

  const ld = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${name} watch order`,
    itemListOrder: "https://schema.org/ItemListOrderAscending",
    numberOfItems: ordered.length,
    itemListElement: ordered.map((e) => ({ "@type": "ListItem", position: e.step, name: e.anime.title, url: abs(animePath(e.anime)) })),
  };

  return (
    <div className="container-x pb-8">
      <JsonLd data={ld} />
      {wo.checked && <JsonLd data={{ ...webPage("WebPage", `/watch-order/${watchOrderSlug(wo)}`, `${name} watch order`), about: workRef(wo.root), ...reviewedBy(wo.checked) }} />}
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: animePath(a), label: a.title }, { href: `/watch-order/${a.slug}`, label: "Watch order" }]}
        eyebrow={wo.checked ? <>🧭 Watch order guide <span className="ml-2 inline-flex items-center gap-1 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold normal-case tracking-normal text-emerald-300">✓ Checked by {AUTHOR.name}</span></> : "🧭 Watch order guide"}
        title={<>{name} <span className="text-gradient">watch order</span></>}
        hue={262}
        backdrop={a.cover?.large || null}
        posters={required.slice(0, 3).map((e) => posterUrl(e.anime, "medium"))}
        subtitle={<>
        {wo.entries.length === 1
          ? `${name} is a standalone title with no sequels, prequels or spin-offs on record. Just start with it.`
          : `${wo.mainCount} core ${wo.mainCount === 1 ? "entry" : "entries"}, ${wo.entries.length - wo.mainCount} ${wo.entries.length - wo.mainCount === 1 ? "extra" : "extras"}. Watching only the core story and movies takes about ${fmtMinutes(wo.totalMinutes)}. Generated from the franchise graph, so it updates when new seasons are announced.`}
      </>}
      >
        {hasHindi(watchOrderSlug(wo)) && <p className="text-sm"><Link href={hindiPath(watchOrderSlug(wo))} className="chip" hrefLang="hi">🇮🇳 हिंदी में पढ़ें</Link></p>}
      </PageHero>
      <EditorWatched anime={wo.root} className="mt-4" />

      {(() => {
        // Franchise-specific advice: the editor's watch-order intro, else the start tip from AniLumi's take.
        const tip = wo.intro || noteFor(wo.root.slug)?.start || noteFor(a.slug)?.start;
        return tip ? (
          <div className="card mt-5 border-violet/40 bg-violet/10 p-4">
            <p className="text-xs font-semibold uppercase tracking-wider text-violet">How to watch</p>
            <p className="mt-1 text-sm leading-6 text-ink/90">{tip}</p>
            {wo.checked && tip === wo.intro ? <CheckedBy date={wo.checked} className="mt-2" /> : <DraftLabel className="mt-2" />}
          </div>
        ) : null;
      })()}
      {ordered.length > 1 && (
        <section className="card mt-5 p-4" aria-labelledby="quick-h">
          <h2 id="quick-h" className="font-semibold text-ink">{name} watch order at a glance</h2>
          <ol className="mt-2 grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">
            {ordered.filter((e) => e.kind === "main" || e.kind === "movie" || e.kind === "side").map((e, i) => (
              <li key={e.anime.id} className="flex gap-2">
                <span className="w-6 shrink-0 text-right font-bold tabular-nums text-muted">{i + 1}.</span>
                <span className="min-w-0"><Link href={animePath(e.anime)} className="text-ink hover:text-violet-2">{e.anime.title}</Link> <span className="text-xs text-muted">{e.kind === "main" ? subtypeLabel(e.anime.subtype) : e.kind === "movie" ? "Movie" : `${subtypeLabel(e.anime.subtype)} · optional`}{e.anime.startDate ? ` · ${e.anime.startDate.slice(0, 4)}` : ""}</span></span>
              </li>
            ))}
          </ol>
        </section>
      )}
      <BingePlan ordered={ordered} />
      <HindiDub dub={dub} title={name} className="mt-6" />

      <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <div className="card p-3"><p className="text-xl font-extrabold text-accent-2">{wo.mainCount}</p><p className="text-xs text-muted">core entries</p></div>
        <div className="card p-3"><p className="text-xl font-extrabold">{required.length - wo.mainCount}</p><p className="text-xs text-muted">movies to include</p></div>
        <div className="card p-3"><p className="text-xl font-extrabold">{skippable.length}</p><p className="text-xs text-muted">recaps / alt versions to skip</p></div>
        <div className="card p-3"><p className="text-xl font-extrabold">{fmtMinutes(wo.totalMinutes)}</p><p className="text-xs text-muted">total core runtime</p></div>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <AmazonLink query={`${name} manga`} source="watch-order" className="btn-outline">📚 Read the manga</AmazonLink>
        <AmazonLink query={`${name} blu-ray`} dept="video" source="watch-order" className="btn-outline">💿 Blu-ray box sets</AmazonLink>
      </div>
      <AffiliateNote className="mt-2" />
      <AdSlot slot="watch-order-top" />

      {(() => {
        const timed = ordered.filter((e) => (e.kind === "main" || e.kind === "movie") && runtimeMinutes(e.anime) > 0);
        if (timed.length < 2) return null;
        const longest = timed.reduce((x, y) => (runtimeMinutes(y.anime) > runtimeMinutes(x.anime) ? y : x));
        return (
          <div className="mt-8">
            <BarChart
              orientation="bar"
              title="Where the hours go"
              subtitle={`Core story and movies in watch order · ${fmtMinutes(wo.totalMinutes)} in total · longest: ${longest.anime.title}`}
              valueHeading="Runtime"
              data={timed.map((e) => ({ key: e.anime.id, label: shortTitle(e.anime.title, name), value: runtimeMinutes(e.anime), display: fmtMinutes(runtimeMinutes(e.anime)), href: animePath(e.anime) }))}
            />
          </div>
        );
      })()}

      {(() => {
        const rated = ordered.filter((e) => e.kind === "main" && e.anime.rating);
        if (rated.length < 3) return null;
        const score = (e: (typeof rated)[number]) => (e.anime.rating || 0) / 10;
        const best = rated.reduce((p, q) => (score(q) > score(p) ? q : p));
        const first = rated[0], last = rated[rated.length - 1];
        const delta = score(last) - score(first);
        const trend = Math.abs(delta) < 0.15 ? "held steady" : delta > 0 ? `rose ${delta.toFixed(2)}` : `fell ${Math.abs(delta).toFixed(2)}`;
        return (
          <div className="mt-8">
            <LineChart
              title="Score across seasons"
              subtitle={`Peaked with ${shortTitle(best.anime.title, name)} at ${score(best).toFixed(2)} · from first to latest, the score ${trend}`}
              valueHeading="Score / 10"
              labelKeys={[...new Set([first.anime.id, best.anime.id, last.anime.id])]}
              points={rated.map((e) => ({ key: e.anime.id, label: shortTitle(e.anime.title, name), fullLabel: e.anime.title, value: score(e), display: score(e).toFixed(2), href: animePath(e.anime) }))}
            />
          </div>
        );
      })()}

      {seasonRows.length >= 2 && (
        <section className="mt-8" aria-labelledby="seasons-h">
          <h2 id="seasons-h" className="h-section mb-1">Compare the seasons</h2>
          <p className="mb-3 text-sm text-muted">The main story part by part: community score (Kitsu), length, filler share, {sourceUnit ? `${sourceUnit === "manga" ? "manga chapters" : "light novel volumes"} adapted, ` : ""}and studio.{bestSeason ? ` Highest rated: ${bestSeason.e.anime.title}.` : ""}</p>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[560px] text-left text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-muted">
                <tr className="border-b border-line">
                  <th scope="col" className="px-3 py-2 font-semibold">Part</th>
                  <th scope="col" className="px-3 py-2 font-semibold">Year</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">Episodes</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">Score</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">Filler</th>
                  {sourceUnit && <th scope="col" className="px-3 py-2 font-semibold">{sourceUnit === "manga" ? "Manga" : "Novel"}</th>}
                  <th scope="col" className="px-3 py-2 font-semibold">Studio</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {seasonRows.map((r) => (
                  <tr key={r.e.anime.id} className={r === bestSeason ? "bg-violet/10" : ""}>
                    <th scope="row" className="px-3 py-2 font-medium"><Link href={animePath(r.e.anime)} className="text-ink hover:text-violet-2">{shortTitle(r.e.anime.title, name)}</Link>{r === bestSeason && <span className="ml-2 whitespace-nowrap rounded bg-violet/25 px-1.5 py-0.5 text-[10px] font-bold uppercase text-violet-2">Top score</span>}</th>
                    <td className="px-3 py-2 tabular-nums text-muted">{r.e.anime.startDate?.slice(0, 4) || "TBA"}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.e.anime.episodeCount ?? (r.e.anime.status === "current" ? "Airing" : "–")}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.score ? r.score.toFixed(2) : "–"}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.filler ? <Link href={`${animePath(r.e.anime)}/filler-list`} className="hover:text-violet-2">{Math.round(r.filler.share)}%</Link> : <span className="text-muted">–</span>}</td>
                    {sourceUnit && <td className="px-3 py-2 tabular-nums text-muted">{r.adapt ? shortRange(r.adapt) : "–"}</td>}
                    <td className="px-3 py-2 text-muted">{r.studio || "–"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-2 text-xs text-muted">Filler shows only for parts with a filler list. Scores move as people rate, so this table refreshes daily.</p>
        </section>
      )}

      {coverage.length > 0 && (
        <section className="card mt-8 p-4" aria-labelledby="streams-h">
          <h2 id="streams-h" className="font-semibold text-ink">Where to stream {name}</h2>
          <p className="mt-1 text-sm text-muted">How many of the {core.length} seasons and movies each service lists. Catalogues differ by country; each part&apos;s own links are in the order below.</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {coverage.slice(0, 6).map((c) => <li key={c.site} className="chip"><strong className="mr-1 font-semibold text-ink">{c.site}</strong> {c.n} of {core.length}</li>)}
          </ul>
        </section>
      )}

      <section className="mt-8">
        <h2 className="h-section mb-3">Recommended order</h2>
        <ol className="space-y-2">
          {ordered.map((e) => (
            <li key={e.anime.id} className={`card flex gap-3 p-3 ${e.optional ? "opacity-90" : ""} ${e.attachedTo ? "ml-4 sm:ml-8" : ""}`}>
              <span className="w-8 shrink-0 pt-1 text-center text-lg font-extrabold text-muted">{e.step}</span>
              <div className="relative h-24 w-16 shrink-0 overflow-hidden rounded-md bg-bg-2">
                {posterUrl(e.anime, "small") && <Image src={posterUrl(e.anime, "small")!} alt={`${e.anime.title} poster`} fill sizes="64px" className="object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`rounded px-1.5 py-0.5 text-[10px] font-bold uppercase ${KIND_CLASS[e.kind]}`}>{KIND_LABEL[e.kind]}</span>
                  {e.optional && e.kind !== "movie" && <span className="text-[10px] font-semibold uppercase text-muted">optional</span>}
                </div>
                <Link href={animePath(e.anime)} className="mt-1 block font-semibold hover:text-violet">{e.anime.title}</Link>
                <p className="text-xs text-muted">{subtypeLabel(e.anime.subtype)}{e.anime.startDate ? ` · ${e.anime.startDate.slice(0, 4)}` : ""}{e.anime.episodeCount ? ` · ${e.anime.episodeCount} ep` : ""}{runtimeMinutes(e.anime) ? ` · ${fmtMinutes(runtimeMinutes(e.anime))}` : ""}</p>
                <p className="mt-1 text-xs text-ink/70">{e.note}</p>
                {oneLinkPerSite(streams.get(e.anime.id) || []).length > 0 && (
                  <p className="mt-2 flex flex-wrap gap-1.5">
                    {oneLinkPerSite(streams.get(e.anime.id) || []).slice(0, 4).map((x) => (
                      <a key={x.id} href={streamLink(x.url)} target="_blank" rel={affiliateRel} className="rounded-md border border-line bg-bg-2 px-2 py-0.5 text-[11px] font-semibold text-ink/90 hover:border-violet/60 hover:text-ink" title={`${e.anime.title} on ${x.site}`}>▶ {x.site}</a>
                    ))}
                  </p>
                )}
              </div>
            </li>
          ))}
        </ol>
      </section>

      {skippable.length > 0 && (
        <section className="mt-10">
          <h2 className="h-section mb-1">Safe to skip</h2>
          <p className="mb-3 text-sm text-muted">Recap compilations and alternative cuts that retell episodes you will already have seen.</p>
          <ul className="flex flex-wrap gap-2">
            {skippable.map((e) => (
              <li key={e.anime.id}><Link href={animePath(e.anime)} className="chip">{e.anime.title}</Link></li>
            ))}
          </ul>
        </section>
      )}

      {movieList.length >= 2 && (() => {
        // "One Piece movies in order" (4.4k a month in India): every film by release date, with where it fits.
        const films = [...movieList].sort((x, y) => (x.anime.startDate ?? "").localeCompare(y.anime.startDate ?? ""));
        const canon = new Map((timeline ?? []).map((f) => [f.slug, f.canon]));
        return (
          <section className="mt-10" aria-labelledby="movies-h">
            <h2 id="movies-h" className="h-section mb-1">{name} movies in order</h2>
            <p className="mb-3 text-sm text-muted">The {films.length} {name} films in this watch order, by release date, with the part of the series to watch first.</p>
            <div className="card overflow-x-auto p-0">
              <table className="w-full min-w-[560px] border-collapse text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted">
                    <th scope="col" className="px-3 py-2">#</th>
                    <th scope="col" className="px-3 py-2">Movie</th>
                    <th scope="col" className="px-3 py-2">Year</th>
                    <th scope="col" className="px-3 py-2">Runtime</th>
                    <th scope="col" className="px-3 py-2">Score</th>
                    <th scope="col" className="px-3 py-2">Watch after</th>
                  </tr>
                </thead>
                <tbody>
                  {films.map((m, i) => (
                    <tr key={m.anime.id} className="border-t border-line/60">
                      <td className="px-3 py-2 font-bold tabular-nums text-muted">{i + 1}</td>
                      <td className="px-3 py-2">
                        <Link href={animePath(m.anime)} className="font-medium text-ink hover:text-violet-2">{m.anime.title}</Link>
                        {canon.has(m.anime.slug) && <span className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-semibold ${canon.get(m.anime.slug) ? "bg-violet/15 text-violet-2" : "bg-white/5 text-muted"}`}>{canon.get(m.anime.slug) ? "Canon" : "Non-canon"}</span>}
                      </td>
                      <td className="px-3 py-2 tabular-nums text-ink/90">{m.anime.startDate?.slice(0, 4) ?? "–"}</td>
                      <td className="px-3 py-2 tabular-nums text-ink/90">{runtimeMinutes(m.anime) ? fmtMinutes(runtimeMinutes(m.anime)) : "–"}</td>
                      <td className="px-3 py-2 tabular-nums text-ink/90">{m.anime.rating ? (m.anime.rating / 10).toFixed(1) : "–"}</td>
                      <td className="px-3 py-2 text-ink/80">{m.after ?? "Any time"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })()}

      {timeline && (
        <section className="mt-10" aria-labelledby="chrono-h">
          <h2 id="chrono-h" className="h-section mb-1">{name} chronological order: where each film fits</h2>
          <p className="mb-3 text-sm text-muted">In story order, with the episode each film follows. Non-canon films don&apos;t change the story; watch them for fun at the point shown.</p>
          <ol className="card divide-y divide-line">
            {timeline.map((f, i) => {
              const e = wo.entries.find((x) => x.anime.slug === f.slug);
              return (
                <li key={f.slug} className="flex items-start gap-3 p-3 text-sm">
                  <span className="w-6 shrink-0 text-right font-bold text-muted">{i + 1}</span>
                  <span className="min-w-0 flex-1">
                    {e ? <Link href={animePath(e.anime)} className="font-medium text-ink hover:text-violet">{e.anime.title}</Link> : <span className="font-medium text-ink">{f.title}</span>}
                    <span className="block text-ink/80">{f.when}</span>
                    {f.note && <span className="block text-xs text-muted">{f.note}{f.confidence === "medium" ? " (one source)" : ""}</span>}
                    {!f.note && f.confidence === "medium" && <span className="block text-xs text-muted">One source</span>}
                  </span>
                  <span className={`shrink-0 rounded px-2 py-0.5 text-xs font-semibold ${f.canon ? "bg-violet/15 text-violet-2" : "bg-white/5 text-muted"}`}>{f.canon ? "Canon" : "Non-canon"}</span>
                </li>
              );
            })}
          </ol>
        </section>
      )}

      {wo.entries.length > 1 && (
        <section className="mt-10">
          <h2 className="h-section mb-3">Release order</h2>
          <ol className="card divide-y divide-line">
            {wo.releaseOrder.map((x, i) => (
              <li key={x.id} className="flex items-center gap-3 p-3 text-sm">
                <span className="w-6 text-right font-bold text-muted">{i + 1}</span>
                <Link href={animePath(x)} className="flex-1 font-medium hover:text-violet">{x.title}</Link>
                <span className="text-xs text-muted">{x.startDate?.slice(0, 7) || "TBA"}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      {ordered.length > 1 && (
        <WatchChecklist
          slug={wo.root.slug}
          name={name}
          items={ordered.map((e) => ({
            id: e.anime.id,
            title: e.anime.title,
            label: KIND_LABEL[e.kind],
            meta: [e.anime.startDate?.slice(0, 4), e.anime.episodeCount && e.anime.subtype !== "movie" ? `${e.anime.episodeCount} ep` : null, runtimeMinutes(e.anime) ? fmtMinutes(runtimeMinutes(e.anime)) : null].filter(Boolean).join(" · "),
            optional: e.optional && e.kind !== "movie",
          }))}
        />
      )}

      <Faq
        title={`${name} watch order FAQ`}
        items={[
          { q: `What order should I watch ${name} in?`, a: wo.intro ? wo.intro : wo.entries.length === 1 ? `${name} has a single entry, so there is nothing to sequence.` : `Follow the recommended order above: ${wo.entries.filter((e) => e.kind === "main").map((e) => e.anime.title).join(" → ")}. Movies and side stories are slotted after the season they relate to.` },
          { q: `How long does it take to watch all of ${name}?`, a: wo.totalMinutes ? `The core story and movies run about ${fmtMinutes(wo.totalMinutes)}. At two hours a day that is roughly ${Math.ceil(wo.totalMinutes / 120)} days.` : "Runtime data is incomplete for this franchise." },
          ...(mainCount > 1 ? [{ q: `How many seasons does ${name} have?`, a: `${mainCount} parts make up the main story${movieList.length ? `, plus ${movieList.length} movie${movieList.length === 1 ? "" : "s"}` : ""}${sideCount ? ` and ${sideCount} side stor${sideCount === 1 ? "y" : "ies"} or OVAs` : ""}.` }] : []),
          ...(movieList.length >= 2 ? [{ q: `How many ${name} movies are there?`, a: `${movieList.length} films are in the watch order: ${[...movieList].sort((x, y) => (x.anime.startDate ?? "").localeCompare(y.anime.startDate ?? "")).map((m) => `${m.anime.title}${m.anime.startDate ? ` (${m.anime.startDate.slice(0, 4)})` : ""}`).join(", ")}.` }] : []),
          ...(timeline ? [{ q: `What is the ${name} chronological order, with the movies?`, a: timeline.map((f) => `${f.title}: ${f.when}${f.canon ? " (canon)" : ""}`).join("; ") + "." }] : movieList.length ? [{ q: `Where do the ${name} movies fit in the watch order?`, a: movieList.map((m) => `${m.anime.title}${m.after ? `: after ${m.after}` : ""}`).join("; ") + "." }] : []),
          ...(skippable.length ? [{ q: `Can I skip the ${name} recaps?`, a: `Yes. ${skippable.map((e) => e.anime.title).join(", ")} retell events you have already seen and can be skipped.` }] : []),
          ...(coverage.length ? [{ q: `Where can I stream all of ${name}?`, a: `${coverage[0].site} lists ${coverage[0].n} of the ${core.length} seasons and movies${coverage[1] ? `, ${coverage[1].site} ${coverage[1].n}` : ""}${coverage[2] ? ` and ${coverage[2].site} ${coverage[2].n}` : ""}. Catalogues differ by country, so check the links on each part above.` }] : []),
          ...(bestSeason && seasonRows.filter((r) => r.score).length >= 2 ? [{ q: `Which ${name} season is the best?`, a: `By community score on Kitsu, ${bestSeason.e.anime.title} rates highest at ${bestSeason.score!.toFixed(2)}/10. The comparison table above lists every part's score, length, filler share and studio.` }] : []),
          ...(dubQ ? [dubQ] : []),
        ]}
      />
    </div>
  );
}
