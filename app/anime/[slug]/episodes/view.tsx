import { Fragment } from "react";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "@/components/Link";
import { getAnimeBySlug, getEpisodes, getLastAiredBest, airingNotice, fmtDate, animePath, episodePath, posterUrl } from "@/lib/kitsu";
import Countdown from "@/components/Countdown";
import AiringNoticeBanner from "@/components/AiringNoticeBanner";
import SpoilerGate from "@/components/SpoilerGate";
import FillerToggle from "@/components/FillerToggle";
import { arcsFor, arcOf, arcRange } from "@/lib/arcs";
import { fillerFor, fillerSource } from "@/lib/filler";
import PageHero from "@/components/PageHero";
import { pageAbout, itemList } from "@/lib/ld";
import JsonLd from "@/components/JsonLd";
import Pagination from "@/components/Pagination";
import AdSlot from "@/components/AdSlot";
import { excerpt } from "@/lib/excerpt";

const LIMIT = 20;

/** Episode list pages live at /episodes (page 1) and /episodes/page/[p], so every page is ISR-cacheable. */
export const episodesPath = (slug: string, page: number) => `/anime/${slug}/episodes${page > 1 ? `/page/${page}` : ""}`;

export async function episodesMetadata(slug: string, page: number): Promise<Metadata> {
  const a = await getAnimeBySlug(decodeURIComponent(slug));
  if (!a) notFound();
  const p = page > 1 ? ` – Page ${page}` : "";
  // Put the count in the title: searches like "banana fish episodes" want the number at a glance.
  const airing = a.status === "current";
  const aired = airing ? (await getLastAiredBest(a.id)).lastAired : 0;
  const fill = fillerFor(a.slug, a.episodeCount ?? (aired || null));
  const n = airing ? aired : a.episodeCount || 0;
  const head = !n
    ? `${a.title} Episode List & Air Dates`
    : airing
      ? `${a.title} Episode Guide: ${n} Episodes So Far & Next Air Date`
      : `${a.title} Episode Guide: All ${n} Episodes${fill?.count ? ` (${fill.count} Filler)` : ""}`;
  const span = a.startDate ? ` (${fmtDate(a.startDate, { month: "short", year: "numeric" })}${a.endDate ? ` – ${fmtDate(a.endDate, { month: "short", year: "numeric" })}` : airing ? " – now" : ""})` : "";
  return {
    title: `${head}${p}`,
    description: n
      ? `${airing ? `${n} episodes of ${a.title} have aired so far` : `All ${n} episodes of ${a.title}`}${span}, with titles, air dates and spoiler-safe synopses${fill?.count ? `, plus which ${fill.count} are filler` : ""}.`
      : `Every episode of ${a.title} with titles, air dates and synopses.`,
    alternates: { canonical: episodesPath(a.slug, page) },
    openGraph: { images: posterUrl(a, "large") ? [{ url: posterUrl(a, "large")! }] : [] },
  };
}

