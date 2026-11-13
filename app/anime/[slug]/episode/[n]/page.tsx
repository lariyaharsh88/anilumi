import { fitDescription } from "@/lib/titles";
import type { Metadata } from "next";
import PushButton from "@/components/PushButton";
import { animeTopic } from "@/lib/push";
import Link from "@/components/Link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { getAnimeBySlug, getEpisodeByNumber, getLastAiredBest, airingNotice, type AiringNotice, animePath, episodePath, fmtDate, isFuture, posterUrl, weekdayOf, Episode } from "@/lib/kitsu";
import { site, abs } from "@/lib/site";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import { workRef, isoDuration } from "@/lib/ld";
import Faq from "@/components/Faq";
import Countdown from "@/components/Countdown";
import LocalTime from "@/components/LocalTime";
import { airing, upcomingOf } from "@/lib/airing";
import AiringNoticeBanner from "@/components/AiringNoticeBanner";
import SpoilerGate from "@/components/SpoilerGate";
import EpisodeWatched from "@/components/EpisodeWatched";
import EpisodeNav from "@/components/EpisodeNav";
import Refreshed from "@/components/Refreshed";
import WatchedUpTo from "@/components/WatchedUpTo";
import { fillerFor, fillerSource, continuationFor } from "@/lib/filler";
import EpisodeReactions from "@/components/EpisodeReactions";
import LeadForm from "@/components/LeadForm";
import { dbEnabled } from "@/lib/db";
import AdSlot from "@/components/AdSlot";
import { streamLink, affiliateRel } from "@/lib/affiliate";
import SkipGuide from "@/components/SkipGuide";
import { skipTimesFor } from "@/lib/skip";
import { episodeIndexed, robotsFor } from "@/lib/indexing";
import { excerpt } from "@/lib/excerpt";
import { snapshotThemes, themesForEpisode } from "@/lib/themes";
import { arcsFor, arcOf } from "@/lib/arcs";
import ReleaseSchedule from "@/components/ReleaseSchedule";
import { dubShows } from "@/lib/dubschedule";
import { dubFor, platformKind } from "@/lib/hindidub";

export const revalidate = 21600;
// Render on first request, then serve from the ISR cache until revalidated.
export async function generateStaticParams() { return []; }
type Props = { params: Promise<{ slug: string; n: string }> };

