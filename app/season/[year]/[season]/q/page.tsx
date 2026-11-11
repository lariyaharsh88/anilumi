// Query-string variants (?page=, ?sort=, filters). Reached only through the rewrites in next.config.ts;
import { DUBS_SEASON, dubShows, type DubShow } from "@/lib/dubschedule";
import { seasonDubs, SEASON_DUBS_CHECKED, type SeasonDub } from "@/lib/seasondubs";
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
  const first = Number(page) > 1 ? null : await getSeason(Number(year), season as Season, 1, 3).catch(() => null);
  const total = first?.total ?? 0;
  const tops = (first?.items ?? []).slice(0, 3).map((a) => a.title);
  return {
    title: p ? `${cap(season)} ${year} Anime – Full Season Chart${p}` : fitTitle([
      total ? `${cap(season)} ${year} Anime: All ${total} Shows${current ? " Airing Now" : ""}, Ranked` : null,
      total ? `${cap(season)} ${year} Anime: All ${total} Shows, Ranked` : null,
      `${cap(season)} ${year} Anime – Full Season Chart`,
    ]),
    description: fitDescription(`${total ? `All ${total} anime ${current ? "airing in" : "of"} ${cap(season)} ${year}` : `Every anime airing in ${cap(season)} ${year}`}${tops.length ? `, led by ${tops.join(", ")}` : ""}: new series, sequels and movies ranked by popularity, with air times, scores and where to stream each.`),
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

      {page === 1 && `${cap(season)} ${year}` === DUBS_SEASON && (() => {
        const live = dubShows().filter((e) => e.status !== "complete");
        const en = live.filter((e) => e.lang === "en"), hi = live.filter((e) => e.lang === "hi");
        const row = (e: DubShow) => <li key={`${e.t}-${e.lang}-${e.service}`}><Link href={e.slug ? `/anime/${e.slug}` : "/dub-schedule"} className="chip text-xs">{e.t}<span className="text-muted"> · {e.service}{e.weekday ? `, ${e.weekday}s` : ""}{e.status === "announced" ? " (soon)" : ""}</span></Link></li>;
        return live.length ? (
          <section className="card mt-6 p-4" aria-labelledby="dubbed-h">
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
          <section className="card mt-6 p-4" aria-labelledby="dubbed-h">
            <h2 id="dubbed-h" className="font-semibold text-ink">{future ? "Dubs announced" : "Dubbed"} for {cap(season)} {year}: {d.en.length} in English, {d.hi.length} in Hindi</h2>
            <p className="mt-1 text-sm text-muted">Which {cap(season)} {year} shows {future ? "will be" : "were"} dubbed, on which service, and whether the dub aired alongside Japan (simuldub) or came later.{SEASON_DUBS_CHECKED ? ` Checked ${SEASON_DUBS_CHECKED}.` : ""} <Link href="/dub-schedule" className="text-violet hover:underline">This season&apos;s dub schedule →</Link></p>
            {d.en.length > 0 && <><h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">English dubs</h3><ul className="mt-1.5 flex flex-wrap gap-1.5">{d.en.map(row)}</ul></>}
            {d.hi.length > 0 && <><h3 className="mt-3 text-xs font-semibold uppercase tracking-wide text-muted">🇮🇳 Hindi dubs</h3><ul className="mt-1.5 flex flex-wrap gap-1.5">{d.hi.map(row)}</ul></>}
          </section>
        );
      })()}

      {page === 1 && data.total > 0 && (
        <section className="mt-6 space-y-3" aria-label="Season at a glance">
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

      <AdSlot slot="season-top" />
      <BrowseFilter source={`season=${year}-${season}`} label={`${cap(season)} ${year}`}>
        <div className="mt-6">
          <AnimeGrid items={data.items} startRank={(page - 1) * LIMIT + 1} ld={`${cap(season)} ${year} anime`} emptyText="No titles listed for this season yet." />
        </div>
        <Pagination page={page} total={data.total} limit={LIMIT} base={`/season/${year}/${season}`} />
      </BrowseFilter>

      <Faq
        title={`About the ${cap(season)} ${year} season`}
        items={[
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
  );
}
