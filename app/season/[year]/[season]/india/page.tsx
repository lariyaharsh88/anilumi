import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import Faq, { type FaqItem } from "@/components/Faq";
import JoinChannels from "@/components/JoinChannels";
import AnswerLead from "@/components/AnswerLead";
import MadeBy from "@/components/MadeBy";
import { webPage } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { robotsFor } from "@/lib/indexing";
import { SEASONS, cap, animePath, type Season } from "@/lib/kitsu";
import { istTime, sourceUrl } from "@/lib/seasonindia";
import { indiaGuide as load, type Row } from "@/lib/indiaguide";

export const revalidate = 86400;
export async function generateStaticParams() { return []; }

/**
 * An upcoming season for viewers in India: when each show premieres in IST, where it is announced to stream in India,
 * where its earlier seasons already stream there, and which Hindi, Tamil or Telugu dubs exist or are announced.
 * Answers "winter 2027 anime in India" and "will X stream in India / in Hindi" with sources (data/season-india.json,
 * data/where-to-watch.json, the dub lists); nothing here claims a new season streams or is dubbed until announced.
 */
type Props = { params: Promise<{ year: string; season: string }> };
const MONTHS: Record<Season, string> = { winter: "January to March", spring: "April to June", summer: "July to September", fall: "October to December" };
const HUE: Record<Season, number> = { winter: 200, spring: 330, summer: 40, fall: 20 };
const fmt = (iso: string) => new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const list = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}` : xs[0] ?? "");
const KIND: Record<string, string> = { simulcast: "simulcast", later: "after Japan", "free-youtube": "free on YouTube" };

function parse(year: string, season: string) {
  const y = Number(year);
  if (!SEASONS.includes(season as Season) || !(y >= 2000 && y <= new Date().getFullYear() + 2)) notFound();
  return { y, s: season as Season };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { year, season } = await params;
  const { y, s } = parse(year, season);
  const data = await load(y, s);
  if (!data) notFound();
  const label = `${cap(s)} ${y}`;
  const announced = data.rows.filter((r) => r.announced.some((a) => a.india === "yes")).length;
  return {
    title: fitTitle([`${label} Anime in India: Where to Watch, IST Times & Hindi Dubs`, `${label} Anime in India: Where to Watch & IST Times`, `${label} Anime in India`]),
    description: fitDescription(`Every ${label} anime for viewers in India: premiere times in IST, ${announced ? `${announced} confirmed for India, ` : ""}where earlier seasons stream in India, and which may get Hindi, Tamil or Telugu dubs. Sourced and dated.`),
    alternates: { canonical: `/season/${y}/${s}/india` },
    robots: robotsFor(data.indexed),
  };
}

export default async function SeasonIndiaPage({ params }: Props) {
  const { year, season } = await params;
  const { y, s } = parse(year, season);
  const data = await load(y, s);
  if (!data) notFound();
  const { research, rows } = data;
  const label = `${cap(s)} ${y}`;
  const series = rows.filter((r) => r.i.format !== "Movie");
  const announced = rows.filter((r) => r.announced.length);
  const confirmed = announced.filter((r) => r.announced.some((a) => a.india === "yes"));
  const unconfirmed = announced.filter((r) => !r.announced.some((a) => a.india === "yes"));
  const continuing = rows.filter((r) => !r.announced.length && (r.earlier.length || r.x?.previousSeasonIndia));
  const hindiLikely = rows.filter((r) => r.hindi && !r.x?.dubs.hi);
  const hindiAnnounced = rows.filter((r) => r.x?.dubs.hi);
  const timed = rows.filter((r) => r.i.airs).sort((a, b) => a.i.airs! - b.i.airs!);
  const published = research.lineups.filter((l) => l.published);
  const pending = research.lineups.filter((l) => !l.published);

  const whereCell = (r: Row) => {
    if (r.announced.length) return (
      <span>
        {r.announced.map((a, k) => {
          const src = a.sources.map(sourceUrl).find(Boolean);
          return <span key={k}>{k ? ", " : ""}<strong className="text-ink">{a.service}</strong>{KIND[a.kind] ? ` (${KIND[a.kind]})` : ""}{a.india === "unclear" ? " · India not confirmed" : ""}{src && <a href={src} target="_blank" rel="noopener nofollow" className="ml-1 text-xs text-muted underline">source</a>}</span>;
        })}
      </span>
    );
    const no = r.x?.notIndia;
    const noSrc = no?.sources.map(sourceUrl).find(Boolean);
    const prev = r.x?.previousSeasonIndia;
    const prevLine = prev ? `earlier season on ${prev.service}` : r.earlier.length ? `earlier seasons on ${list(r.earlier.map((e) => e.service))}` : null;
    if (no && noSrc) return <span className="text-ink/80"><strong className="text-ink">{no.service}</strong> announced it for other regions, <strong className="text-ink">not India</strong><a href={noSrc} target="_blank" rel="noopener nofollow" className="ml-1 text-xs text-muted underline">source</a>{prevLine ? <span className="block text-xs text-muted">In India, {prevLine}</span> : null}</span>;
    if (prev) return <span className="text-ink/80">Not announced · earlier season on <strong className="text-ink">{prev.service}</strong>{r.earlierSource && <a href={r.earlierSource} target="_blank" rel="noopener nofollow" className="ml-1 text-xs text-muted underline">source</a>}</span>;
    if (r.earlier.length) return <span className="text-ink/80">Not announced · earlier seasons on <strong className="text-ink">{list(r.earlier.map((e) => e.service))}</strong></span>;
    return <span className="text-muted">Not announced yet</span>;
  };
  const dubCell = (r: Row) => {
    const parts: React.ReactNode[] = [];
    for (const [k, lang] of [["hi", "Hindi"], ["ta", "Tamil"], ["te", "Telugu"]] as const) {
      const d = r.x?.dubs[k];
      if (d) parts.push(<span key={k}><strong className="text-ink">{lang}</strong> announced ({d.service})</span>);
    }
    if (!r.x?.dubs.hi && r.hindi) parts.push(<span key="hl">Earlier seasons in <Link href={r.hindi.href} className="text-violet hover:underline">Hindi</Link> ({r.hindi.platform})</span>);
    for (const g of r.regional) if (!r.x?.dubs[g.lang === "Tamil" ? "ta" : "te"]) parts.push(<span key={g.lang}>Earlier seasons in {g.lang} ({g.platform})</span>);
    return parts.length ? <span className="flex flex-col gap-0.5">{parts}</span> : <span className="text-muted">None announced</span>;
  };

  const faq: FaqItem[] = [
    { q: `Which ${label} anime will stream in India?`, a: `${confirmed.length ? `${confirmed.length} are confirmed for India so far: ${list(confirmed.map((r) => `${r.title} on ${r.announced[0].service}`))}.` : "None is confirmed for India yet."}${unconfirmed.length ? ` ${unconfirmed.length} more are announced on a service without India being named, including ${list(unconfirmed.slice(0, 3).map((r) => `${r.title} (${r.announced[0].service})`))}.` : ""}${pending.length ? ` ${list(pending.map((l) => l.service))} ${pending.length === 1 ? "hasn't" : "haven't"} published ${pending.length === 1 ? "its" : "their"} line-up yet.` : ""} Sequels usually stay with the service that has their earlier seasons in India.` },
    { q: `What time do ${label} anime come out in India?`, a: timed.length ? `Episodes air in Japan first; times in IST are listed above for ${timed.length} shows. The first is ${timed[0].title} on ${istTime(timed[0].i.airs!)}. Streaming services usually post an episode shortly after the Japanese broadcast.` : "Broadcast times haven't been announced yet." },
    ...hindiLikely.slice(0, 4).map((r) => ({ q: `Will ${r.title} be dubbed in Hindi?`, a: `Not announced yet. The earlier seasons have an official Hindi dub on ${r.hindi!.platform}, so it's one of the likeliest; Hindi dubs usually come months after Japan.` })),
    ...announced.slice(0, 3).map((r) => ({ q: `Where can I watch ${r.title} in India?`, a: `${list(r.announced.map((a) => `${a.service}${KIND[a.kind] ? ` (${KIND[a.kind]})` : ""}`))} announced it${r.announced.some((a) => a.india === "yes") ? " for India" : ", though India isn't confirmed in the announcement"}.${r.i.airs ? ` It premieres ${istTime(r.i.airs)}.` : ""}` })),
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={webPage("CollectionPage", `/season/${y}/${s}/india`, `${label} anime in India`, `Where ${label} anime stream in India, IST premiere times and Hindi, Tamil and Telugu dubs.`)} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/season", label: "Seasons" }, { href: `/season/${y}/${s}`, label }, { href: `/season/${y}/${s}/india`, label: "In India" }]}
        eyebrow={`🇮🇳 ${MONTHS[s]} ${y}`}
        title={<>{label} anime <span className="text-gradient">in India</span></>}
        subtitle="When each show premieres in IST, where it streams in India, and which may get Hindi, Tamil or Telugu dubs. Only announced streaming is shown as announced; for sequels we show where the earlier seasons already stream."
        facts={[
          { value: String(series.length), label: "series" },
          { value: String(confirmed.length), label: "confirmed for India" },
          { value: String(timed.length), label: "with IST times" },
        ]}
        hue={HUE[s]}
      >
        <p className="flex flex-wrap gap-2 text-sm">
          <Link href={`/season/${y}/${s}/preview`} className="chip">Full {label} preview</Link>
          <Link href="/hindi-dub" className="chip">Hindi dubbed anime</Link>
          <Link href="/tamil-dub" className="chip">Tamil dubs</Link>
          <Link href="/telugu-dub" className="chip">Telugu dubs</Link>
          <Link href="/crunchyroll-price-india" className="chip">Crunchyroll price in India</Link>
        </p>
      </PageHero>

      <AnswerLead checked={fmt(research.checked)}>
        {label} has {series.length} anime series. {confirmed.length ? `${confirmed.length} ${confirmed.length === 1 ? "is" : "are"} confirmed to stream in India (${confirmed.length > 4 ? `${confirmed.slice(0, 4).map((r) => `${r.title} on ${r.announced[0].service}`).join(", ")} and ${confirmed.length - 4} more` : list(confirmed.map((r) => `${r.title} on ${r.announced[0].service}`))})` : "None is confirmed for India yet"}{unconfirmed.length ? `, and ${unconfirmed.length} more ${unconfirmed.length === 1 ? "is" : "are"} announced on a service without India being named` : ""}.
        {pending.length ? ` ${list(pending.map((l) => l.service))} ${pending.length === 1 ? "hasn't" : "haven't"} published ${pending.length === 1 ? "its" : "their"} ${label} line-up yet, so expect more.` : ""} {continuing.length ? `${continuing.length} sequels continue shows already streaming in India, usually on the same service. ` : ""}
        {hindiAnnounced.length ? `${hindiAnnounced.length} ${hindiAnnounced.length === 1 ? "has" : "have"} a Hindi dub announced. ` : "No Hindi, Tamil or Telugu dub is announced yet"}{hindiLikely.length ? `${hindiAnnounced.length ? "" : "; "}${hindiLikely.length} continue series with an official Hindi dub.` : hindiAnnounced.length ? "" : "."}
      </AnswerLead>

      {timed.length > 0 && (
        <section className="reveal pt-10" aria-labelledby="ist-h">
          <h2 id="ist-h" className="h-section mb-1">Premiere times in India (IST)</h2>
          <p className="mb-3 max-w-3xl text-sm text-muted">Episode 1 in Japan, converted to Indian time. Streaming services usually post each episode shortly after the broadcast.</p>
          <ol className="grid gap-2 sm:grid-cols-2">
            {timed.map((r) => (
              <li key={r.i.id} className="card flex items-baseline justify-between gap-3 px-4 py-2.5 text-sm">
                {r.i.anime ? <Link href={animePath(r.i.anime)} className="font-medium text-ink hover:text-violet-2">{r.title}</Link> : <span className="font-medium text-ink">{r.title}</span>}
                <span className="shrink-0 tabular-nums text-muted">{istTime(r.i.airs!)}</span>
              </li>
            ))}
          </ol>
        </section>
      )}

      <section className="reveal pt-10" aria-labelledby="tbl-h">
        <h2 id="tbl-h" className="h-section mb-1">Where every {label} anime streams in India</h2>
        <p className="mb-3 max-w-3xl text-sm text-muted">Most-followed first. &ldquo;Announced&rdquo; means a service named India (or a region including it) for this season; earlier seasons come from our India where-to-watch research.</p>
        <div className="card overflow-x-auto">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="border-b border-line text-xs uppercase tracking-wide text-muted">
              <tr><th className="px-4 py-2.5">Anime</th><th className="px-4 py-2.5">Premiere</th><th className="px-4 py-2.5">Where in India</th><th className="px-4 py-2.5">Dubs</th></tr>
            </thead>
            <tbody className="divide-y divide-line">
              {rows.map((r) => (
                <tr key={r.i.id} className="align-top">
                  <td className="px-4 py-2.5">
                    {r.i.anime ? <Link href={animePath(r.i.anime)} className="font-medium text-ink hover:text-violet-2">{r.title}</Link> : <span className="font-medium text-ink">{r.title}</span>}
                    <span className="block text-xs text-muted">{r.i.kind === "sequel" ? "Sequel" : r.i.kind === "movie" ? "Film" : "New"}{r.i.studio ? ` · ${r.i.studio}` : ""}</span>
                  </td>
                  <td className="px-4 py-2.5 tabular-nums text-ink/80">{r.i.airs ? istTime(r.i.airs) : r.i.date.month ? new Date(Date.UTC(r.i.date.year ?? y, r.i.date.month - 1, r.i.date.day || 1)).toLocaleDateString("en-GB", { ...(r.i.date.day ? { day: "numeric" } : {}), month: "short", timeZone: "UTC" }) : "TBA"}</td>
                  <td className="px-4 py-2.5">{whereCell(r)}</td>
                  <td className="px-4 py-2.5">{dubCell(r)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {research.lineups.length > 0 && (
        <section className="reveal pt-10" aria-labelledby="lu-h">
          <h2 id="lu-h" className="h-section mb-3">Service line-ups for {label}</h2>
          <ul className="grid gap-2 md:grid-cols-2">
            {research.lineups.map((l) => {
              const src = l.sources.map(sourceUrl).find(Boolean);
              return (
                <li key={l.service} className="card px-4 py-3 text-sm">
                  <p className="font-semibold text-ink">{l.service}: {l.published ? `published${l.date ? ` ${fmt(l.date)}` : ""}` : "not published yet"}</p>
                  {l.note && <p className="mt-0.5 text-ink/80">{l.note}</p>}
                  {src && <a href={src} target="_blank" rel="noopener nofollow" className="mt-1 inline-block text-xs text-muted underline">Source</a>}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <MadeBy className="mt-8" path={`/season/${y}/${s}/india`} method="Line-up and broadcast times from AniList; India streaming only as the services or official sites announce it (Crunchyroll, Netflix, Muse, Ani-One and others), earlier seasons from our India where-to-watch research, dubs from the platforms' own pages." date={research.checked} />
      <JoinChannels source="season-india" lang="Indian" className="mt-8" />
      <Faq title={`${label} anime in India: FAQ`} items={faq} />
    </div>
  );
}
