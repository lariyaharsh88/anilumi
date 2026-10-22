import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { getGenreTrend, trendDirection, listAnime, TREND_GENRES, TREND_FROM, Anime } from "@/lib/kitsu";
import { site, abs } from "@/lib/site";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import Faq from "@/components/Faq";
import AdSlot from "@/components/AdSlot";
import AnimeCard from "@/components/AnimeCard";
import StatTiles from "@/components/viz/StatTiles";
import LineChart from "@/components/viz/LineChart";
import BarChart from "@/components/viz/BarChart";

export const revalidate = 86400;
type Props = { params: Promise<{ genre: string }> };

export function generateStaticParams() {
  return TREND_GENRES.map(([genre]) => ({ genre }));
}

const nameOf = (slug: string) => TREND_GENRES.find(([s]) => s === slug)?.[1];
const pct = (v: number) => `${v.toFixed(1)}%`;
const pts = (v: number) => `${v >= 0 ? "+" : "−"}${Math.abs(v).toFixed(1)} pts`;
const niceTop = (v: number) => { const s = [1, 2, 4, 5, 6, 8, 10, 12, 15, 20, 25, 30, 40, 50, 60, 80, 100].find((x) => x >= v * 1.1) ?? 100; return s % 2 ? s + 1 : s; };

function headline(name: string, dir: string) {
  return dir === "rise" ? `The rise of ${name.toLowerCase()} anime` : dir === "decline" ? `The decline of ${name.toLowerCase()} anime` : `${name} anime over the years`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { genre } = await params;
  const name = nameOf(genre);
  if (!name) notFound();
  const rows = await getGenreTrend(genre);
  const lastFull = new Date().getUTCFullYear() - 1;
  const t = trendDirection(rows, lastFull);
  return {
    title: `${headline(name, t.dir)} – Share of New TV Anime by Year (${TREND_FROM}–${lastFull})`,
    description: `${name} made up ${pct(t.to)} of new TV anime in ${lastFull}, ${t.dir === "steady" ? "close to" : t.dir === "rise" ? "up from" : "down from"} ${pct(t.from)} a decade earlier. Year-by-year counts, shares and defining titles since ${TREND_FROM}.`,
    alternates: { canonical: `/trends/${genre}` },
  };
}

