import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getAnimeBySlug, getEpisodeByNumber, getLastAired, animePath, episodePath, fmtDate, isFuture, posterUrl, weekdayOf, Episode } from "@/lib/kitsu";
import { abs } from "@/lib/site";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import Faq from "@/components/Faq";
import Countdown from "@/components/Countdown";
import LocalTime from "@/components/LocalTime";
import AdSlot from "@/components/AdSlot";

export const revalidate = 3600;
type Props = { params: Promise<{ slug: string; n: string }> };

async function load(slug: string, nStr: string) {
  const n = Number(nStr);
  if (!Number.isInteger(n) || n < 1 || n > 10000) return null;
  const a = await getAnimeBySlug(decodeURIComponent(slug));
  if (!a) return null;
  const [ep, { count, lastAired, reliable }] = await Promise.all([getEpisodeByNumber(a.id, n), getLastAired(a.id)]);
  // A not-yet-catalogued next episode of an airing show still gets a page, driven by the series' nextRelease.
  const synthetic: Episode | null = !ep && a.status === "current" && reliable && n === lastAired + 1 ? { id: `next-${n}`, number: n, title: null, airdate: a.nextRelease ? a.nextRelease.slice(0, 10) : null, synopsis: null, length: a.episodeLength, thumbnail: null } : null;
  const episode = ep || synthetic;
  if (!episode) return null;
  const upcoming = !episode.airdate || isFuture(episode.airdate);
  const isNext = a.status === "current" && reliable && n === lastAired + 1;
  const airIso = isNext && a.nextRelease ? a.nextRelease : episode.airdate;
  return { a, episode, n, count, lastAired, upcoming, isNext, airIso };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, n } = await params;
  const d = await load(slug, n);
  if (!d) notFound();
  const { a, episode, upcoming, airIso } = d;
  const when = airIso ? fmtDate(airIso, { month: "long", day: "numeric", year: "numeric" }) : null;
  const title = upcoming
    ? `${a.title} Episode ${d.n} Release Date${when ? ` – ${when}` : ""} & Countdown`
    : `${a.title} Episode ${d.n}${episode.title ? `: ${episode.title}` : ""} – Release Date & Recap`;
  const description = upcoming
    ? `${a.title} episode ${d.n} ${when ? `airs on ${when} (JST)` : "release date is not confirmed yet"}. Live countdown, time in your zone, and where to stream it.`
    : `${a.title} episode ${d.n}${episode.title ? ` "${episode.title}"` : ""} aired on ${when}. ${(episode.synopsis || "").slice(0, 120)}`;
  return { title, description, alternates: { canonical: episodePath(a, d.n) } };
}

