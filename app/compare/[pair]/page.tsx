import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound, permanentRedirect } from "next/navigation";
import { getAnimeBySlug, getProductions, listAnime, runtimeMinutes, fmtMinutes, posterUrl, animePath, comparePath, mainGenres, franchiseRoot, statusLabel, subtypeLabel, Anime } from "@/lib/kitsu";
import { abs } from "@/lib/site";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import Faq from "@/components/Faq";
import AdSlot from "@/components/AdSlot";
import GroupedColumns from "@/components/viz/GroupedColumns";
import BarChart from "@/components/viz/BarChart";

export const revalidate = 86400;
type Props = { params: Promise<{ pair: string }> };

/** Slugs can contain "-vs-", so try each split point until both halves resolve. */
async function resolve(pair: string): Promise<[Anime, Anime] | null> {
  const raw = decodeURIComponent(pair);
  const idxs: number[] = [];
  for (let i = raw.indexOf("-vs-"); i >= 0 && idxs.length < 3; i = raw.indexOf("-vs-", i + 1)) idxs.push(i);
  for (const i of idxs) {
    const [a, b] = await Promise.all([getAnimeBySlug(raw.slice(0, i)), getAnimeBySlug(raw.slice(i + 4))]);
    if (a && b && a.id !== b.id) return [a, b];
  }
  return null;
}

const score = (a: Anime) => (a.rating ? a.rating / 10 : null);
const favRate = (a: Anime) => (a.userCount ? (a.favoritesCount / a.userCount) * 100 : null);
const years = (a: Anime) => (a.startDate ? `${a.startDate.slice(0, 4)}${a.endDate && a.endDate.slice(0, 4) !== a.startDate.slice(0, 4) ? `–${a.endDate.slice(0, 4)}` : a.status === "current" ? "–now" : ""}` : "TBA");

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { pair } = await params;
  const r = await resolve(pair);
  if (!r) notFound();
  const [a, b] = r;
  const sa = score(a), sb = score(b);
  return {
    title: `${a.title} vs ${b.title} – Which Is Better? Scores, Length & Popularity`,
    description: `${a.title} vs ${b.title}: community score ${sa ? sa.toFixed(2) : "–"} vs ${sb ? sb.toFixed(2) : "–"}, ${fmtMinutes(runtimeMinutes(a))} vs ${fmtMinutes(runtimeMinutes(b))} to watch, ${a.userCount.toLocaleString()} vs ${b.userCount.toLocaleString()} members. Side-by-side score breakdown and genres.`,
    alternates: { canonical: comparePath(a, b) },
  };
}

