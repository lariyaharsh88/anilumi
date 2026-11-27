// Query-string variants (?page=, ?sort=, filters). Reached only through the rewrites in next.config.ts;
import { fitDescription, fitTitle } from "@/lib/titles";
import { robotsFor, bestYearIndexed } from "@/lib/indexing";
// the plain URL is served by ../page.tsx from the ISR cache.
import type { Metadata } from "next";
import Link from "@/components/Link";
import { notFound } from "next/navigation";
import { listAnime, posterUrl, animePath, type Anime } from "@/lib/kitsu";
import { dubBySlug, dubHref } from "@/lib/hindidub";
import { streamsFor, servicesIn } from "@/lib/streams";
import AnimeGrid from "@/components/AnimeGrid";
import PageHero from "@/components/PageHero";
import Pagination from "@/components/Pagination";
import Faq from "@/components/Faq";
import AdSlot from "@/components/AdSlot";
import AnswerLead from "@/components/AnswerLead";

const LIMIT = 20;
const MIN_YEAR = 1980;
const SORTS: Record<string, { label: string; sort: string }> = { rated: { label: "Top rated", sort: "ratingRank" }, popular: { label: "Most popular", sort: "-userCount" } };
type Props = { params: Promise<{ year: string }>; searchParams: Promise<{ page?: string; sort?: string }> };

const valid = (y: string) => /^\d{4}$/.test(y) && Number(y) >= MIN_YEAR && Number(y) <= new Date().getFullYear() + 1;

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { year } = await params;
  const { page, sort } = await searchParams;
  if (!valid(year)) notFound();
  const s = SORTS[sort || "rated"] ? sort || "rated" : "rated";
  const cur = Number(year) === new Date().getFullYear();
  // From November the year is all but over and "best anime 2026" / "top anime 2026" peak (US 8.1K / 5.4K a month in
  // October and climbing, Keyword Planner): the title stops saying "So Far".
  const yearEnd = cur && new Date().getMonth() >= 10;
  const so = cur && !yearEnd ? " (So Far)" : "";
  return {
    // "top-rated anime of the year" and "best anime of <year>" (Bing, Nov 2026); year-end lists peak in December.
    title: Number(page) > 1 || s !== "rated"
      ? `Best Anime of ${year}${so} – ${SORTS[s].label}${Number(page) > 1 ? ` Page ${page}` : ""}`
      : fitTitle([`Best Anime of ${year}${so}: Top-Rated Shows of the Year, Ranked`, `Best Anime of ${year}${so}: Top Rated, Ranked`, `Best Anime of ${year} – Top Rated`]),
    description: fitDescription(`The best anime that premiered in ${year}, ranked by ${s === "rated" ? "average fan score" : "how many fans watched them"} on Kitsu: the top shows of each season, the most popular, the best in Hindi, and where to watch each one legally.`),
    alternates: { canonical: `/best/${year}${s !== "rated" ? `?sort=${s}` : ""}${Number(page) > 1 ? `${s !== "rated" ? "&" : "?"}page=${page}` : ""}` },
    // The last ten years and any year search already shows; never the sorted or paged copies.
    robots: robotsFor(s === "rated" && !(Number(page) > 1) && bestYearIndexed(Number(year))),
  };
}