async function load(slug: string, nStr: string) {
  const n = Number(nStr);
  if (!Number.isInteger(n) || n < 1 || n > 10000) return null;
  const a = await getAnimeBySlug(decodeURIComponent(slug));
  if (!a) return null;
  const [ep, { count, lastAired, reliable, nextAt }, skips] = await Promise.all([getEpisodeByNumber(a.id, n), getLastAiredBest(a.id), a.subtype === "movie" ? Promise.resolve(null) : skipTimesFor(a.id, n)]);
  const notice: AiringNotice | null = a.status === "current" ? airingNotice(a.nextRelease, nextAt) : null;
  if (nextAt) a.nextRelease = nextAt;
  // Not-yet-catalogued episodes still get a page: the next one of an airing show (series nextRelease), and any
  // episode in the airing snapshot's schedule with its exact air time, so "episode 8 release date" has a page
  // a week or two ahead, including premieres of shows that haven't started.
  const schedule = upcomingOf((await airing()).byKitsu.get(a.id));
  const ahead = schedule.find((u) => u.episode === n) ?? null;
  const nextScheduled = schedule.some((u) => u.episode === n + 1);
  const isNext = a.status === "current" && reliable && n === lastAired + 1;
  const synthetic: Episode | null = !ep && (isNext || ahead) ? { id: `next-${n}`, number: n, title: null, airdate: ahead ? ahead.at.slice(0, 10) : a.nextRelease ? a.nextRelease.slice(0, 10) : null, synopsis: null, length: a.episodeLength, thumbnail: null } : null;
  const episode = ep || synthetic;
  if (!episode) return null;
  const airIso = ahead ? ahead.at : isNext && a.nextRelease ? a.nextRelease : episode.airdate;
  const upcoming = !airIso || isFuture(airIso);
  return { a, episode, n, count, lastAired, reliable, upcoming, isNext, airIso, notice, skips, nextScheduled };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug, n } = await params;
  const d = await load(slug, n);
  if (!d) notFound();
  const { a, episode, upcoming, airIso } = d;
  const when = airIso ? fmtDate(airIso, { month: "long", day: "numeric", year: "numeric" }) : null;
  // The English name people search ("The Apothecary Diaries Season 3 episode 7"), romaji when there's none.
  const show = a.titleEn && a.titleEn.length <= 50 ? a.titleEn : a.title;
  const title = upcoming
    ? `${show} Episode ${d.n} Release Date & Time${when ? ` – ${when}` : ""}`
    : `${show} Episode ${d.n}${episode.title ? `: ${episode.title}` : ""} – Release Date & Recap`;
  const description = upcoming
    ? `${a.title} episode ${d.n} ${when ? `airs on ${when} (JST)` : "release date is not confirmed yet"}. Release time in India (IST), the US (ET/PT) and the UK, a live countdown and where to stream it.`
    : `${a.title} episode ${d.n}${episode.title ? ` "${episode.title}"` : ""} aired on ${when}. ${(episode.synopsis || "").slice(0, 120)}`;
  const path = episodePath(a, d.n);
  const indexed = episodeIndexed({ path, n: d.n, upcoming, next: d.isNext, airIso, airing: a.status === "current", lastAired: d.lastAired });
  return { title, description: fitDescription(description), alternates: { canonical: path }, robots: robotsFor(indexed) };
}