export default async function ComparePage({ params }: Props) {
  const { pair } = await params;
  const r = await resolve(pair);
  if (!r) notFound();
  const canonical = comparePath(r[0], r[1]);
  if (`/compare/${pair}` !== canonical && `/compare/${encodeURIComponent(decodeURIComponent(pair))}` !== canonical) permanentRedirect(canonical);
  // Order by the canonical path so the page reads the same however it was reached.
  const [a, b] = r[0].slug.localeCompare(r[1].slug) <= 0 ? r : [r[1], r[0]];

  const [pa, pb, relA, relB] = await Promise.all([
    getProductions(a.id),
    getProductions(b.id),
    mainGenres(a)[0] ? listAnime({ filter: { categories: mainGenres(a)[0].slug }, sort: "-userCount", limit: 8 }) : Promise.resolve({ items: [] as Anime[] }),
    mainGenres(b)[0] ? listAnime({ filter: { categories: mainGenres(b)[0].slug }, sort: "-userCount", limit: 8 }) : Promise.resolve({ items: [] as Anime[] }),
  ]);
  const studio = (p: typeof pa) => p.filter((x) => x.role === "studio").map((x) => x.producer.name).join(", ") || "–";
  const sa = score(a), sb = score(b);
  const ra = runtimeMinutes(a), rb = runtimeMinutes(b);
  const fa = favRate(a), fb = favRate(b);
  const ga = mainGenres(a), gb = mainGenres(b);
  const shared = ga.filter((g) => gb.some((x) => x.slug === g.slug));

  type Row = { label: string; a: string; b: string; win?: "a" | "b" | null; note?: string };
  const better = (x: number | null, y: number | null, higher = true): "a" | "b" | null => (x === null || y === null || Math.abs(x - y) < 1e-9 ? null : (x > y) === higher ? "a" : "b");
  const rows: Row[] = [
    { label: "Community score", a: sa ? sa.toFixed(2) : "–", b: sb ? sb.toFixed(2) : "–", win: better(sa, sb), note: "higher" },
    { label: "Rank by score", a: a.ratingRank ? `#${a.ratingRank.toLocaleString()}` : "–", b: b.ratingRank ? `#${b.ratingRank.toLocaleString()}` : "–", win: better(a.ratingRank, b.ratingRank, false), note: "better" },
    { label: "Members", a: a.userCount.toLocaleString(), b: b.userCount.toLocaleString(), win: better(a.userCount, b.userCount), note: "more" },
    { label: "Favorited by", a: fa !== null ? `${fa.toFixed(1)}%` : "–", b: fb !== null ? `${fb.toFixed(1)}%` : "–", win: better(fa, fb), note: "more" },
    { label: "Time to watch", a: ra ? fmtMinutes(ra) : "–", b: rb ? fmtMinutes(rb) : "–", win: better(ra || null, rb || null, false), note: "shorter" },
    { label: "Episodes", a: a.episodeCount ? String(a.episodeCount) : a.status === "current" ? "Ongoing" : "–", b: b.episodeCount ? String(b.episodeCount) : b.status === "current" ? "Ongoing" : "–" },
    { label: "Format", a: subtypeLabel(a.subtype), b: subtypeLabel(b.subtype) },
    { label: "Aired", a: years(a), b: years(b) },
    { label: "Status", a: statusLabel(a.status), b: statusLabel(b.status) },
    { label: "Studio", a: studio(pa), b: studio(pb) },
    { label: "Age rating", a: a.ageRating || "–", b: b.ageRating || "–" },
  ];

  const verdict: string[] = [];
  if (sa && sb) verdict.push(Math.abs(sa - sb) < 0.1 ? `Scores are effectively tied: ${sa.toFixed(2)} vs ${sb.toFixed(2)}.` : `${sa > sb ? a.title : b.title} is rated higher by the community: ${Math.max(sa, sb).toFixed(2)} vs ${Math.min(sa, sb).toFixed(2)}.`);
  if (a.userCount && b.userCount) { const big = a.userCount >= b.userCount ? a : b, small = big === a ? b : a; const x = big.userCount / Math.max(1, small.userCount); verdict.push(x < 1.15 ? "Both have a similar-sized audience." : `${big.title} is more widely watched, with ${x >= 10 ? Math.round(x) : x.toFixed(1)}× the members.`); }
  if (ra && rb) { const short = ra <= rb ? a : b; const diff = Math.abs(ra - rb); verdict.push(diff < 30 ? `They take about the same time to watch (${fmtMinutes(ra)} vs ${fmtMinutes(rb)}).` : `${short.title} is the quicker watch, ${fmtMinutes(diff)} shorter.`); }
  if (fa !== null && fb !== null && Math.abs(fa - fb) >= 0.5) verdict.push(`Fans favorite ${fa > fb ? a.title : b.title} more often (${Math.max(fa, fb).toFixed(1)}% vs ${Math.min(fa, fb).toFixed(1)}% of members).`);
  verdict.push(shared.length ? `They share ${shared.map((g) => g.title).join(", ")}.` : "They have no main genre in common, so they suit different moods.");

  const dists = a.ratingDist && b.ratingDist ? [a.ratingDist, b.ratingDist] : null;
  const totals = dists?.map((d) => d.reduce((n, v) => n + v, 0));
  const pct = dists && totals && totals.every((t) => t >= 20) ? (dists.map((d, i) => d.map((v) => (v / totals[i]) * 100)) as [number[], number[]]) : null;
  const top2 = pct ? pct.map((p) => p[8] + p[9]) : null;

  const others = (x: Anime, rel: { items: Anime[] }, avoid: Anime) => rel.items.filter((o) => o.id !== x.id && o.id !== avoid.id && franchiseRoot(o.title) !== franchiseRoot(x.title)).slice(0, 4);
  const moreA = others(a, relA, b), moreB = others(b, relB, a);

  const ld = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${a.title} vs ${b.title}`,
    itemListElement: [a, b].map((x, i) => ({ "@type": "ListItem", position: i + 1, url: abs(animePath(x)), name: x.title })),
  };

  return (
    <div className="container-x pb-8">
      <JsonLd data={ld} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/compare", label: "Compare" }, { href: canonical, label: `${a.title} vs ${b.title}` }]}
        eyebrow="Head to head"
        title={<>{a.title} <span className="text-gradient">vs</span> {b.title}</>}
        subtitle="Side by side on community score, how it's rated, audience size and how long each takes to watch. Data from Kitsu, refreshed daily."
        hue={350}
        backdrop={a.cover?.large || b.cover?.large || null}
      />

      <div className="mt-8 grid grid-cols-[1fr_auto_1fr] items-center gap-3 sm:gap-6">
        {[a, b].map((x, i) => (
          <Link key={x.id} href={animePath(x)} className={`card flex flex-col items-center gap-2 p-3 text-center transition duration-300 hover:-translate-y-0.5 hover:border-violet sm:flex-row sm:text-left ${i === 1 ? "col-start-3" : ""}`}>
            <span className={`h-1 w-10 rounded-full sm:hidden ${i ? "bg-viz-2" : "bg-viz-1"}`} aria-hidden />
            <div className="relative h-28 w-20 shrink-0 overflow-hidden rounded-md bg-bg-2">{posterUrl(x, "small") && <Image src={posterUrl(x, "small")!} alt="" fill sizes="80px" className="object-cover" />}</div>
            <div className="min-w-0">
              <p className="hidden items-center gap-1.5 text-[10px] uppercase tracking-wider text-muted sm:flex"><span className={`h-2.5 w-3.5 rounded-[2px] ${i ? "bg-viz-2" : "bg-viz-1"}`} aria-hidden />{i ? "Right" : "Left"} in charts</p>
              <p className="line-clamp-2 font-semibold">{x.title}</p>
              <p className="text-sm text-muted">{score(x) ? `★ ${score(x)!.toFixed(2)}` : "Unrated"} · {years(x)}</p>
            </div>
          </Link>
        ))}
        <span className="col-start-2 row-start-1 grid h-11 w-11 place-items-center rounded-full border border-white/15 bg-gradient-to-br from-accent/30 to-violet/30 text-sm font-black text-ink shadow-[0_0_30px_-5px_rgba(255,77,141,.5)]">VS</span>
      </div>

      <section className="card mt-6 p-4">
        <h2 className="font-semibold">The short version</h2>
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink/90">{verdict.map((v) => <li key={v}>{v}</li>)}</ul>
      </section>

      <section className="mt-6 overflow-x-auto">
        <table className="card w-full min-w-[480px] border-collapse text-sm">
          <thead>
            <tr className="text-left text-xs text-muted">
              <th className="p-3 font-medium" />
              <th className="p-3 font-medium"><span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-3.5 rounded-[2px] bg-viz-1" aria-hidden />{a.title}</span></th>
              <th className="p-3 font-medium"><span className="inline-flex items-center gap-1.5"><span className="h-2.5 w-3.5 rounded-[2px] bg-viz-2" aria-hidden />{b.title}</span></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.label} className="border-t border-line">
                <th scope="row" className="p-3 text-left font-normal text-muted">{row.label}</th>
                {(["a", "b"] as const).map((k) => (
                  <td key={k} className={`p-3 tabular-nums ${row.win === k ? "font-semibold text-ink" : "text-ink/80"}`}>
                    {row[k]}{row.win === k && <span className="ml-1.5 rounded bg-white/5 px-1 py-0.5 text-[10px] font-semibold uppercase text-muted">{row.note}</span>}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <AdSlot slot="compare-mid" />

      <div className="mt-6 grid gap-3 lg:grid-cols-2">
        {pct && (
          <GroupedColumns
            title="How each is rated"
            subtitle={top2 ? `Share of ratings at each star level · 9★–10★: ${Math.round(top2[0])}% vs ${Math.round(top2[1])}%` : undefined}
            series={[{ key: a.id, label: a.title }, { key: b.id, label: b.title }]}
            categories={Array.from({ length: 10 }, (_, i) => ({ key: String(i + 1), label: `${i + 1}★` }))}
            values={pct}
            unit="%"
          />
        )}
        {ra > 0 && rb > 0 && (
          <BarChart
            orientation="bar"
            title="Time to watch"
            subtitle={`Episodes × episode length, openings included`}
            valueHeading="Runtime"
            data={[a, b].map((x) => ({ key: x.id, label: x.title, value: runtimeMinutes(x), display: fmtMinutes(runtimeMinutes(x)), href: animePath(x) }))}
          />
        )}
      </div>

      <section className="mt-6 grid gap-3 sm:grid-cols-3">
        <div className="card p-4"><p className="text-xs text-muted">Only {a.title}</p><div className="mt-2 flex flex-wrap gap-1.5">{ga.filter((g) => !shared.includes(g)).map((g) => <Link key={g.id} href={`/genre/${g.slug}`} className="chip">{g.title}</Link>)}</div></div>
        <div className="card p-4"><p className="text-xs text-muted">Shared genres</p><div className="mt-2 flex flex-wrap gap-1.5">{shared.length ? shared.map((g) => <Link key={g.id} href={`/genre/${g.slug}`} className="chip chip-active">{g.title}</Link>) : <span className="text-sm text-muted">None</span>}</div></div>
        <div className="card p-4"><p className="text-xs text-muted">Only {b.title}</p><div className="mt-2 flex flex-wrap gap-1.5">{gb.filter((g) => !shared.some((s) => s.slug === g.slug)).map((g) => <Link key={g.id} href={`/genre/${g.slug}`} className="chip">{g.title}</Link>)}</div></div>
      </section>

      {(moreA.length > 0 || moreB.length > 0) && (
        <section className="mt-10">
          <h2 className="h-section mb-3">More comparisons</h2>
          <div className="flex flex-wrap gap-2">
            {moreA.map((o) => <Link key={`a${o.id}`} href={comparePath(a, o)} className="chip">{a.title} vs {o.title}</Link>)}
            {moreB.map((o) => <Link key={`b${o.id}`} href={comparePath(b, o)} className="chip">{b.title} vs {o.title}</Link>)}
          </div>
        </section>
      )}

      <Faq
        title={`${a.title} vs ${b.title} FAQ`}
        items={[
          { q: `Is ${a.title} better than ${b.title}?`, a: sa && sb ? `By community score, ${sa >= sb ? a.title : b.title} is ahead (${Math.max(sa, sb).toFixed(2)} vs ${Math.min(sa, sb).toFixed(2)}). ${shared.length ? `Both are ${shared.slice(0, 2).map((g) => g.title.toLowerCase()).join(" and ")}, so taste decides the rest.` : "They are quite different shows, so the better pick depends on what you're in the mood for."}` : "Not enough ratings yet to compare scores." },
          { q: `Which is longer, ${a.title} or ${b.title}?`, a: ra && rb ? `${ra >= rb ? a.title : b.title} is longer: ${fmtMinutes(Math.max(ra, rb))} against ${fmtMinutes(Math.min(ra, rb))}.` : "Runtime data is incomplete for one of them." },
          { q: `Which is more popular?`, a: `${a.userCount >= b.userCount ? a.title : b.title} has more members on Kitsu (${Math.max(a.userCount, b.userCount).toLocaleString()} vs ${Math.min(a.userCount, b.userCount).toLocaleString()}).` },
          { q: `If I liked ${a.title}, will I like ${b.title}?`, a: shared.length ? `Probably, if it was the ${shared.map((g) => g.title.toLowerCase()).join(", ")} side you enjoyed.` : `Not necessarily: they don't share a main genre. Try the “anime like ${a.title}” list instead.` },
        ]}
      />
    </div>
  );
}