export async function EpisodesView({ slug, page }: { slug: string; page: number }) {
  const a = await getAnimeBySlug(decodeURIComponent(slug));
  if (!a) notFound();
  const [eps, { lastAired, reliable, nextAt }] = await Promise.all([getEpisodes(a.id, page, LIMIT), getLastAiredBest(a.id)]);
  const notice = a.status === "current" ? airingNotice(a.nextRelease, nextAt) : null;
  const fill = fillerFor(a.slug, a.episodeCount ?? (lastAired || null));
  if (nextAt) a.nextRelease = nextAt;
  const nextN = a.status === "current" && a.nextRelease && reliable ? lastAired + 1 : null;
  // Story arcs (data/arcs.json): an index that jumps to each arc's first episode, and a heading in the list
  // wherever a new arc starts.
  const arcs = arcsFor(a.slug);
  const arcHref = (n: number) => `${episodesPath(a.slug, Math.ceil(n / LIMIT))}#ep-${n}`;

  return (
    <div className="container-x pb-8">
      <JsonLd data={pageAbout(a, episodesPath(a.slug, page), `${a.title} episodes${page > 1 ? `, page ${page}` : ""}`)} />
      <JsonLd data={itemList(`${a.title} episodes`, eps.items.flatMap((e) => (e.number ? [{ url: episodePath(a, e.number), name: e.title ? `Episode ${e.number}: ${e.title}` : `Episode ${e.number}` }] : [])), (page - 1) * LIMIT + 1)} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: animePath(a), label: a.title }, { href: `${animePath(a)}/episodes`, label: "Episodes" }]}
        eyebrow="Episode guide"
        title={<>{a.title} <span className="text-gradient">episodes</span></>}
        subtitle={`${eps.total ? `${eps.total} episodes` : "Episode list"}${a.nextRelease ? ` · next episode ${fmtDate(a.nextRelease, { weekday: "short", month: "short", day: "numeric", timeZone: "Asia/Tokyo" })}` : ""}`}
        facts={[
          ...(eps.total ? [{ value: String(eps.total), label: "episodes listed" }] : []),
          ...(a.status === "current" && lastAired ? [{ value: String(lastAired), label: "aired so far" }] : []),
          ...(fill ? [{ value: String(fill.filler.size), label: "filler to skip" }] : []),
        ]}
        hue={350}
        backdrop={a.cover?.large || null}
        posters={[posterUrl(a, "medium")]}
      />
      {a.status === "current" && a.nextRelease && page === 1 && (
        nextN ? (
          <Link href={episodePath(a, nextN)} className="card mt-5 flex flex-wrap items-center justify-between gap-3 border-accent/40 bg-accent/10 p-4 transition hover:border-accent">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-accent-2">Next episode</p>
              <p className="font-semibold">Episode {nextN} · {fmtDate(a.nextRelease, { weekday: "long", month: "long", day: "numeric", timeZone: "Asia/Tokyo" })} JST</p>
            </div>
            <Countdown iso={a.nextRelease} big label="Airs in" />
          </Link>
        ) : (
          <div className="card mt-5 flex flex-wrap items-center justify-between gap-3 border-accent/40 bg-accent/10 p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-accent-2">Next episode</p>
              <p className="font-semibold">{fmtDate(a.nextRelease, { weekday: "long", month: "long", day: "numeric", timeZone: "Asia/Tokyo" })} JST</p>
            </div>
            <Countdown iso={a.nextRelease} big label="Airs in" />
          </div>
        )
      )}
      {notice && <AiringNoticeBanner n={notice} title={a.title} />}
      {fill && (
        <div className="card mt-5 flex flex-wrap items-center justify-between gap-3 p-4">
          <p className="text-sm text-ink/90">
            <strong>{fill.count}</strong> of {fill.total} episodes are filler ({fill.share.toFixed(0)}%).
            <span className="ml-1 text-xs text-muted">{fillerSource(fill.entry).label}.</span>{" "}
            <Link href={`${animePath(a)}/filler-list`} className="text-violet underline underline-offset-2">{a.title} filler list →</Link>
          </p>
          <FillerToggle targetId="episode-list" />
        </div>
      )}
      {arcs && (
        <details className="card group mt-5 p-4" open={page === 1}>
          <summary className="cursor-pointer list-none font-semibold text-ink">📖 Jump to an arc <span className="text-sm font-normal text-muted">· {arcs.length} arcs</span></summary>
          <ul className="mt-3 flex flex-wrap gap-1.5">
            {arcs.map((x) => <li key={`${x.from}-${x.name}`}><a href={arcHref(x.from)} className="chip">{x.name}{x.filler ? " · filler" : ""} <span className="ml-1 tabular-nums">{arcRange(x)}</span></a></li>)}
          </ul>
        </details>
      )}
      <AdSlot slot="episodes-top" />
      {eps.items.length ? (
        <ol id="episode-list" className="mt-6 space-y-3">
          {eps.items.map((e, i) => {
            const arc = e.number ? arcOf(arcs, e.number) : null;
            const prev = i > 0 && eps.items[i - 1].number ? arcOf(arcs, eps.items[i - 1].number!) : null;
            return (<Fragment key={e.id}>
            {arc && arc !== prev && (
              <li className="pt-2"><h2 className="text-sm font-bold uppercase tracking-wider text-violet-2">{arc.name} arc{arc.filler ? " · filler" : ""} <span className="font-normal normal-case tracking-normal text-muted">· episodes {arcRange(arc)}</span></h2></li>
            )}
            <li id={e.number ? `ep-${e.number}` : undefined} className="card flex scroll-mt-32 gap-4 p-3" data-filler={e.number && (fill?.filler.has(e.number) || fill?.recap.has(e.number)) ? "" : undefined}>
              <div className="relative hidden aspect-video w-40 shrink-0 overflow-hidden rounded-lg bg-bg-2 sm:block">
                {e.thumbnail && (e.number ? <SpoilerGate animeId={a.id} ep={e.number}><div className="relative aspect-video w-40"><Image src={e.thumbnail} alt="" fill sizes="160px" className="object-cover" /></div></SpoilerGate> : <Image src={e.thumbnail} alt="" fill sizes="160px" className="object-cover" />)}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold">{e.number ? <Link href={episodePath(a, e.number)} className="hover:text-violet"><span className="text-muted">Episode {e.number}</span>{fill?.filler.has(e.number) && <span className="tag-xs">Filler</span>}{fill?.recap.has(e.number) && <span className="tag-xs">Recap</span>}{fill?.mixed.has(e.number) && <span className="tag-xs">Mixed</span>}{e.title ? <> · <SpoilerGate inline animeId={a.id} ep={e.number}>{e.title}</SpoilerGate></> : ""}</Link> : e.title}</h2>
                <p className="text-xs text-muted">{e.airdate ? `Aired ${fmtDate(e.airdate, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}` : "Air date TBA"}{e.length ? ` · ${e.length} min` : ""}</p>
                {e.synopsis && (e.number ? <SpoilerGate animeId={a.id} ep={e.number}><p className="mt-1 line-clamp-3 text-sm text-ink/80">{excerpt(e.synopsis, 200)}</p></SpoilerGate> : <p className="mt-1 line-clamp-3 text-sm text-ink/80">{excerpt(e.synopsis, 200)}</p>)}
              </div>
            </li>
            </Fragment>);
          })}
        </ol>
      ) : (
        <p className="card mt-6 p-8 text-center text-muted">No episode data has been added for this title yet.</p>
      )}
      <Pagination page={page} total={eps.total} limit={LIMIT} base={`${animePath(a)}/episodes`} pathStyle />
    </div>
  );
}