export default async function TrendPage({ params }: Props) {
  const { genre } = await params;
  const name = nameOf(genre);
  if (!name) notFound();
  const now = new Date().getUTCFullYear();
  const lastFull = now - 1;
  const rows = await getGenreTrend(genre);
  const full = rows.filter((r) => r.year <= lastFull);
  const t = trendDirection(rows, lastFull);
  const peak = full.reduce((a, b) => (b.share > a.share ? b : a));
  const last = rows.find((r) => r.year === lastFull)!;
  const cur = rows.find((r) => r.year === now)!;
  const tenAgo = rows.find((r) => r.year === lastFull - 10)!;
  const totalCount = full.reduce((n, r) => n + r.count, 0);
  const firstBig = full.find((r) => r.share >= peak.share / 2);
  const decades: [string, string][] = [["2000s", "2000..2009"], ["2010s", "2010..2019"], [`2020s so far`, `2020..${now}`]];
  const picks = await Promise.all(decades.map(([, range]) => listAnime({ filter: { categories: genre, seasonYear: range, subtype: "TV" }, sort: "-userCount", limit: 4 })));
  const others = TREND_GENRES.filter(([s]) => s !== genre);

  const ld = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `${name} share of new TV anime by year, ${TREND_FROM}–${now}`,
    description: `Number of TV anime series tagged ${name} on Kitsu by premiere year, the total number of TV series that year, and the resulting share.`,
    url: abs(`/trends/${genre}`),
    temporalCoverage: `${TREND_FROM}/${now}`,
    variableMeasured: [`${name} TV series premiering per year`, "All TV series premiering per year", `${name} share (%)`],
    isBasedOn: "https://kitsu.io",
    creator: { "@type": "Organization", name: site.name, url: site.url },
  };

  return (
    <div className="container-x py-8">
      <JsonLd data={ld} />
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { href: "/trends", label: "Genre trends" }, { href: `/trends/${genre}`, label: name }]} />
      <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{headline(name, t.dir)}</h1>
      <p className="mt-2 max-w-2xl text-muted">
        Share of new TV anime tagged {name.toLowerCase()} each year since {TREND_FROM}. In {lastFull} it was {pct(t.to)}, {t.dir === "rise" ? `up from an average of ${pct(t.from)}` : t.dir === "decline" ? `down from an average of ${pct(t.from)}` : `close to the ${pct(t.from)} average`} a decade earlier.
      </p>

      <StatTiles
        className="mt-6"
        stats={[
          { label: `Share in ${lastFull}`, value: pct(last.share), sub: `${last.count} of ${last.total} new TV series` },
          { label: `Change since ${lastFull - 10}`, value: pts(last.share - tenAgo.share), sub: `from ${pct(tenAgo.share)}` },
          { label: "Peak year", value: String(peak.year), sub: `${pct(peak.share)} of new series` },
          { label: `${now} so far`, value: pct(cur.share), sub: `${cur.count} of ${cur.total} listed so far` },
        ]}
      />

      <div className="mt-3 space-y-3">
        <LineChart
          title={`${name} share of new TV anime`}
          subtitle={`Percent of TV series premiering each year that are tagged ${name.toLowerCase()} · ${now} is partial`}
          valueHeading="Share"
          labelHeading="Year"
          format="percent"
          yDomain={[0, niceTop(Math.max(...rows.map((r) => r.share)))]}
          xLabelEvery={5}
          labelKeys={[...new Set([String(TREND_FROM), String(peak.year), String(lastFull)])]}
          points={rows.map((r) => ({ key: String(r.year), label: String(r.year), fullLabel: `${r.year}${r.year === now ? " (so far)" : ""} · ${r.count} of ${r.total} series`, value: r.share, display: pct(r.share) }))}
        />
        <BarChart
          title={`${name} TV series per year`}
          subtitle={`How many new TV series were tagged ${name.toLowerCase()} · ${totalCount.toLocaleString()} from ${TREND_FROM} to ${lastFull}`}
          valueHeading="Series"
          integer
          labelKeys={[String(peak.year), String(lastFull)].filter((k, i, a) => a.indexOf(k) === i)}
          data={rows.map((r) => ({ key: String(r.year), label: `’${String(r.year).slice(2)}`, value: r.count, display: `${r.count} in ${r.year}`, mark: String(r.count) }))}
        />
      </div>

      <AdSlot slot="trends-mid" />

      <section className="mt-10">
        <h2 className="h-section mb-3">Defining {name.toLowerCase()} series by decade</h2>
        <div className="space-y-6">
          {decades.map(([label], i) => picks[i].items.length > 0 && (
            <div key={label}>
              <h3 className="mb-2 text-sm font-semibold text-muted">{label} · most followed</h3>
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">{picks[i].items.map((a: Anime) => <AnimeCard key={a.id} a={a} />)}</div>
            </div>
          ))}
        </div>
      </section>

      <section className="card mt-10 p-4 text-sm text-ink/80">
        <h2 className="font-semibold text-ink">How this is measured</h2>
        <p className="mt-1">Counts are TV series (not films, OVAs or web series) on Kitsu, grouped by the year they premiered, with the {name.toLowerCase()} tag. A series can carry many tags, so shares across genres add up to more than 100%. Kitsu&apos;s tagging has become more thorough over time and its listing of the latest year is still filling in, so treat sudden jumps in single years with caution; the long-run direction is the reliable part. <Link href={`/genre/${genre}`} className="text-violet hover:underline">Browse all {name.toLowerCase()} anime →</Link></p>
      </section>

      <section className="mt-10">
        <h2 className="h-section mb-3">Other genre trends</h2>
        <div className="flex flex-wrap gap-2">{others.map(([s, n]) => <Link key={s} href={`/trends/${s}`} className="chip">{n}</Link>)}<Link href="/trends" className="chip chip-active">All genres ranked →</Link></div>
      </section>

      <Faq
        title={`${name} anime trends FAQ`}
        items={[
          { q: `Is ${name.toLowerCase()} anime getting more popular?`, a: t.dir === "rise" ? `Yes. ${name} went from about ${pct(t.from)} of new TV anime around ${lastFull - 10} to ${pct(t.to)} in ${lastFull}.` : t.dir === "decline" ? `No, its share has fallen from about ${pct(t.from)} around ${lastFull - 10} to ${pct(t.to)} in ${lastFull}.` : `Its share has stayed roughly level, around ${pct(t.from)} a decade ago and ${pct(t.to)} in ${lastFull}.` },
          { q: `How many ${name.toLowerCase()} anime came out in ${lastFull}?`, a: `${last.count} new TV series tagged ${name.toLowerCase()} premiered in ${lastFull}, out of ${last.total} listed on Kitsu.` },
          { q: `When were ${name.toLowerCase()} anime most common?`, a: `${peak.year} was the peak, when ${pct(peak.share)} of new TV series were ${name.toLowerCase()}.${firstBig && firstBig.year !== peak.year ? ` It first reached half that level in ${firstBig.year}.` : ""}` },
        ]}
      />
    </div>
  );
}
