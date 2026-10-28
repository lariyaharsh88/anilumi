import type { Metadata } from "next";
import Link from "@/components/Link";
import { notFound } from "next/navigation";
import { getAnimeBySlug, getLastAiredBest, buildWatchOrder, listAnime, animePath, posterUrl, runtimeMinutes, subtypeLabel, type Anime } from "@/lib/kitsu";
import { fillerFor } from "@/lib/filler";
import { paces, shortcuts, humanDays, hoursOf, fmtRun } from "@/lib/binge";
import PageHero from "@/components/PageHero";
import BingePlanner from "@/components/BingePlanner";
import BarChart from "@/components/viz/BarChart";
import Faq, { type FaqItem } from "@/components/Faq";
import AdSlot from "@/components/AdSlot";
import { measuredSkips, fmtSec } from "@/lib/skip";

export const revalidate = 86400;
// Render on first request, then serve from the ISR cache until revalidated.
export async function generateStaticParams() { return []; }
type Props = { params: Promise<{ slug: string }> };

/** Runtime facts for a title; airing shows count only what has aired so far. */
async function load(slug: string) {
  const a = await getAnimeBySlug(decodeURIComponent(slug));
  if (!a) notFound();
  const airing = a.status === "current";
  const latest = airing ? await getLastAiredBest(a.id) : null;
  const len = a.episodeLength || 0;
  const eps = airing ? latest?.lastAired || 0 : a.episodeCount || 0;
  const total = a.subtype === "movie" ? runtimeMinutes(a) : eps && len ? eps * len : airing ? 0 : runtimeMinutes(a);
  return { a, airing, eps, len, total };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { a, airing, eps, len, total } = await load(slug);
  const h = hoursOf(total);
  const title = `How Long to Watch ${a.title}? ${total ? `${h} Hour${h === 1 ? "" : "s"}${airing ? " So Far" : ""}` : "Runtime"} & Binge Time`;
  const description = total
    ? `${a.title} takes about ${fmtRun(total)} to watch${eps > 1 && len ? ` (${eps} episodes × ${len} min)` : ""}. At 2 hours a day that's ${humanDays(Math.ceil(total / 120))}. See faster ways, filler skips and the whole franchise.`
    : `Runtime and binge planner for ${a.title}.`;
  return { title, description, alternates: { canonical: `${animePath(a)}/how-long-to-watch` }, robots: total ? undefined : { index: false } };
}