export default async function EpisodePage({ params }: Props) {
  const { slug, n: nStr } = await params;
  const d = await load(slug, nStr);
  if (!d) notFound();
  const { a, episode, n, count, lastAired, upcoming, isNext, airIso } = d;
  const when = airIso ? fmtDate(airIso, { weekday: "long", month: "long", day: "numeric", year: "numeric" }) : null;
  const whenTime = airIso && airIso.length > 10 ? fmtDate(airIso, { hour: "numeric", minute: "2-digit", timeZone: "Asia/Tokyo" }) : null;
  const hasPrev = n > 1;
  const hasNext = n < count || (a.status === "current" && n <= lastAired);

  const ld = {
    "@context": "https://schema.org",
    "@type": "TVEpisode",
    name: episode.title || `${a.title} Episode ${n}`,
    episodeNumber: n,
    datePublished: episode.airdate || undefined,
    description: episode.synopsis || undefined,
    image: episode.thumbnail || posterUrl(a, "large") || undefined,
    timeRequired: episode.length ? `PT${episode.length}M` : undefined,
    url: abs(episodePath(a, n)),
    partOfSeries: { "@type": "TVSeries", name: a.title, url: abs(animePath(a)) },
  };

  const faq = [
    { q: `When does ${a.title} episode ${n} come out?`, a: when ? `${a.title} episode ${n} ${upcoming ? "is scheduled for" : "aired on"} ${when}${whenTime ? ` at ${whenTime} JST` : ""}.${upcoming ? " Simulcasts usually go live within an hour or two on licensed services." : ""}` : `The release date for ${a.title} episode ${n} has not been announced yet. This page updates automatically when it is.` },
    { q: `What time does ${a.title} episode ${n} release?`, a: whenTime ? `Broadcast is at ${whenTime} Japan Standard Time. The page shows the equivalent in your own time zone and counts down live.` : `Kitsu has the date but not a broadcast time for this episode. Japanese TV anime typically air in the evening or late night JST.` },
    { q: `Where can I watch ${a.title} episode ${n}?`, a: a.streaming.length ? `${a.title} streams on ${a.streaming.map((s) => s.site).join(", ")}. Availability depends on your region.` : `No licensed streaming links are listed yet; check the main ${a.title} page for updates.` },
    ...(a.status === "current" && isNext ? [{ q: `How many episodes of ${a.title} are out?`, a: `${lastAired} episode${lastAired === 1 ? "" : "s"} have aired so far. Episode ${n} is the next one.` }] : []),
  ];

  return (
    <article className="container-x py-8">
      <JsonLd data={ld} />
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { href: animePath(a), label: a.title }, { href: `${animePath(a)}/episodes`, label: "Episodes" }, { href: episodePath(a, n), label: `Episode ${n}` }]} />
      <div className="grid gap-6 md:grid-cols-[1fr_280px]">
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-wider text-accent">{a.title} · Episode {n}{isNext ? " · Next episode" : ""}</p>
          <h1 className="mt-1 text-3xl font-extrabold tracking-tight sm:text-4xl">{episode.title || `${a.title} Episode ${n}`}</h1>
          <p className="mt-2 text-muted">
            {when ? <>{upcoming ? "Airs" : "Aired"} {when}{whenTime ? ` · ${whenTime} JST` : ""}{airIso && airIso.length > 10 && <LocalTime iso={airIso} />}</> : "Release date not announced yet"}
            {episode.length ? ` · ${episode.length} min` : ""}
          </p>

          {upcoming && airIso && (
            <div className="card mt-5 p-5">
              <Countdown iso={airIso} big label={`Episode ${n} airs in`} />
              <p className="mt-3 text-xs text-muted">Counting down to the Japanese broadcast. Streaming releases follow shortly after.</p>
            </div>
          )}

          {episode.thumbnail && (
            <div className="relative mt-6 aspect-video overflow-hidden rounded-xl border border-line bg-bg-2">
              <Image src={episode.thumbnail} alt={`${a.title} episode ${n} still`} fill sizes="(max-width: 768px) 100vw, 700px" className="object-cover" priority />
            </div>
          )}

          <section className="mt-6">
            <h2 className="h-section mb-2">{upcoming ? "What to expect" : "Synopsis"}</h2>
            <p className="prose-anime whitespace-pre-line">{episode.synopsis || (upcoming ? `Episode ${n} of ${a.title} continues the story${lastAired ? ` after episode ${lastAired}` : ""}. The official synopsis is added here as soon as it is published.` : "No synopsis has been added for this episode yet.")}</p>
          </section>

          <AdSlot slot="episode-mid" />

          {a.streaming.length > 0 && (
            <section className="mt-6">
              <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">Where to watch</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {a.streaming.map((s) => (
                  <a key={s.id} href={s.url} target="_blank" rel="noopener nofollow sponsored" className="btn-outline capitalize">▶ {s.site}</a>
                ))}
              </div>
            </section>
          )}

          <nav className="mt-8 flex items-center justify-between gap-3 text-sm" aria-label="Episode navigation">
            {hasPrev ? <Link href={episodePath(a, n - 1)} className="btn-outline" rel="prev">← Episode {n - 1}</Link> : <span />}
            <Link href={`${animePath(a)}/episodes`} className="text-violet hover:underline">All episodes</Link>
            {hasNext ? <Link href={episodePath(a, n + 1)} className="btn-outline" rel="next">Episode {n + 1} →</Link> : <span />}
          </nav>

          <Faq items={faq} title={`${a.title} episode ${n} FAQ`} />
        </div>

        <aside>
          <Link href={animePath(a)} className="card block overflow-hidden transition hover:border-violet">
            <div className="relative aspect-[2/3] w-full bg-bg-2">{posterUrl(a, "medium") && <Image src={posterUrl(a, "medium")!} alt={a.title} fill sizes="280px" className="object-cover" />}</div>
            <div className="p-3">
              <p className="font-semibold">{a.title}</p>
              <p className="text-xs text-muted">{a.rating ? `★ ${(a.rating / 10).toFixed(1)} · ` : ""}{a.episodeCount ? `${a.episodeCount} episodes` : a.status === "current" ? `${lastAired} aired so far` : ""}</p>
              {a.status === "current" && a.nextRelease && <p className="mt-1 text-xs text-muted">New episodes {weekdayOf(a.nextRelease)}s</p>}
            </div>
          </Link>
          <AdSlot slot="episode-side" />
        </aside>
      </div>
    </article>
  );
}
