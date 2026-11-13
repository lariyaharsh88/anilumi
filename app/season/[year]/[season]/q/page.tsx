// Query-string variants (?page=, ?sort=, filters). Reached only through the rewrites in next.config.ts;
import { DUBS_SEASON, dubShows, type DubShow } from "@/lib/dubschedule";
import { seasonDubs, SEASON_DUBS_CHECKED, type SeasonDub } from "@/lib/seasondubs";
import { previewSnapshot } from "@/lib/preview";
import MadeBy from "@/components/MadeBy";
import { fitTitle, fitDescription } from "@/lib/titles";
// the plain URL is served by ../page.tsx from the ISR cache.
import type { Metadata } from "next";
import Link from "@/components/Link";
import { notFound } from "next/navigation";
import { getSeason, SEASONS, Season, cap, shiftSeason, seasonOf, countAnime, animePath, posterUrl } from "@/lib/kitsu";
import StatTiles from "@/components/viz/StatTiles";
import StackedBar from "@/components/viz/StackedBar";
import BarChart from "@/components/viz/BarChart";
import AnimeGrid from "@/components/AnimeGrid";
import PageHero from "@/components/PageHero";
import Pagination from "@/components/Pagination";
import Faq from "@/components/Faq";
import AdSlot from "@/components/AdSlot";
import BrowseFilter from "@/components/BrowseFilter";
import Image from "next/image";
import SectionNav from "@/components/fx/SectionNav";
import { seasonNumbers } from "@/lib/seasonstats";
import { seasonStreaming } from "@/lib/seasonstreams";
import type { PreviewItem } from "@/lib/preview";

const showName = (i: PreviewItem) => i.anime?.titleEn || i.title || i.anime?.title || "";
const KIND_LABEL = { new: "New", sequel: "Sequel", movie: "Movie" } as const;

type Props = { params: Promise<{ year: string; season: string }>; searchParams: Promise<{ page?: string }> };
const LIMIT = 20;

function valid(year: string, season: string) {
  const y = Number(year);
  return SEASONS.includes(season as Season) && y >= 1960 && y <= new Date().getFullYear() + 2;
}

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { year, season } = await params;
  const { page } = await searchParams;
  if (!valid(year, season)) notFound();
  const p = Number(page) > 1 ? ` – Page ${page}` : "";
  // The searched answer up front ("anime airing in fall 2026"): how many, whether they're airing now, the top titles.
  const now = seasonOf();
  const current = now.season === season && now.year === Number(year);
  const first = Number(page) > 1 ? null : await getSeason(Number(year), season as Season, 1, 20).catch(() => null);
  const total = first?.total ?? 0;
  // The shows people know, by the names they search: AniList's English titles and popularity from the season preview
  // snapshot when it has the season, else Kitsu's most followed. Short names only, so the snippet keeps its point.
  const preview = previewSnapshot().seasons[`${year}-${season}`] ?? [];
  const short = (t: string) => t.length <= 28;
  const tops = (preview.length
    ? [...preview].sort((a, b) => b.popularity - a.popularity).map((i) => i.title)
    : [...(first?.items ?? [])].sort((a, b) => b.userCount - a.userCount).map((a) => a.titleEn || a.title)
  ).filter(short).slice(0, 3);
  const label = `${cap(season)} ${year}`;
  const dubs = `${label}` === DUBS_SEASON ? dubShows().filter((e) => e.status !== "complete" && e.lang === "en").length : seasonDubs(Number(year), season)?.en.length ?? 0;
  return {
    // Bing ranks the current season at #2 for "anime airing in fall 2026" with no clicks: say "airing now" up front.
    title: p ? `${label} Anime – Full Season Chart${p}` : fitTitle([
      total && current ? `${label} Anime Airing Now: All ${total} Shows & Where to Watch` : null,
      total ? `${label} Anime: All ${total} Shows, Air Days & Where to Watch` : null,
      total ? `${label} Anime: All ${total} Shows${current ? " Airing Now" : ""}, Ranked` : null,
      `${label} Anime – Full Season Chart`,
    ]),
    description: fitDescription(`${total ? `All ${total} ${label} anime${current ? " airing now" : ""}` : `Every ${label} anime`} with air days, where to stream${dubs ? `, ${dubs} English dubs` : ""} and fan scores${tops.length ? `: ${tops.join(", ")} and more` : ""}.`),
    alternates: { canonical: `/season/${year}/${season}${Number(page) > 1 ? `?page=${page}` : ""}` },
  };
}