export default async function EpisodePage({ params }: Props) {
  const { slug, n: nStr } = await params;
  const d = await load(slug, nStr);
  if (!d) notFound();
  const { a, episode, n, count, lastAired, reliable, upcoming, isNext, airIso, notice, skips, nextScheduled } = d;
  // One of the latest few episodes: name the next one in the alert offer (older episodes get a general offer).
  const nextUp = reliable && n <= lastAired && n >= lastAired - 2 ? lastAired + 1 : null;
  // The day in Japan, matching the JST time beside it (a 00:56 JST slot is the previous day in UTC).
  const when = airIso ? fmtDate(airIso, { weekday: "long", month: "long", day: "numeric", year: "numeric", ...(airIso.length > 10 ? { timeZone: "Asia/Tokyo" } : {}) }) : null;
  // Time only ("11:00 PM"): fmtDate formats a date, and with hour options it gave "11/14/2026, 11:00 PM".
  const whenTime = airIso && airIso.length > 10 ? new Date(airIso).toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: "Asia/Tokyo" }) : null;
  const hasPrev = n > 1;
  const hasNext = n < count || (a.status === "current" && n <= lastAired) || nextScheduled;
  const watchItem = { id: a.id, slug: a.slug, title: a.title, poster: posterUrl(a, "small"), status: a.status, nextRelease: a.nextRelease };
  // "release time india / us": the broadcast in the zones most of our readers search from.
  const at = (tz: string) => (airIso && airIso.length > 10 ? new Date(airIso).toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit", timeZone: tz }) : null);
  const zones = whenTime ? { ist: at("Asia/Kolkata"), et: at("America/New_York"), pt: at("America/Los_Angeles"), uk: at("Europe/London") } : null;

  // Upcoming and recently aired episodes change (air time, title, length) as sources fill in; these show when the
  // page last re-read them, and give it to search engines as dateModified. Older episodes are settled: no date.
  const refreshed = upcoming || (airIso && Date.now() - new Date(airIso).getTime() < 14 * 86400_000) ? new Date().toISOString() : null;
  const ld = {
    "@context": "https://schema.org",
    "@type": "TVEpisode",
    ...(refreshed ? { dateModified: refreshed } : {}),
    name: episode.title || `${a.title} Episode ${n}`,
    episodeNumber: n,
    // Only once it has aired; a scheduled episode carries its date as the broadcast below.
    datePublished: !upcoming && airIso ? airIso : undefined,
    description: excerpt(episode.synopsis, 300) || undefined,
    image: episode.thumbnail || posterUrl(a, "large") || undefined,
    timeRequired: episode.length ? isoDuration(episode.length) : undefined,
    inLanguage: "ja",
    url: abs(episodePath(a, n)),
    partOfSeries: workRef(a),
    publication: airIso ? { "@type": "BroadcastEvent", startDate: airIso, isLiveBroadcast: false, ...(episode.length && airIso.length > 10 ? { endDate: new Date(new Date(airIso).getTime() + episode.length * 60_000).toISOString() } : {}) } : undefined,
  };

  // The opening and ending used in this episode (monthly AnimeThemes snapshot; dub-only variants left out).
  const songs = themesForEpisode(snapshotThemes(a.id), n);
  const arc = arcOf(arcsFor(a.slug), n);
  const planned = a.episodeCount || (await airing()).byKitsu.get(a.id)?.e || null;
  const filler = fillerFor(a.slug, a.episodeCount ?? (lastAired || null));
  const kindOf = filler ? (filler.filler.has(n) ? "Filler (safe to skip)" : filler.recap.has(n) ? "Recap (safe to skip)" : filler.mixed.has(n) ? "Mixed canon and filler" : "Canon (from the source)") : null;
  // Dubs: this season's dub schedule (English and Hindi runs with their service and day) and the Hindi dub record.
  const dubRuns = dubShows().filter((e) => e.slug === a.slug && e.status !== "announced");
  const hindiSoon = dubShows().find((e) => e.slug === a.slug && e.lang === "hi" && e.status === "announced");
  const hindi = dubFor(a);
  const zoneRows = airIso && airIso.length > 10 ? ([["Japan (JST)", "Asia/Tokyo"], ["India (IST)", "Asia/Kolkata"], ["US East (ET)", "America/New_York"], ["US West (PT)", "America/Los_Angeles"], ["UK", "Europe/London"]] as const) : null;
  const songLine = (type: "OP" | "ED") => songs.filter((t) => t.type === type).map((t) => `“${t.song}”${t.artists[0] ? ` by ${t.artists[0]}` : ""}`).join(" and ");
  const faq = [
    { q: `When does ${a.title} episode ${n} come out?`, a: when ? `${a.title} episode ${n} ${upcoming ? "is scheduled for" : "aired on"} ${when}${whenTime ? ` at ${whenTime} JST` : ""}.${upcoming ? " Simulcasts usually go live within an hour or two on licensed services." : ""}` : `The release date for ${a.title} episode ${n} has not been announced yet. This page updates automatically when it is.` },
    ...(zones && upcoming ? [{ q: `What time does ${a.title} episode ${n} come out in India, the US and the UK?`, a: `The Japanese broadcast is ${zones.ist} in India (IST), ${zones.et} Eastern and ${zones.pt} Pacific in the US, and ${zones.uk} in the UK. Streaming services usually add it within an hour or two.` }] : []),
    { q: `What time does ${a.title} episode ${n} release?`, a: whenTime ? `Broadcast is at ${whenTime} Japan Standard Time. The page shows the equivalent in your own time zone and counts down live.` : `Kitsu has the date but not a broadcast time for this episode. Japanese TV anime typically air in the evening or late night JST.` },
    { q: `Where can I watch ${a.title} episode ${n}?`, a: a.streaming.length ? `${a.title} streams on ${a.streaming.map((s) => s.site).join(", ")}. Availability depends on your region.` : `No licensed streaming links are listed yet; check the main ${a.title} page for updates.` },
    ...(arc ? [{ q: `Which arc is ${a.title} episode ${n} in?`, a: `Episode ${n} is part of the ${arc.name} arc${arc.filler ? ", a filler arc" : ""}, ${arc.to === null ? `which started with episode ${arc.from} and is still airing` : `which runs from episode ${arc.from} to ${arc.to}`}.` }] : []),
    ...(songs.length ? [{ q: `What are the opening and ending of ${a.title} episode ${n}?`, a: [songLine("OP") && `The opening is ${songLine("OP")}.`, songLine("ED") && `The ending is ${songLine("ED")}.`].filter(Boolean).join(" ") + ` Every ${a.title} opening and ending is listed on the openings & endings page.` }] : []),
    ...(a.status === "current" && isNext ? [{ q: `How many episodes of ${a.title} are out?`, a: `${lastAired} episode${lastAired === 1 ? "" : "s"} have aired so far. Episode ${n} is the next one.` }] : []),
  ];

  return (
    <article className="container-x pb-8">
      <JsonLd data={ld} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: animePath(a), label: a.title }, { href: `${animePath(a)}/episodes`, label: "Episodes" }, { href: episodePath(a, n), label: `Episode ${n}` }]}
        eyebrow={<>{a.title} · Episode {n}{isNext ? " · Next episode" : ""}</>}
        title={episode.title ? <SpoilerGate inline animeId={a.id} ep={n} safeDocTitle={`${a.title} Episode ${n} | ${site.name}`}>{episode.title}</SpoilerGate> : `${a.title} Episode ${n}`}
        subtitle={<p>
            {when ? <>{upcoming ? "Airs" : "Aired"} {when}{whenTime ? ` · ${whenTime} JST` : ""}{airIso && airIso.length > 10 && <LocalTime iso={airIso} />}</> : "Release date not announced yet"}
            {episode.length ? ` · ${episode.length} min` : ""}
            {refreshed && <> · <Refreshed iso={refreshed} label="Updated" /></>}
          </p>}
        hue={upcoming ? 350 : 262}
        backdrop={a.cover?.large || null}
      />
      <div className="mt-8 grid gap-6 md:grid-cols-[1fr_280px]">
        <div className="min-w-0">

          {isNext && notice && <AiringNoticeBanner n={notice} title={a.title} />}
          {(() => {
            const f = fillerFor(a.slug, a.episodeCount ?? (lastAired || null));
            if (!f || !(f.filler.has(n) || f.recap.has(n) || f.mixed.has(n))) return null;
            const skip = f.filler.has(n) || f.recap.has(n);
            const next = skip ? f.nextCanon(n) : null;
            return (
              <div className="mt-4 rounded-xl border border-line bg-bg-2 p-3 text-sm" role="note">
                <p>
                  <span aria-hidden className="mr-1.5">⏭</span>
                  <strong className="text-ink">{f.filler.has(n) ? "Filler episode." : f.recap.has(n) ? "Recap episode." : "Mixed canon and filler."}</strong>{" "}
                  <span className="text-ink/90">{f.filler.has(n) ? "Not adapted from the manga, so it's safe to skip." : f.recap.has(n) ? "Mostly clips from earlier episodes, so it's safe to skip." : "Partly adapted from the source; worth watching if you're unsure."}</span>
                  {next && <> <Link href={episodePath(a, next)} className="text-violet hover:underline">The story continues in episode {next} →</Link></>}
                </p>
                <p className="mt-1 text-xs text-muted">{fillerSource(f.entry).tone === "draft" ? "From a draft filler list that's still being verified." : `Source: ${f.entry.checked || "reviewed list"}.`} <Link href={`${animePath(a)}/filler-list`} className="text-violet hover:underline">Full filler list</Link></p>
              </div>
            );
          })()}
          {arc && (
            <p className="mt-4 flex flex-wrap items-baseline gap-x-2 gap-y-1 text-sm">
              <span aria-hidden>📖</span>
              <span className="text-ink/90"><strong className="font-semibold text-ink">{arc.name} arc</strong>{arc.filler ? " (filler)" : ""} · episode {n - arc.from + 1} {arc.to === null ? "of the arc so far" : `of ${arc.to - arc.from + 1}`}</span>
              <Link href={`${animePath(a)}#arcs`} className="text-xs font-medium text-violet hover:text-violet-2">{a.title} arcs in order →</Link>
            </p>
          )}
          {songs.length > 0 && (
            <p className="mt-4 flex flex-wrap items-baseline gap-x-4 gap-y-1 text-sm">
              <span aria-hidden>🎵</span>
              {songs.map((t) => (
                <span key={t.slug}>
                  <span className="text-muted">{t.type === "OP" ? "Opening" : "Ending"}:</span>{" "}
                  <Link href={`${animePath(a)}/openings-endings`} className="font-medium text-ink hover:text-violet-2">“{t.song}”</Link>
                  {t.artists[0] && <span className="text-muted"> by {t.artists[0]}</span>}
                </span>
              ))}
            </p>
          )}
          <EpisodeNav n={n} base={`${animePath(a)}/episode/`} hasPrev={hasPrev} hasNext={hasNext} aired={!upcoming} item={watchItem} />
          {!upcoming && <EpisodeWatched className="mt-4" ep={n} item={watchItem} />}
          {!upcoming && skips && <SkipGuide s={skips} episode={n} />}
          {dbEnabled() && !upcoming && <EpisodeReactions animeId={a.id} ep={n} />}
          {/* Just watched an episode of a show still airing: the moment to offer the next one. */}
          {dbEnabled() && !upcoming && a.status === "current" && (<>
            <PushButton className="mt-5" topic={animeTopic(a.id)} source="episode-next-alert" label={nextUp ? `Alert me when episode ${nextUp} airs` : "Alert me when new episodes air"} onLabel="Episode alerts on" />
            <LeadForm className="mt-4" kind="alert" source="episode-next-alert" animeId={a.id} animeTitle={a.title} title={nextUp ? `🔔 Email me when episode ${nextUp} is out` : `🔔 Email me when a new ${a.title} episode is out`} blurb={`One email per new ${a.title} episode, at air time. Unsubscribe any time.`} />
          </>)}
          {dbEnabled() && upcoming && a.status !== "finished" && (<>
            <PushButton className="mt-5" topic={animeTopic(a.id)} source="episode-alert" label={`Alert me when episode ${n} airs`} onLabel="Episode alerts on" />
            <LeadForm className="mt-4" kind="alert" source="episode-alert" animeId={a.id} animeTitle={a.title} title={`🔔 Email me when episode ${n} airs`} blurb={`One email when ${a.title} episode ${n} is out, then one per new episode. Unsubscribe any time.`} />
          </>)}
          {upcoming && airIso && (
            <div className="card mt-5 p-5">
              <Countdown iso={airIso} big label={`Episode ${n} airs in`} />
              <p className="mt-3 text-xs text-muted">Counting down to the Japanese broadcast. Streaming releases follow shortly after.</p>
            </div>
          )}

          {zoneRows && (
            <section className="mt-6" aria-labelledby="time-h">
              <h2 id="time-h" className="h-section mb-2">{a.title} episode {n} release date and time</h2>
              <p className="mb-3 text-sm text-ink/90">{upcoming ? "Airs" : "Aired"} on {when} in Japan{whenTime ? ` at ${whenTime} JST` : ""}. That&apos;s:</p>
              <dl className="card grid grid-cols-2 gap-x-4 gap-y-3 p-4 text-sm sm:grid-cols-3 lg:grid-cols-5">
                {zoneRows.map(([label, tz]) => (
                  <div key={tz}><dt className="text-xs text-muted">{label}</dt><dd className="font-semibold tabular-nums text-ink">{new Date(airIso!).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit", timeZone: tz })}</dd></div>
                ))}
              </dl>
              <p className="mt-2 text-xs text-muted">The broadcast in Japan; Crunchyroll, Netflix and other licensed services usually add the episode within an hour or two.</p>
            </section>
          )}

          {episode.thumbnail && (
            <SpoilerGate animeId={a.id} ep={n}>
            <div className="relative mt-6 aspect-video overflow-hidden rounded-xl border border-line bg-bg-2">
              <Image src={episode.thumbnail} alt={`${a.title} episode ${n} still`} fill sizes="(max-width: 768px) 100vw, 700px" className="object-cover" priority />
            </div>
            </SpoilerGate>
          )}

          <section className="mt-6">
            <h2 className="h-section mb-2">{upcoming ? "What to expect" : "Synopsis"}</h2>
            <SpoilerGate animeId={a.id} ep={n}>
            <p className="prose-anime whitespace-pre-line">{excerpt(episode.synopsis, 360) || (upcoming ? `Episode ${n} of ${a.title} continues the story${lastAired ? ` after episode ${lastAired}` : ""}. The official synopsis is added here as soon as it is published.` : "No synopsis has been added for this episode yet.")}</p>
            {episode.synopsis && <p className="mt-2 text-xs text-muted">Synopsis excerpt via <a href={`https://kitsu.app/anime/${a.slug}/episodes`} target="_blank" rel="noopener nofollow" className="underline">Kitsu</a>.</p>}
            </SpoilerGate>
          </section>

          <section className="mt-6" aria-labelledby="details-h">
            <h2 id="details-h" className="h-section mb-2">Episode {n} details</h2>
            <dl className="card grid grid-cols-2 gap-x-4 gap-y-3 p-4 text-sm sm:grid-cols-3">
              <div><dt className="text-xs text-muted">Episode</dt><dd className="font-semibold text-ink">{n}{planned ? ` of ${planned}` : ""}</dd></div>
              {episode.length ? <div><dt className="text-xs text-muted">Length</dt><dd className="font-semibold text-ink">{episode.length} min</dd></div> : null}
              <div><dt className="text-xs text-muted">{upcoming ? "Airs" : "Aired"}</dt><dd className="font-semibold text-ink">{airIso ? fmtDate(airIso, { month: "short", day: "numeric", year: "numeric", ...(airIso.length > 10 ? { timeZone: "Asia/Tokyo" } : {}) }) : "Not announced"}</dd></div>
              {kindOf && <div><dt className="text-xs text-muted">Type</dt><dd className="font-semibold text-ink">{kindOf}</dd></div>}
              {arc && <div><dt className="text-xs text-muted">Arc</dt><dd className="font-semibold text-ink">{arc.name}{arc.filler ? " (filler)" : ""}</dd></div>}
              {a.status === "current" && reliable && <div><dt className="text-xs text-muted">Aired so far</dt><dd className="font-semibold text-ink">{lastAired}{planned ? ` of ${planned}` : ""}</dd></div>}
              {songs.filter((t) => t.type === "OP").slice(0, 1).map((t) => <div key={t.slug}><dt className="text-xs text-muted">Opening</dt><dd className="truncate font-semibold text-ink">“{t.song}”</dd></div>)}
              {songs.filter((t) => t.type === "ED").slice(0, 1).map((t) => <div key={t.slug}><dt className="text-xs text-muted">Ending</dt><dd className="truncate font-semibold text-ink">“{t.song}”</dd></div>)}
            </dl>
          </section>

          <AdSlot slot="episode-mid" />

          {!upcoming && <WatchedUpTo ep={n} item={{ id: a.id, slug: a.slug, title: a.title, poster: posterUrl(a, "small"), status: a.status, nextRelease: a.nextRelease, episodeCount: a.episodeCount, episodeLength: a.episodeLength }} />}

          {(a.streaming.length > 0 || dubRuns.length > 0 || hindiSoon || hindi?.status === "available") && (
            <section className="mt-6" aria-labelledby="watch-h">
              <h2 id="watch-h" className="h-section mb-2">Where to watch {a.title} episode {n}</h2>
              {a.streaming.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {a.streaming.map((s) => (
                    <a key={s.id} href={streamLink(s.url)} target="_blank" rel={affiliateRel} className="btn-outline capitalize">▶ {s.site}</a>
                  ))}
                </div>
              )}
              {(dubRuns.length > 0 || hindiSoon || hindi?.status === "available") && (
                <ul className="mt-3 space-y-1.5 text-sm">
                  {dubRuns.map((e) => (
                    <li key={`${e.lang}-${e.service}`}><span className="font-semibold text-ink">{e.lang === "hi" ? "🇮🇳 Hindi" : e.lang === "en" ? "English" : e.lang.toUpperCase()} dub</span> <span className="text-ink/85">on {e.service}{e.weekday ? `, new episodes ${e.weekday}s` : ""}{e.delay ? ` (${e.delay})` : ""}</span></li>
                  ))}
                  {hindiSoon && !dubRuns.some((e) => e.lang === "hi") ? (
                    <li><span className="font-semibold text-ink">🇮🇳 Hindi dub</span> <span className="text-ink/85">announced for {hindiSoon.service}{hindiSoon.premiere ? `, from ${fmtDate(hindiSoon.premiere)}` : ", date not announced yet"}</span></li>
                  ) : hindi?.status === "available" && !dubRuns.some((e) => e.lang === "hi") && (
                    // The franchise's Hindi record: its scope says which seasons, which may not include this one.
                    <li><span className="font-semibold text-ink">🇮🇳 Hindi dub</span> <span className="text-ink/85">on {hindi.platforms.map((p) => `${p.name}${p.scope ? ` (${p.scope})` : ""}${platformKind(p.name) === "free" ? ", free" : ""}`).join("; ")}</span></li>
                  )}
                </ul>
              )}
              <p className="mt-2 text-xs text-muted">Licensed services only; availability depends on your country. <Link href="/dub-schedule" className="text-violet hover:underline">Dub schedule</Link> · <Link href="/hindi-dub" className="text-violet hover:underline">Hindi dubbed anime</Link></p>
            </section>
          )}

          <ReleaseSchedule a={a} lastAired={lastAired} current={n} id="all-episodes" heading={a.status === "current" ? `All ${a.title} episodes: release dates` : `All ${a.title} episodes and air dates`} />

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
          {/* The show's guide pages, linked by what they are ("Naruto filler list"), not "more". */}
          <nav aria-label={`${a.title} guides`} className="card mt-3 p-3">
            <p className="mb-1.5 text-xs font-semibold uppercase tracking-wider text-muted">{a.title} guides</p>
            <ul className="space-y-1 text-sm">
              <li><Link href={`${animePath(a)}/episodes`} className="text-violet hover:text-violet-2">{a.title} episode list</Link></li>
              {fillerFor(a.slug, a.episodeCount ?? (lastAired || null)) && <li><Link href={`${animePath(a)}/filler-list`} className="text-violet hover:text-violet-2">{a.title} filler list</Link></li>}
              <li><Link href={`/watch-order/${a.slug}`} className="text-violet hover:text-violet-2">{a.title} watch order</Link></li>
              {continuationFor(a.slug) && <li><Link href={`${animePath(a)}/manga`} className="text-violet hover:text-violet-2">{a.title} manga: where to read on</Link></li>}
              {a.subtype !== "movie" && a.status === "finished" && <li><Link href={`${animePath(a)}/next-season`} className="text-violet hover:text-violet-2">{a.title} next season</Link></li>}
            </ul>
          </nav>
          <AdSlot slot="episode-side" />
        </aside>
      </div>
    </article>
  );
}