export default async function HowLongPage({ params }: Props) {
  const { slug } = await params;
  const { a, airing, eps, len, total } = await load(slug);
  const fill = a.subtype === "movie" ? null : fillerFor(a.slug, eps || null);
  const [wo, popular, skipAvg] = await Promise.all([
    a.subtype === "movie" ? Promise.resolve(null) : buildWatchOrder(a),
    listAnime({ sort: "-userCount", limit: 20, filter: { subtype: "TV" }, revalidate: 86400 }),
    a.subtype === "movie" ? Promise.resolve(null) : measuredSkips(a.id, eps),
  ]);
  const plan = paces(total, a.subtype === "movie" ? 0 : eps);
  const fast = shortcuts(total, a.subtype === "movie" ? 0 : eps, len, fill?.count || 0, skipAvg ? { perEpisodeMin: skipAvg.perEpisodeSec / 60, sampled: skipAvg.sampled } : undefined);
  // Airing shows: count the current title by what has aired, so every figure on the page agrees.
  const fTotal = wo ? wo.totalMinutes - runtimeMinutes(a) + total : 0;
  const franchise = wo && wo.entries.length > 1 && fTotal > total ? wo : null;
  const at2h = Math.ceil(total / 120);
  const h = hoursOf(total);

  // Neighbours by runtime among the most popular series, with this title highlighted.
  const pool = new Map<string, { a: Anime; m: number }>();
  for (const x of popular.items) { const m = runtimeMinutes(x); if (m) pool.set(x.id, { a: x, m }); }
  if (total) pool.set(a.id, { a, m: total });
  const ranked = [...pool.values()].sort((x, y) => y.m - x.m);
  const at = ranked.findIndex((r) => r.a.id === a.id);
  const from = Math.max(0, Math.min(at - 4, ranked.length - 9));
  const near = at < 0 ? [] : ranked.slice(from, from + 9);
  const longerThan = at < 0 ? 0 : ranked.length - at - 1;

  const answer = total
    ? `${a.title} ${airing ? "has" : "takes"} about ${fmtRun(total)} ${airing ? "of episodes out so far" : "to watch"}${eps > 1 && len ? `: ${eps} episodes of ${len} minutes` : a.subtype === "movie" ? " from start to credits" : ""}.`
    : `${a.title} doesn't have a published runtime yet.`;

  const faq: FaqItem[] = total
    ? [
        { q: `How long does it take to watch ${a.title}?`, a: `${answer} That's ${h} hour${h === 1 ? "" : "s"} non-stop, or ${humanDays(at2h)} at two hours a day.` },
        ...(eps > 1 ? [{ q: `How many episodes of ${a.title} are there?`, a: airing ? `${eps} episodes have aired so far, and ${a.title} is still airing.` : `${a.title} has ${eps} episodes${len ? ` of about ${len} minutes each` : ""}.` }] : []),
        ...(fill && fill.count ? [{ q: `How long is ${a.title} without filler?`, a: `Skipping its ${fill.count} filler episodes cuts the watch to about ${fmtRun(total - fill.count * len)}, saving ${fmtRun(fill.count * len)}.` }] : []),
        ...(franchise ? [{ q: `How long does it take to watch all of ${a.title}?`, a: `The core story plus movies across the franchise runs about ${fmtRun(fTotal)} over ${franchise.mainCount} main entries. The watch order page lists them in sequence.` }] : []),
        { q: `Can I finish ${a.title} in a weekend?`, a: total <= 1200 ? `Yes. At ten hours across Saturday and Sunday you'd finish ${a.title} in ${Math.max(1, Math.ceil(total / 600))} weekend${Math.ceil(total / 600) === 1 ? "" : "s"}.` : `Not in one. At ten hours a weekend it takes about ${Math.ceil(total / 600)} weekends.` },
      ]
    : [];

  return (
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: animePath(a), label: a.title }, { href: `${animePath(a)}/how-long-to-watch`, label: "How long to watch" }]}
        eyebrow="⏳ Binge-time calculator"
        title={<>How long to watch <span className="text-gradient">{a.title}</span>?</>}
        subtitle={answer}
        facts={total ? [
          { value: `${h.toLocaleString()} h`, label: airing ? "aired so far" : "non-stop" },
          ...(eps > 1 ? [{ value: eps.toLocaleString(), label: airing ? "episodes out" : "episodes" }] : []),
          { value: humanDays(at2h), label: "at 2 h a day" },
          ...(fill?.count ? [{ value: String(fill.count), label: "filler to skip" }] : []),
        ] : undefined}
        hue={190}
        backdrop={a.cover?.large || null}
        posters={[posterUrl(a, "medium")]}
      />

      {total > 0 && (
        <>
          <section className="reveal mt-10" aria-labelledby="pace-h">
            <h2 id="pace-h" className="h-section mb-3">At your pace</h2>
            <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
              {plan.map((p) => (
                <li key={p.key} className="card p-4 transition duration-300 hover:-translate-y-0.5 hover:border-white/20">
                  <p className="text-xs text-muted">{p.label}</p>
                  <p className="mt-1 text-2xl font-black tracking-tight text-ink">{p.unit === "weekend" ? `${p.days} weekend${p.days === 1 ? "" : "s"}` : humanDays(p.days)}</p>
                  {p.unit === "day" && p.days > 13 && <p className="mt-0.5 text-xs text-muted">{p.days.toLocaleString()} days</p>}
                </li>
              ))}
            </ul>
          </section>

          {fast.length > 0 && (
            <section className="reveal mt-10" aria-labelledby="fast-h">
              <h2 id="fast-h" className="h-section mb-3">Faster ways through it</h2>
              <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {fast.map((f) => (
                  <li key={f.key} className="card p-4">
                    <p className="font-semibold text-ink">{f.label}</p>
                    <p className="mt-2 text-2xl font-black tracking-tight text-accent-2">{fmtRun(f.minutes)}</p>
                    <p className="text-xs text-muted">saves {fmtRun(f.saved)}</p>
                    <p className="mt-2 text-xs leading-5 text-ink/70">{f.note}{f.key === "filler" && <> <Link href={`${animePath(a)}/episodes`} className="text-violet hover:underline">See which episodes</Link></>}{f.key === "oped" && skipAvg && <> Opening ~{fmtSec(skipAvg.opSec)}, ending ~{fmtSec(skipAvg.edSec)} (<a href="https://aniskip.com" target="_blank" rel="noopener" className="underline">AniSkip</a>).</>}</p>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <BingePlanner title={a.title} episodes={a.subtype === "movie" ? 0 : eps} episodeLength={len || 24} totalMinutes={total} status={a.status} />

          {franchise && (
            <section className="card reveal mt-8 p-5" aria-labelledby="fr-h">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h2 id="fr-h" className="h-section">The whole franchise</h2>
                  <p className="mt-1 text-sm text-muted">Every main entry and movie in story order, recaps left out.</p>
                </div>
                <p className="text-right"><span className="text-3xl font-black text-ink">{fmtRun(fTotal)}</span><br /><span className="text-xs text-muted">{humanDays(Math.ceil(fTotal / 120))} at 2 h a day</span></p>
              </div>
              <ol className="mt-4 divide-y divide-line">
                {franchise.entries.filter((e) => e.kind === "main" || e.kind === "movie").slice(0, 8).map((e) => (
                  <li key={e.anime.id} className="flex items-center gap-3 py-2 text-sm">
                    <span className="w-6 text-right font-bold text-muted">{e.step}</span>
                    <Link href={`${animePath(e.anime)}/how-long-to-watch`} className="min-w-0 flex-1 truncate hover:text-violet-2">{e.anime.title}</Link>
                    <span className="text-xs text-muted">{subtypeLabel(e.anime.subtype)}</span>
                    <span className="w-20 text-right tabular-nums text-ink/90">{fmtRun(e.anime.id === a.id ? total : runtimeMinutes(e.anime))}</span>
                  </li>
                ))}
              </ol>
              <Link href={`/watch-order/${a.slug}`} className="mt-3 inline-block text-sm font-medium text-violet hover:text-violet-2">Full watch order →</Link>
            </section>
          )}

          <AdSlot slot="howlong-mid" />

          {near.length > 2 && (
            <section className="reveal mt-10">
              <BarChart
                orientation="bar"
                title="How it compares"
                subtitle={longerThan ? `Longer than ${longerThan} of the ${ranked.length - 1} most popular series` : `Shorter than the ${ranked.length - 1} most popular series`}
                valueHeading="Runtime"
                highlightKey={a.id}
                labelKeys={[a.id]}
                data={near.map((r) => ({ key: r.a.id, label: r.a.title, value: Math.round(r.m / 60), display: fmtRun(r.m), mark: `${Math.round(r.m / 60)} h`, href: `${animePath(r.a)}/how-long-to-watch` }))}
              />
            </section>
          )}
        </>
      )}

      <p className="mt-8 text-sm text-muted">
        <Link href={animePath(a)} className="text-violet hover:underline">{a.title} overview</Link> ·{" "}
        <Link href={`${animePath(a)}/parents-guide`} className="text-violet hover:underline">Parents&apos; guide</Link> ·{" "}
        <Link href="/how-long-to-watch" className="text-violet hover:underline">Longest and shortest anime</Link>
      </p>

      <Faq items={faq} />
    </div>
  );
}