export default async function BestOfYear({ params, searchParams }: Props) {
  const { year } = await params;
  const { page: pageStr, sort: sortStr } = await searchParams;
  if (!valid(year)) notFound();
  const y = Number(year);
  const sortKey = SORTS[sortStr || "rated"] ? sortStr || "rated" : "rated";
  const page = Math.min(25, Math.max(1, Number(pageStr) || 1));
  const data = await listAnime({ filter: { seasonYear: year }, sort: SORTS[sortKey].sort, limit: LIMIT, offset: (page - 1) * LIMIT });
  const cur = y === new Date().getFullYear();
  const main = page === 1 && sortKey === "rated";
  // The year in review (page 1 of the main ranking only): each season's best, the most watched, the best in Hindi,
  // and where the top five stream. Kitsu fan scores and member counts; Hindi and streaming from our own research.
  const SEASON_NAMES = ["winter", "spring", "summer", "fall"] as const;
  const [bySeason, popular] = main ? await Promise.all([
    Promise.all(SEASON_NAMES.map((se) => listAnime({ filter: { season: se, seasonYear: year }, sort: "ratingRank", limit: 3 }).then((r) => ({ se, items: r.items.filter((a) => a.rating) })).catch(() => ({ se, items: [] as Anime[] })))),
    listAnime({ filter: { seasonYear: year }, sort: "-userCount", limit: 20 }).then((r) => [...r.items].sort((x, z) => z.userCount - x.userCount).slice(0, 10)).catch(() => [] as Anime[]),
  ]) : [[], []];
  const seen = new Map<string, Anime>();
  for (const a of [...data.items, ...popular, ...bySeason.flatMap((b) => b.items)]) seen.set(a.slug, a);
  // The dub entry for this exact season only: a franchise entry (Season 1 in Hindi) would claim a new season is dubbed.
  const inHindi = [...seen.values()].flatMap((a) => { const d = dubBySlug(a.slug); return d?.status === "available" ? [{ a, d }] : []; }).sort((x, z) => (z.a.rating || 0) - (x.a.rating || 0)).slice(0, 8);
  const watch = data.items.slice(0, 5).map((a) => { const st = streamsFor(a); return { a, us: st ? servicesIn(st, "US").filter((v) => v.kind !== "buy").map((v) => v.service) : [], in: st ? servicesIn(st, "IN").filter((v) => v.kind !== "buy").map((v) => v.service) : [] }; }).filter((w) => w.us.length || w.in.length);
  const cap = (x: string) => x[0].toUpperCase() + x.slice(1);
  // The English name people search ("Frieren: Beyond Journey's End Season 2"), when Kitsu has a short one.
  const en = (a: Anime) => (a.titleEn && a.titleEn.length <= 70 ? a.titleEn : a.title);
  return (
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/lists", label: "Lists" }, { href: `/best/${year}`, label: `Best of ${year}` }]}
        eyebrow={`Year in review · ${year}`}
        title={<>Best anime of <span className="text-gradient">{year}</span>{cur && new Date().getMonth() < 10 ? " so far" : ""}</>}
        subtitle={`Ranked by ${SORTS[sortKey].label.toLowerCase()}${cur ? ", updated hourly as the year goes on" : ""}.`}
        facts={[{ value: data.total.toLocaleString(), label: `titles premiered in ${year}` }]}
        hue={40}
        posters={data.items.slice(0, 3).map((x) => posterUrl(x, "medium"))}
      >
      <div className="flex flex-wrap gap-2">
        {Object.entries(SORTS).map(([k, v]) => (
          <Link key={k} href={`/best/${year}${k !== "rated" ? `?sort=${k}` : ""}`} className={`chip ${k === sortKey ? "chip-active" : ""}`}>{v.label}</Link>
        ))}
        <span className="mx-2 text-muted">·</span>
        {[y - 2, y - 1, y, y + 1].filter((yy) => valid(String(yy))).map((yy) => (
          <Link key={yy} href={`/best/${yy}`} className={`chip ${yy === y ? "chip-active" : ""}`}>{yy}</Link>
        ))}
      </div>
      </PageHero>
      {page === 1 && sortKey === "rated" && data.items.length >= 3 && (
        <AnswerLead checked={cur ? new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "Asia/Kolkata" }) : undefined}>
          The best anime of {year}{cur ? " so far" : ""}, by fan score: {data.items.slice(0, 5).map((a, i) => `${i + 1}. ${a.title}${a.rating ? ` (${(a.rating / 10).toFixed(1)})` : ""}`).join(", ")}. Kitsu lists {data.total.toLocaleString()} anime that premiered in {year}{cur ? "; the ranking updates as the year goes on" : ""}.
        </AnswerLead>
      )}
      <AdSlot slot="best-top" />
      <div className="mt-6"><AnimeGrid items={data.items} startRank={(page - 1) * LIMIT + 1} ld={`Best anime of ${year}: ${SORTS[sortKey].label.toLowerCase()}`} /></div>
      <Pagination page={page} total={Math.min(data.total, LIMIT * 25)} limit={LIMIT} base={`/best/${year}${sortKey !== "rated" ? `?sort=${sortKey}` : ""}`} />
      {main && bySeason.some((b) => b.items.length) && (
        <section className="reveal pt-10" aria-labelledby="seasons-h">
          <h2 id="seasons-h" className="h-section mb-3">The best of each {year} season</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {bySeason.filter((b) => b.items.length).map((b) => (
              <div key={b.se} className="card p-4">
                <h3 className="font-semibold text-ink"><Link href={`/season/${year}/${b.se}`} className="hover:text-violet-2">{cap(b.se)} {year}</Link></h3>
                <ol className="mt-2 space-y-1 text-sm">{b.items.map((a, i) => <li key={a.slug}><span className="text-muted">{i + 1}.</span> <Link href={animePath(a)} className="text-ink/90 hover:text-violet-2">{en(a)}</Link> <span className="text-xs text-muted">★ {((a.rating || 0) / 10).toFixed(1)}</span></li>)}</ol>
              </div>
            ))}
          </div>
        </section>
      )}
      {main && popular.length >= 5 && (
        <section className="reveal pt-10" aria-labelledby="popular-h">
          <h2 id="popular-h" className="h-section mb-1">The most popular anime of {year}</h2>
          <p className="mb-3 text-sm text-muted">By how many Kitsu members added them, which isn&apos;t the same as the best rated.</p>
          <ol className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-2">{popular.map((a, i) => <li key={a.slug}><span className="text-muted">{i + 1}.</span> <Link href={animePath(a)} className="text-ink/90 hover:text-violet-2">{en(a)}</Link> <span className="text-xs text-muted">{a.userCount.toLocaleString("en-US")} members</span></li>)}</ol>
        </section>
      )}
      {main && inHindi.length >= 3 && (
        <section className="reveal pt-10" aria-labelledby="hindi-h">
          <h2 id="hindi-h" className="h-section mb-1">The best {year} anime in Hindi</h2>
          <p className="mb-3 text-sm text-muted">Shows from {year}&apos;s top lists with an official Hindi dub, best rated first.</p>
          <ul className="flex flex-wrap gap-2">{inHindi.map(({ a, d }) => <li key={a.slug}><Link href={dubHref(d)} className="chip">{en(a)} <span className="text-muted">· {d.platforms[0]?.name}</span></Link></li>)}</ul>
        </section>
      )}
      {main && watch.length > 0 && (
        <section className="reveal pt-10" aria-labelledby="watch-h">
          <h2 id="watch-h" className="h-section mb-3">Where to watch the top {year} anime</h2>
          <div className="card overflow-x-auto"><table className="w-full min-w-[480px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-muted"><tr><th className="px-4 py-2">Anime</th><th className="px-4 py-2">🇺🇸 US</th><th className="px-4 py-2">🇮🇳 India</th></tr></thead>
            <tbody className="divide-y divide-line">{watch.map((w) => <tr key={w.a.slug}><td className="px-4 py-2"><Link href={animePath(w.a)} className="text-ink hover:text-violet-2">{en(w.a)}</Link></td><td className="px-4 py-2 text-ink/85">{w.us.join(", ") || "—"}</td><td className="px-4 py-2 text-ink/85">{w.in.join(", ") || "—"}</td></tr>)}</tbody>
          </table></div>
        </section>
      )}
      <Faq
        items={[
          { q: `What is the best anime of ${year}?`, a: data.items[0] ? `By community rating, ${data.items[0].title} leads ${year}${data.items[0].rating ? ` with a score of ${(data.items[0].rating / 10).toFixed(1)}/10` : ""}.` : `Rankings for ${year} will appear once titles are rated.` },
          { q: `How many anime came out in ${year}?`, a: `Kitsu lists ${data.total} anime that premiered in ${year}, including TV series, movies, OVAs and web shorts.` },
          ...(main && data.items[0] ? [{ q: `What is the anime of the year ${year}?`, a: `Award shows name their own, usually early the next year. By fan score, the highest-rated ${year} anime are ${data.items.slice(0, 3).map(en).join(", ")}${popular[0] ? `; the most watched is ${en(popular[0])}` : ""}.` }] : []),
          ...(main && popular[0] ? [{ q: `What is the most popular anime of ${year}?`, a: `${en(popular[0])}, followed by ${popular.slice(1, 4).map(en).join(", ")}, by how many Kitsu members added them.` }] : []),
          ...(main && inHindi.length ? [{ q: `Which ${year} anime are in Hindi?`, a: `${inHindi.slice(0, 5).map(({ a, d }) => `${en(a)} (${d.platforms[0]?.name})`).join(", ")} have an official Hindi dub.` }] : []),
        ]}
      />
    </div>
  );
}
