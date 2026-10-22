import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getAnimeBySlug, getEpisodes, getLastAiredBest, airingNotice, fmtDate, animePath, episodePath, posterUrl } from "@/lib/kitsu";
import Countdown from "@/components/Countdown";
import AiringNoticeBanner from "@/components/AiringNoticeBanner";
import SpoilerGate from "@/components/SpoilerGate";
import Breadcrumbs from "@/components/Breadcrumbs";
import Pagination from "@/components/Pagination";
import AdSlot from "@/components/AdSlot";

type Props = { params: Promise<{ slug: string }>; searchParams: Promise<{ page?: string }> };
const LIMIT = 20;

export async function generateMetadata({ params, searchParams }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { page } = await searchParams;
  const a = await getAnimeBySlug(decodeURIComponent(slug));
  if (!a) notFound();
  const p = Number(page) > 1 ? ` – Page ${page}` : "";
  return {
    title: `${a.title} Episode List & Air Dates${p}`,
    description: `Every episode of ${a.title} with titles, air dates and synopses${a.episodeCount ? ` (${a.episodeCount} episodes)` : ""}.`,
    alternates: { canonical: `${animePath(a)}/episodes${Number(page) > 1 ? `?page=${page}` : ""}` },
    openGraph: { images: posterUrl(a, "large") ? [{ url: posterUrl(a, "large")! }] : [] },
  };
}

export default async function EpisodesPage({ params, searchParams }: Props) {
  const { slug } = await params;
  const { page: pageStr } = await searchParams;
  const page = Math.max(1, Number(pageStr) || 1);
  const a = await getAnimeBySlug(decodeURIComponent(slug));
  if (!a) notFound();
  const [eps, { lastAired, reliable, nextAt }] = await Promise.all([getEpisodes(a.id, page, LIMIT), getLastAiredBest(a.id)]);
  const notice = a.status === "current" ? airingNotice(a.nextRelease, nextAt) : null;
  if (nextAt) a.nextRelease = nextAt;
  const nextN = a.status === "current" && a.nextRelease && reliable ? lastAired + 1 : null;

  return (
    <div className="container-x py-8">
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { href: animePath(a), label: a.title }, { href: `${animePath(a)}/episodes`, label: "Episodes" }]} />
      <h1 className="text-3xl font-extrabold tracking-tight">{a.title} episodes</h1>
      <p className="mt-1 text-muted">{eps.total ? `${eps.total} episodes` : "Episode list"}{a.nextRelease ? ` · next episode ${fmtDate(a.nextRelease, { weekday: "short", month: "short", day: "numeric" })}` : ""}</p>
      {a.status === "current" && a.nextRelease && page === 1 && (
        nextN ? (
          <Link href={episodePath(a, nextN)} className="card mt-5 flex flex-wrap items-center justify-between gap-3 border-accent/40 bg-accent/10 p-4 transition hover:border-accent">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-accent-2">Next episode</p>
              <p className="font-semibold">Episode {nextN} · {fmtDate(a.nextRelease, { weekday: "long", month: "long", day: "numeric" })} JST</p>
            </div>
            <Countdown iso={a.nextRelease} big label="Airs in" />
          </Link>
        ) : (
          <div className="card mt-5 flex flex-wrap items-center justify-between gap-3 border-accent/40 bg-accent/10 p-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-accent-2">Next episode</p>
              <p className="font-semibold">{fmtDate(a.nextRelease, { weekday: "long", month: "long", day: "numeric" })} JST</p>
            </div>
            <Countdown iso={a.nextRelease} big label="Airs in" />
          </div>
        )
      )}
      {notice && <AiringNoticeBanner n={notice} title={a.title} />}
      <AdSlot slot="episodes-top" />
      {eps.items.length ? (
        <ol className="mt-6 space-y-3">
          {eps.items.map((e) => (
            <li key={e.id} className="card flex gap-4 p-3">
              <div className="relative hidden aspect-video w-40 shrink-0 overflow-hidden rounded-lg bg-bg-2 sm:block">
                {e.thumbnail && (e.number ? <SpoilerGate animeId={a.id} ep={e.number}><div className="relative aspect-video w-40"><Image src={e.thumbnail} alt="" fill sizes="160px" className="object-cover" /></div></SpoilerGate> : <Image src={e.thumbnail} alt="" fill sizes="160px" className="object-cover" />)}
              </div>
              <div className="min-w-0 flex-1">
                <h2 className="font-semibold">{e.number ? <Link href={episodePath(a, e.number)} className="hover:text-violet"><span className="text-muted">Episode {e.number}</span>{e.title ? <> · <SpoilerGate inline animeId={a.id} ep={e.number}>{e.title}</SpoilerGate></> : ""}</Link> : e.title}</h2>
                <p className="text-xs text-muted">{e.airdate ? `Aired ${fmtDate(e.airdate, { weekday: "long", year: "numeric", month: "long", day: "numeric" })}` : "Air date TBA"}{e.length ? ` · ${e.length} min` : ""}</p>
                {e.synopsis && (e.number ? <SpoilerGate animeId={a.id} ep={e.number}><p className="mt-1 line-clamp-3 text-sm text-ink/80">{e.synopsis}</p></SpoilerGate> : <p className="mt-1 line-clamp-3 text-sm text-ink/80">{e.synopsis}</p>)}
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <p className="card mt-6 p-8 text-center text-muted">No episode data has been added for this title yet.</p>
      )}
      <Pagination page={page} total={eps.total} limit={LIMIT} base={`${animePath(a)}/episodes`} />
    </div>
  );
}
