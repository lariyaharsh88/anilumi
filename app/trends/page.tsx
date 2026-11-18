import { fitDescription, fitTitle } from "@/lib/titles";
import type { Metadata } from "next";
import Link from "@/components/Link";
import Image from "next/image";
import { countAnime, TREND_GENRES, animePath, posterUrl } from "@/lib/kitsu";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import Faq, { type FaqItem } from "@/components/Faq";
import { itemList } from "@/lib/ld";
import { onNow } from "@/lib/trending";
import { hindiArrivals, hindiComing } from "@/lib/hindistats";
import { dueWithin, premiereAt } from "@/lib/dubschedule";
import searchData from "@/data/search-trends.json";

// The "this week" part follows the airing snapshot (every 3 hours) and the dub lists; 6 hours keeps it current
// without re-rendering often. The genre chart below changes once a year.
export const revalidate = 21600;

/**
 * "anime trends" is searched 3.6K times a month in India (Keyword Planner, Nov 2026). Everything here is the site's own
 * data, no live third-party calls: trending shows from the airing snapshot, Hindi dub news from the dub lists, and
 * India search demand from Keyword Planner (data/search-trends.json, refreshed by hand monthly).
 */
type SearchRow = { q: string; label: string; href: string; avg: number; latest: number; yearAgo: number };
const SEARCH = searchData as { checked: string; from: string; to: string; source: string; rows: SearchRow[] };
const fmtDay = (iso: string) => new Date(/T/.test(iso) ? iso : `${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "Asia/Kolkata" });
const change = (r: SearchRow) => (r.yearAgo ? Math.round((r.latest / r.yearAgo - 1) * 100) : 0);

async function thisWeek() {
  const { trending } = await onNow();
  const newHindi = hindiArrivals(30);
  const coming = hindiComing();
  const hindiEpisodes = dueWithin(Date.now(), 7).filter((x) => x.e.lang === "hi").length;
  const rising = [...SEARCH.rows].filter((r) => r.latest >= 3000).sort((a, b) => change(b) - change(a))[0];
  return { trending: trending.slice(0, 10), newHindi, coming, hindiEpisodes, rising };
}

export async function generateMetadata(): Promise<Metadata> {
  const { trending, newHindi } = await thisWeek();
  return {
    title: fitTitle(["Anime Trends in India This Week: Trending Shows & Hindi Dubs", "Anime Trends in India This Week", "Anime Trends in India"]),
    description: fitDescription(`What's trending in anime in India this week: ${trending.slice(0, 3).map((a) => a.titleEn || a.title).join(", ")}, ${newHindi.length} new Hindi dubs in the last 30 days, and what India searches for most. Plus a decade of genre trends.`),
    alternates: { canonical: "/trends" },
  };
}