export default async function SeasonPage({ params, searchParams }: Props) {
  const { year, season } = await params;
  const { page: pageStr } = await searchParams;
  if (!valid(year, season)) notFound();
  const y = Number(year);
  const s = season as Season;
  const page = Math.max(1, Number(pageStr) || 1);
  const sf = { season: s, seasonYear: year };
  const FORMATS = [["TV", "TV series"], ["movie", "Movies"], ["ONA", "ONA (web)"], ["OVA", "OVA"], ["special", "Specials"], ["music", "Music"]] as const;
  const [data, formatCounts, airingNow, upcomingCount] = await Promise.all([
    getSeason(y, s, page, LIMIT),
    page === 1 ? Promise.all(FORMATS.map(([f]) => countAnime({ ...sf, subtype: f }, 3600, true))) : Promise.resolve([] as number[]),
    page === 1 ? countAnime({ ...sf, status: "current" }, 3600, true) : Promise.resolve(0),
    page === 1 ? countAnime({ ...sf, status: "upcoming" }, 3600, true) : Promise.resolve(0),
  ]);
  const rated = data.items.filter((a) => a.rating);
  const avgScore = rated.length ? rated.reduce((n, a) => n + (a.rating || 0), 0) / rated.length / 10 : null;
  const prev = shiftSeason(s, y, -1);
  const next = shiftSeason(s, y, 1);
  const now = seasonOf();
  const isCurrent = now.season === s && now.year === y;

  const preview = page === 1 ? previewSnapshot().seasons[`${year}-${season}`] ?? [] : [];
  const sn = preview.length >= 10 ? seasonNumbers(preview) : null;
  const nextPreview = previewSnapshot().seasons[`${next.year}-${next.season}`] ?? [];
  const streams = sn ? await seasonStreaming(y, s).catch(() => null) : null;
  const byAl = new Map(preview.map((i) => [i.id, i]));
  const services = streams?.services.filter((x) => x.ids.length >= 2).slice(0, 8) ?? [];
  const label = `${cap(season)} ${year}`;
  const PosterCard = ({ i, badge }: { i: PreviewItem; badge?: string }) => {
    const body = (
      <>
        <span className="relative block aspect-[5/7] overflow-hidden rounded-xl border border-line bg-bg-2">
          {i.cover && <Image src={i.cover} alt={`${showName(i)} poster`} fill sizes="(max-width:640px) 30vw, 160px" className="object-cover transition duration-500 group-hover:scale-105" />}
          {badge && <span className="absolute left-1.5 top-1.5 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">{badge}</span>}
        </span>
        <span className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug text-ink group-hover:text-violet-2">{showName(i)}</span>
        <span className="block truncate text-xs text-muted">{[i.studio, i.source].filter(Boolean).join(" · ")}</span>
      </>
    );
    return i.anime ? <Link href={animePath(i.anime)} className="group block">{body}</Link> : <div className="group">{body}</div>;
  };
  const nameLink = (i: PreviewItem) => (i.anime ? <Link href={animePath(i.anime)} className="text-ink hover:text-violet-2">{showName(i)}</Link> : <span className="text-ink">{showName(i)}</span>);

  const months: Record<Season, string> = { winter: "January to March", spring: "April to June", summer: "July to September", fall: "October to December" };

  return (
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/season", label: "Seasons" }, { href: `/season/${year}/${season}`, label: `${cap(season)} ${year}` }]}
        eyebrow={`Seasonal chart · ${months[s]}`}
        title={<><span className="text-gradient">{cap(season)} {year}</span> anime</>}
        subtitle={`Every new series, sequel and film of the season, ranked by how many fans follow it.`}
        hue={{ winter: 200, spring: 330, summer: 40, fall: 20 }[s]}
        posters={data.items.slice(0, 3).map((x) => posterUrl(x, "medium"))}
      >
      <div className="flex flex-wrap items-center gap-2">
        <Link href={`/season/${prev.year}/${prev.season}`} className="chip">← {cap(prev.season)} {prev.year}</Link>
        {SEASONS.map((ss) => (
          <Link key={ss} href={`/season/${year}/${ss}`} className={`chip ${ss === s ? "chip-active" : ""}`}>{cap(ss)}</Link>
        ))}
        <Link href={`/season/${next.year}/${next.season}`} className="chip">{cap(next.season)} {next.year} →</Link>
        <Link href={`/season/${year}/${season}/preview`} className="chip chip-active">📋 {cap(season)} {year} preview guide</Link>
      </div>
      <div className="mt-2 flex flex-wrap gap-2 text-xs">
        {[y - 2, y - 1, y, y + 1].map((yy) => (
          <Link key={yy} href={`/season/${yy}/${season}`} className={`chip ${yy === y ? "chip-active" : ""}`}>{yy}</Link>
        ))}
      </div>
      </PageHero>
      <MadeBy className="mt-4" method="The season list comes from Kitsu and AniList, ranked by how many people follow each show; air times are checked against the broadcast schedule." />
      {page === 1 && data.total > 0 && (
        <SectionNav sections={[
          { id: "glance", label: "At a glance" },
          ...(sn ? [{ id: "popular", label: "Most popular" }, { id: "days", label: "By air day" }, { id: "new-sequels", label: "New vs sequels" }] : []),
          { id: "dubs", label: "Dubs" },
          ...(services.length ? [{ id: "streaming", label: "Where to stream" }] : []),
          ...(sn ? [{ id: "studios", label: "Studios & sources" }] : []),
          { id: "all", label: `All ${data.total}` },
          ...(nextPreview.length ? [{ id: "next", label: `${cap(next.season)} ${next.year}` }] : []),
          { id: "faq", label: "FAQ" },
        ]} />
      )}

      {page === 1 && data.total > 0 && (
        <section id="glance" data-section className="reveal space-y-3 pt-10" aria-labelledby="glance-h">
          <h2 id="glance-h" className="h-section">{label} anime at a glance</h2>
          {sn && <p className="max-w-3xl text-sm leading-6 text-muted">{label} brings {sn.fresh.length} new series, {sn.sequels.length} sequels and {sn.movies.length} films among its {sn.total} most-followed titles. {sn.sources[0] ? `Most are adapted from ${sn.sources[0].label.toLowerCase()}s (${sn.sources[0].value})` : ""}{sn.studios[0] ? `, and ${sn.studios[0].label} has the most shows (${sn.studios[0].value})` : ""}. {sn.busiestDay.items.length ? `${sn.busiestDay.day} is the busiest day, with ${sn.busiestDay.items.length} series premiering.` : ""}</p>}
          <StatTiles
            stats={[
              { label: "Titles this season", value: data.total.toLocaleString() },
              { label: "Airing now", value: airingNow.toLocaleString() },
              { label: "Not started yet", value: upcomingCount.toLocaleString() },
              { label: "Avg score, top 20", value: avgScore ? avgScore.toFixed(1) : "–", sub: avgScore ? `${rated.length} rated titles` : "No ratings yet" },
            ]}
          />
          <div className="grid gap-3 lg:grid-cols-2">
            <StackedBar title="Format mix" subtitle={`What ${cap(season)} ${year} is made of`} segments={FORMATS.map(([k, label], i) => ({ key: k, label, value: formatCounts[i] || 0 }))} />
            <BarChart
              orientation="bar"
              title="Most followed"
              subtitle="Kitsu members tracking each title"
              valueHeading="Members"
              data={[...data.items].sort((x, y) => y.userCount - x.userCount).slice(0, 8).map((a) => ({ key: a.id, label: a.title, value: a.userCount, display: a.userCount.toLocaleString(), href: animePath(a) }))}
            />
          </div>
        </section>
      )}

      {sn && (
        <>
          <section id="popular" data-section className="reveal pt-10" aria-labelledby="pop-h">
            <h2 id="pop-h" className="h-section mb-1">Most popular {label} anime</h2>
            <p className="mb-4 text-sm text-muted">The {label} shows most AniList members are following, with studio and source.</p>
            <ul className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-6">
              {[...preview].sort((a, b) => b.popularity - a.popularity).slice(0, 12).map((i) => <li key={i.id} className="min-w-0"><PosterCard i={i} badge={KIND_LABEL[i.kind]} /></li>)}
            </ul>
          </section>

          <section id="days" data-section className="reveal pt-10" aria-labelledby="days-h">
            <div className="mb-1 flex items-end justify-between gap-3">
              <h2 id="days-h" className="h-section">{label} anime by air day</h2>
              <Link href="/schedule" className="shrink-0 text-sm font-medium text-violet hover:text-violet-2">This week&apos;s times →</Link>
            </div>
            <p className="mb-4 max-w-3xl text-sm text-muted">The day each series premiered in Japan, which is its weekly slot. Streams outside Japan usually land the same day or the next.</p>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
              {sn.days.map((d) => (
                <div key={d.day} className="card p-3.5">
                  <h3 className="flex items-baseline justify-between font-semibold text-ink">{d.day}<span className="text-xs font-normal text-muted">{d.items.length} shows</span></h3>
                  <ul className="mt-2 space-y-1 text-sm">{d.items.slice(0, 8).map((i) => <li key={i.id} className="truncate">{nameLink(i)}</li>)}</ul>
                  {d.items.length > 8 && <p className="mt-1 text-xs text-muted">+{d.items.length - 8} more</p>}
                </div>
              ))}
            </div>
          </section>

          <section id="new-sequels" data-section className="reveal pt-10" aria-labelledby="ns-h">
            <h2 id="ns-h" className="h-section mb-4">New {label} anime vs sequels</h2>
            <div className="grid gap-3 md:grid-cols-2">
              <div className="card p-4">
                <h3 className="font-semibold text-ink">🆕 {sn.fresh.length} new series</h3>
                <p className="text-xs text-muted">No prequel to catch up on: start here.</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">{sn.fresh.slice(0, 12).map((i) => <li key={i.id}>{nameLink(i)} <span className="text-xs text-muted">{[i.studio, i.source].filter(Boolean).join(" · ")}</span></li>)}</ol>
              </div>
              <div className="card p-4">
                <h3 className="font-semibold text-ink">🔁 {sn.sequels.length} sequels</h3>
                <p className="text-xs text-muted">Continue a series: watch the earlier season first.</p>
                <ol className="mt-2 list-decimal space-y-1 pl-5 text-sm">{sn.sequels.slice(0, 12).map((i) => <li key={i.id}>{nameLink(i)}{i.prequel && <span className="text-xs text-muted"> after {i.prequelAnime ? <Link href={animePath(i.prequelAnime)} className="hover:text-violet-2">{i.prequel.title}</Link> : i.prequel.title}</span>}</li>)}</ol>
              </div>
            </div>
            {sn.movies.length > 0 && <p className="mt-3 text-sm text-muted">🎬 Films this season: {sn.movies.slice(0, 6).map((i, k) => <span key={i.id}>{k ? ", " : ""}{nameLink(i)}</span>)}{sn.movies.length > 6 ? ` and ${sn.movies.length - 6} more` : ""}.</p>}
          </section>
        </>
      )}

      {page === 1 && `${cap(season)} ${year}` === DUBS_SEASON && (() => {
        const live = dubShows().filter((e) => e.status !== "complete");
        const en = live.filter((e) => e.lang === "en"), hi = live.filter((e) => e.lang === "hi");
        const row = (e: DubShow) => <li key={`${e.t}-${e.lang}-${e.service}`}><Link href={e.slug ? `/anime/${e.slug}` : "/dub-schedule"} className="chip text-xs">{e.t}<span className="text-muted"> · {e.service}{e.weekday ? `, ${e.weekday}s` : ""}{e.status === "announced" ? " (soon)" : ""}</span></Link></li>;
        return live.length ? (
          <section id="dubs" data-section className="card mt-10 scroll-mt-32 p-4" aria-labelledby="dubbed-h">
            <h2 id="dubbed-h" className="font-semibold text-ink">Dubbed this season: {en.length} in English, {hi.length} in Hindi</h2>
            <p className="mt-1 text-sm text-muted">Which {cap(season)} {year} shows you can watch dubbed, on which service and which day new dubbed episodes land. <Link href="/dub-schedule" className="text-violet hover:underline">Full dub schedule with next-episode dates →</Link></p>
            {en.length > 0 && <><h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">English dubs</h3><ul className="mt-1.5 flex flex-wrap gap-1.5">{en.map(row)}</ul></>}
            {hi.length > 0 && <><h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">🇮🇳 Hindi dubs</h3><ul className="mt-1.5 flex flex-wrap gap-1.5">{hi.map(row)}</ul></>}
          </section>
        ) : null;
      })()}

      {page === 1 && `${cap(season)} ${year}` !== DUBS_SEASON && (() => {
        // Past and next seasons: the researched line-up (what got dubbed, simuldub or later).
        const d = seasonDubs(y, season);
        if (!d) return null;
        const future = y > seasonOf().year || (y === seasonOf().year && SEASONS.indexOf(season as Season) > SEASONS.indexOf(seasonOf().season));
        const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
        const when = (e: SeasonDub) => (e.when === "later" ? (e.later ? `dub ${MONTHS[Number(e.later.slice(5, 7)) - 1] ?? ""} ${e.later.slice(0, 4)}`.replace("  ", " ") : "dub came later") : "simuldub");
        const row = (e: SeasonDub) => <li key={`${e.t}-${e.service}`}><Link href={e.slug ? `/anime/${e.slug}` : `/season/${year}/${season}`} className="chip text-xs">{e.t}<span className="text-muted"> · {e.service}, {when(e)}</span></Link></li>;
        return (
          <section id="dubs" data-section className="card mt-10 scroll-mt-32 p-4" aria-labelledby="dubbed-h">
            <h2 id="dubbed-h" className="font-semibold text-ink">{future ? "Dubs announced" : "Dubbed"} for {cap(season)} {year}: {d.en.length} in English, {d.hi.length} in Hindi</h2>
            <p className="mt-1 text-sm text-muted">Which {cap(season)} {year} shows {future ? "will be" : "were"} dubbed, on which service, and whether the dub aired alongside Japan (simuldub) or came later.{SEASON_DUBS_CHECKED ? ` Checked ${SEASON_DUBS_CHECKED}.` : ""} <Link href="/dub-schedule" className="text-violet hover:underline">This season&apos;s dub schedule →</Link></p>
            {d.en.length > 0 && <><h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">English dubs</h3><ul className="mt-1.5 flex flex-wrap gap-1.5">{d.en.map(row)}</ul></>}
            {d.hi.length > 0 && <><h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">🇮🇳 Hindi dubs</h3><ul className="mt-1.5 flex flex-wrap gap-1.5">{d.hi.map(row)}</ul></>}
          </section>
        );
      })()}

      <AdSlot slot="season-top" />
      {services.length > 0 && (
        <section id="streaming" data-section className="reveal pt-10" aria-labelledby="stream-h">
          <h2 id="stream-h" className="h-section mb-1">Where to stream {label} anime</h2>
          <p className="mb-4 max-w-3xl text-sm text-muted">Official streaming services for the season&apos;s 50 most popular shows, from the links AniList lists. Which shows each service carries depends on your country; in India, see the <Link href="/hindi-dub" className="text-violet hover:underline">Hindi dub list</Link> and each show&apos;s page.</p>
          <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.3fr)]">
            <BarChart orientation="bar" integer title="Shows on each service" subtitle={`Of the ${streams!.byShow.size} most popular ${label} shows`} valueHeading="Shows" data={services.map((x) => ({ key: x.site, label: x.site, value: x.ids.length, display: `${x.ids.length} shows` }))} highlightKey={services[0].site} />
            <div className="grid gap-3 sm:grid-cols-2">
              {services.slice(0, 4).map((x) => (
                <div key={x.site} className="card p-3.5">
                  <h3 className="flex items-baseline justify-between font-semibold text-ink">{x.site}<span className="text-xs font-normal text-muted">{x.ids.length} shows</span></h3>
                  <ul className="mt-2 space-y-1 text-sm">{x.ids.flatMap((id) => (byAl.get(id) ? [byAl.get(id)!] : [])).slice(0, 6).map((i) => <li key={i.id} className="truncate">{nameLink(i)}</li>)}</ul>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {sn && (
        <section id="studios" data-section className="reveal pt-10" aria-labelledby="st-h">
          <h2 id="st-h" className="h-section mb-4">{label} studios, sources and genres</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            {sn.studios.length > 1 && <BarChart orientation="bar" integer title="Studios with the most shows" subtitle="Studios with two or more titles this season" valueHeading="Shows" data={sn.studios.map((x) => ({ key: x.label, label: x.label, value: x.value, display: `${x.value} shows` }))} highlightKey={sn.studios[0].label} />}
            <div className="grid gap-4">
              <StackedBar title="Where the stories come from" subtitle="Source material of the season's shows" unit="shows" segments={sn.sources.map((x) => ({ key: x.label, label: x.label, value: x.value }))} />
              <BarChart orientation="bar" integer title="Top genres" subtitle="A show can have several genres" valueHeading="Shows" data={sn.genres.map((x) => ({ key: x.label, label: x.label, value: x.value, display: `${x.value} shows` }))} highlightKey={sn.genres[0]?.label} />
            </div>
          </div>
        </section>
      )}

      <section id="all" data-section className="pt-10" aria-labelledby="all-h">
      {page === 1 && <h2 id="all-h" className="h-section mb-1">All {data.total} {label} anime, most followed first</h2>}
      <BrowseFilter source={`season=${year}-${season}`} label={`${cap(season)} ${year}`}>
        <div className="mt-6">
          <AnimeGrid items={data.items} startRank={(page - 1) * LIMIT + 1} ld={`${cap(season)} ${year} anime`} emptyText="No titles listed for this season yet." />
        </div>
        <Pagination page={page} total={data.total} limit={LIMIT} base={`/season/${year}/${season}`} />
      </BrowseFilter>
      </section>

      {page === 1 && nextPreview.length > 0 && (
        <section id="next" data-section className="reveal pt-10" aria-labelledby="next-h">
          <div className="mb-3 flex items-end justify-between gap-3">
            <h2 id="next-h" className="h-section">Coming next: {cap(next.season)} {next.year} anime</h2>
            <Link href={`/season/${next.year}/${next.season}/preview`} className="shrink-0 text-sm font-medium text-violet hover:text-violet-2">Full preview →</Link>
          </div>
          <p className="mb-4 text-sm text-muted">{nextPreview.length} shows announced so far for {cap(next.season)} {next.year}, most anticipated first.</p>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-6">
            {[...nextPreview].sort((a, b) => b.popularity - a.popularity).slice(0, 6).map((i) => <li key={i.id} className="min-w-0"><PosterCard i={i} badge={KIND_LABEL[i.kind]} /></li>)}
          </ul>
        </section>
      )}

      <div id="faq" data-section className="pt-2">
      <Faq
        title={`About the ${cap(season)} ${year} season`}
        items={[
          ...(sn ? [
            { q: `What anime are airing in ${label}?`, a: `${[...preview].sort((a, b) => b.popularity - a.popularity).slice(0, 8).map(showName).join(", ")}, among ${data.total} titles. ${sn.fresh.length} are new series and ${sn.sequels.length} are sequels.` },
            ...(sn.studios[0] ? [{ q: `Which studio has the most anime in ${label}?`, a: `${sn.studios[0].label}, with ${sn.studios[0].value} shows${sn.studios[1] ? `, followed by ${sn.studios.slice(1, 3).map((x) => `${x.label} (${x.value})`).join(" and ")}` : ""}.` }] : []),
            { q: `Which day has the most new anime in ${label}?`, a: `${sn.busiestDay.day}, with ${sn.busiestDay.items.length} series premiering, including ${sn.busiestDay.items.slice(0, 3).map(showName).join(", ")}.` },
          ] : []),
          { q: `When does the ${cap(season)} ${year} anime season start?`, a: `The ${season} season covers anime that premiere between ${months[s]} ${year}. Most TV series begin in the first two weeks of the season.` },
          { q: `How many anime are airing in ${cap(season)} ${year}?`, a: `Kitsu currently lists ${data.total} titles for ${cap(season)} ${year}, including TV series, movies, OVAs and web shorts. ${isCurrent ? "This number grows as late announcements are added." : ""}` },
          { q: `What is the most popular anime of ${cap(season)} ${year}?`, a: data.items[0] ? `${data.items[0].title} is the most-tracked title of the season with ${data.items[0].userCount.toLocaleString()} users on Kitsu.` : "Rankings will appear once titles are added." },
          ...(() => {
            const d = `${cap(season)} ${year}` === DUBS_SEASON ? null : seasonDubs(y, season);
            const names = (xs: SeasonDub[]) => xs.slice(0, 5).map((e) => `${e.t} (${e.service})`).join(", ");
            return d ? [
              ...(d.en.length ? [{ q: `Which ${cap(season)} ${year} anime have an English dub?`, a: `${d.en.length} shows from the season got an English dub, ${d.en.filter((e) => e.when === "simuldub").length} of them as simuldubs. Among them: ${names(d.en)}.` }] : []),
              ...(d.hi.length ? [{ q: `Which ${cap(season)} ${year} anime are dubbed in Hindi?`, a: `${d.hi.length} shows from the season got a Hindi dub. Among them: ${names(d.hi)}.` }] : []),
            ] : [];
          })(),
        ]}
      />
      </div>
    </div>
  );
}