export default async function TrendsIndex() {
  const lastFull = new Date().getUTCFullYear() - 1;
  const then = lastFull - 10;
  const [tThen, tNow, ...counts] = await Promise.all([
    countAnime({ seasonYear: String(then), subtype: "TV" }, 86400),
    countAnime({ seasonYear: String(lastFull), subtype: "TV" }, 86400),
    ...TREND_GENRES.flatMap(([g]) => [countAnime({ seasonYear: String(then), subtype: "TV", categories: g }, 86400), countAnime({ seasonYear: String(lastFull), subtype: "TV", categories: g }, 86400)]),
  ]);
  const rows = TREND_GENRES.map(([slug, name], i) => {
    const a = tThen ? (counts[i * 2] / tThen) * 100 : 0, b = tNow ? (counts[i * 2 + 1] / tNow) * 100 : 0;
    return { slug, name, then: a, now: b, delta: b - a };
  }).sort((x, y) => y.delta - x.delta);
  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.delta)), 1);
  const w = await thisWeek();
  const name = (a: (typeof w.trending)[number]) => (a.titleEn && a.titleEn.length <= 40 ? a.titleEn : a.title);
  const faq: FaqItem[] = [
    ...(w.trending.length ? [{ q: "What anime is trending in India right now?", a: `The most-followed shows airing this week: ${w.trending.slice(0, 6).map(name).join(", ")}.` }] : []),
    { q: "What are the most searched anime topics in India?", a: `On Google in ${SEARCH.to}: ${SEARCH.rows.slice(0, 5).map((r) => `"${r.q}" (${r.latest.toLocaleString("en-IN")})`).join(", ")}. Filler lists, watch orders and next-season dates lead.` },
    ...(w.newHindi.length ? [{ q: "Which anime got a Hindi dub recently?", a: `In the last 30 days: ${w.newHindi.slice(0, 6).map((e) => `${e.t} (${e.service.replace(/ \(.*\)$/, "")})`).join(", ")}.` }] : []),
    { q: "How is this page made?", a: `From AniLumi's own data, with no live calls to other sites: trending shows from the weekly airing schedule, ranked by how many fans follow them; Hindi dub news from our checked dub lists; and India search volumes from Google's Keyword Planner (${SEARCH.from} to ${SEARCH.to}), refreshed monthly.` },
  ];
  return (
    <div className="container-x pb-8">
      <JsonLd data={itemList("Anime trending in India this week", w.trending.map((a) => ({ url: animePath(a), name: name(a) })))} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/trends", label: "Trends" }]}
        eyebrow="Updated every week"
        title={<>Anime trends <span className="text-gradient">in India</span></>}
        subtitle="What's trending this week, which Hindi dubs just arrived or are coming, what India searches for most, and how genres have changed over a decade."
        facts={[
          ...(w.trending[0] ? [{ value: name(w.trending[0]).length > 18 ? `${name(w.trending[0]).slice(0, 16)}…` : name(w.trending[0]), label: "trending #1" }] : []),
          { value: String(w.newHindi.length), label: "new Hindi dubs, 30 days" },
          ...(w.rising ? [{ value: `+${change(w.rising)}%`, label: `"${w.rising.q}" searches` }] : []),
        ]}
        hue={190}
      />

      {w.trending.length > 0 && (
        <section className="reveal mt-10" aria-labelledby="now-h">
          <h2 id="now-h" className="h-section mb-1">Trending this week</h2>
          <p className="mb-4 text-sm text-muted">The most-followed anime with a new episode this week, newest shows first. <Link href="/schedule" className="text-violet hover:underline">Full schedule →</Link></p>
          <ol className="grid grid-cols-2 gap-3 sm:grid-cols-5">
            {w.trending.map((a, i) => (
              <li key={a.id} className="min-w-0">
                <Link href={animePath(a)} className="group block">
                  <span className="relative block aspect-[5/7] overflow-hidden rounded-xl border border-line bg-bg-2">
                    {posterUrl(a, "small") && <Image src={posterUrl(a, "small")!} alt={`${name(a)} poster`} fill sizes="(max-width:640px) 45vw, 180px" className="object-cover transition duration-500 group-hover:scale-105" />}
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-black/70 px-1.5 py-0.5 text-[11px] font-bold text-white">#{i + 1}</span>
                  </span>
                  <span className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug text-ink group-hover:text-violet-2">{name(a)}</span>
                </Link>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="reveal mt-12" aria-labelledby="hindi-h">
        <h2 id="hindi-h" className="h-section mb-1">🇮🇳 Hindi dub trends</h2>
        <p className="mb-4 text-sm text-muted">{w.hindiEpisodes} Hindi dubbed episodes are out this week. <Link href="/hindi-dub/this-week" className="text-violet hover:underline">Day by day →</Link></p>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card p-4 text-sm">
            <p className="font-semibold text-ink">New in Hindi, last 30 days ({w.newHindi.length})</p>
            <ul className="mt-2 space-y-1">
              {w.newHindi.slice(0, 8).map((e) => <li key={`${e.t}-${e.service}`} className="flex justify-between gap-3"><span className="truncate">{e.slug ? <Link href={animePath({ slug: e.slug })} className="text-ink hover:text-violet-2">{e.t}</Link> : e.t}</span><span className="shrink-0 text-xs text-muted">{e.service.replace(/ \(.*\)$/, "")}{e.premiere ? ` · ${fmtDay(e.premiere)}` : ""}</span></li>)}
            </ul>
          </div>
          <div className="card p-4 text-sm">
            <p className="font-semibold text-ink">Coming soon in Hindi ({w.coming.length})</p>
            <ul className="mt-2 space-y-1">
              {w.coming.slice(0, 8).map((e) => <li key={`${e.t}-${e.service}`} className="flex justify-between gap-3"><span className="truncate">{e.slug ? <Link href={animePath({ slug: e.slug })} className="text-ink hover:text-violet-2">{e.t}</Link> : e.t}</span><span className="shrink-0 text-xs text-muted">{e.service.replace(/ \(.*\)$/, "")}{Number.isFinite(premiereAt(e)) ? ` · ${fmtDay(new Date(premiereAt(e)).toISOString())}` : " · date TBA"}</span></li>)}
            </ul>
            <p className="mt-2 text-xs"><Link href="/new-dubs" className="text-violet hover:underline">Every new and upcoming Hindi dub →</Link></p>
          </div>
        </div>
      </section>

      <section className="reveal mt-12" aria-labelledby="search-h">
        <h2 id="search-h" className="h-section mb-1">What India searches for</h2>
        <p className="mb-4 text-sm text-muted">Monthly Google searches in India for the biggest anime topics, {SEARCH.to} against {SEARCH.from}. Source: {SEARCH.source}.</p>
        <div className="-mx-4 overflow-x-auto px-4">
          <table className="w-full min-w-[480px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr className="border-b border-line"><th className="py-2 pr-3 font-semibold">Search</th><th className="py-2 pr-3 text-right font-semibold">{SEARCH.to.replace(/^(\w{3})\w*/, "$1")}</th><th className="py-2 text-right font-semibold">vs a year ago</th></tr>
            </thead>
            <tbody>
              {SEARCH.rows.map((r) => (
                <tr key={r.q} className="border-b border-line/50">
                  <td className="py-2 pr-3"><Link href={r.href} className="text-ink hover:text-violet-2">{r.q}</Link></td>
                  <td className="py-2 pr-3 text-right tabular-nums">{r.latest.toLocaleString("en-IN")}</td>
                  <td className={`py-2 text-right tabular-nums ${change(r) > 0 ? "text-emerald-300" : change(r) < 0 ? "text-[#e66767]" : "text-muted"}`}>{change(r) > 0 ? "▲ +" : change(r) < 0 ? "▼ −" : ""}{change(r) ? `${Math.abs(change(r))}%` : "flat"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <h2 className="h-section reveal mt-12">Genre trends over a decade</h2>
      <p className="mt-1 text-sm text-muted">How each genre&apos;s share of new TV anime changed from {then} to {lastFull}. Open any genre for the full year-by-year chart.</p>
      <figure className="card reveal mt-4 p-4">
        <figcaption>
          <h2 className="font-semibold text-ink">Change in share of new TV anime, {then} → {lastFull}</h2>
          <p className="mt-0.5 text-xs text-muted">Percentage points · blue = grew, red = shrank, gray center line = no change</p>
        </figcaption>
        <ul className="mt-4 space-y-1.5">
          {rows.map((r) => {
            const w = (Math.abs(r.delta) / maxAbs) * 50;
            return (
              <li key={r.slug}>
                <Link href={`/trends/${r.slug}`} className="group grid grid-cols-[7rem_1fr] items-center gap-2 rounded hover:bg-white/[0.03] sm:grid-cols-[9rem_1fr]" aria-label={`${r.name}: ${r.delta >= 0 ? "up" : "down"} ${Math.abs(r.delta).toFixed(1)} percentage points, from ${r.then.toFixed(1)}% to ${r.now.toFixed(1)}%`}>
                  <span className="truncate text-xs text-ink/90 group-hover:text-violet">{r.name}</span>
                  <span className="relative flex h-6 items-center">
                    <span className="absolute inset-y-0 left-1/2 w-px bg-[#383835]" aria-hidden />
                    {r.delta >= 0 ? (
                      <>
                        <span className="absolute left-1/2 h-3.5 rounded-r-[4px] bg-viz-1" style={{ width: `${w}%` }} />
                        <span className="absolute text-[11px] tabular-nums text-muted" style={{ left: `calc(50% + ${w}% + 6px)` }}>{Math.abs(r.delta) < 0.05 ? "0.0" : `+${r.delta.toFixed(1)}`}</span>
                      </>
                    ) : (
                      <>
                        <span className="absolute right-1/2 h-3.5 rounded-l-[4px] bg-[#e66767]" style={{ width: `${w}%` }} />
                        <span className="absolute text-[11px] tabular-nums text-muted" style={{ right: `calc(50% + ${w}% + 6px)` }}>−{Math.abs(r.delta).toFixed(1)}</span>
                      </>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <details className="mt-3 text-xs text-muted">
          <summary className="cursor-pointer select-none hover:text-ink">Show as table</summary>
          <table className="mt-2 w-full border-collapse">
            <thead><tr><th className="border-b border-line py-1 text-left font-medium">Genre</th><th className="border-b border-line py-1 text-right font-medium">{then}</th><th className="border-b border-line py-1 text-right font-medium">{lastFull}</th><th className="border-b border-line py-1 text-right font-medium">Change</th></tr></thead>
            <tbody>{rows.map((r) => <tr key={r.slug}><td className="border-b border-line/50 py-1 text-ink/90">{r.name}</td><td className="border-b border-line/50 py-1 text-right tabular-nums">{r.then.toFixed(1)}%</td><td className="border-b border-line/50 py-1 text-right tabular-nums">{r.now.toFixed(1)}%</td><td className="border-b border-line/50 py-1 text-right tabular-nums text-ink/90">{Math.abs(r.delta) < 0.05 ? "" : r.delta > 0 ? "+" : "−"}{Math.abs(r.delta).toFixed(1)} pts</td></tr>)}</tbody>
          </table>
        </details>
      </figure>
      <p className="mt-4 text-xs text-muted">Based on TV series listed on Kitsu by premiere year. Tags overlap, and Kitsu&apos;s tagging has grown more thorough over time, so some of the change reflects better tagging rather than more shows. Each genre page explains the method.</p>
      <Faq title="Anime trends: FAQ" items={faq} />
    </div>
  );
}
