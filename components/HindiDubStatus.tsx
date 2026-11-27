import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import Faq, { type FaqItem } from "@/components/Faq";
import JoinChannels from "@/components/JoinChannels";
import AnswerLead from "@/components/AnswerLead";
import MadeBy from "@/components/MadeBy";
import { getAnimeBySlug, animeBySlugs, animePath, posterUrl } from "@/lib/kitsu";
import { pageAbout } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { dubDate, dubHref, hindiDubbed, hindiDubPath, statusIndexed, type HindiStatus } from "@/lib/hindidub";
import { LANG, regionalFor, regionalPageEntry, regionalPath, topRegional } from "@/lib/regionaldub";
import { robotsFor } from "@/lib/indexing";
import { safeUrl, servicesIn, streamsBySlug, streamsPath } from "@/lib/streams";
import { languageLine } from "@/lib/langs";

const join = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const day = (iso: string) => dubDate("en", iso);
const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };

/** "Netflix has announced a Hindi dub of X from 5 January 2027" / "…with no start date yet". Pure. */
function announced(st: HindiStatus): string {
  return `${st.service} has announced a Hindi dub of ${st.t}${st.premiere ? ` from ${day(st.premiere)}` : ", with no start date yet"}`;
}

export function statusMetadata(st: HindiStatus): Metadata {
  const y = new Date().getFullYear();
  return {
    title: st.kind === "announced"
      ? fitTitle([`${st.t} Hindi Dub: Release Date & Where to Watch (${y})`, `${st.t} Hindi Dub: Release Date (${y})`, `${st.t} Hindi Dub Release Date`, `${st.t} in Hindi`])
      : fitTitle([`Is ${st.t} Dubbed in Hindi? Hindi Dub Status (${y})`, `Is ${st.t} in Hindi? Dub Status (${y})`, `Is ${st.t} Dubbed in Hindi?`, `${st.t} in Hindi`]),
    description: fitDescription(st.kind === "announced"
      ? `${announced(st)}. What's confirmed so far, where to watch ${st.t} in India until then, and its Tamil and Telugu dubs. Checked ${day(st.checked)}.`
      : `${st.t} has no official Hindi dub yet, and none has been announced (checked ${day(st.checked)}). Where to watch it legally in India now, its Tamil and Telugu status, and similar anime you can watch in Hindi.`),
    alternates: { canonical: hindiDubPath(st.s) },
    robots: robotsFor(statusIndexed(st.s)),
  };
}

/**
 * A Hindi dub status page for an anime with no Hindi dub out (lib/hindidub.ts hindiStatus): announced but not
 * streaming, or checked and not found. The answer first, what's confirmed and where, where it streams in India
 * meanwhile (data/streams.json), Tamil and Telugu, and popular anime that are in Hindi now.
 */
export default async function HindiDubStatus({ st }: { st: HindiStatus }) {
  const a = await getAnimeBySlug(st.s).catch(() => null);
  const anime = { id: a?.id ?? "", slug: st.s };
  const streams = streamsBySlug(st.s);
  const india = streams ? servicesIn(streams, "IN") : [];
  const regional = (["ta", "te"] as const).flatMap((l) => { const x = regionalFor(anime, l); return x ? [{ l, x }] : []; });
  const now = hindiDubbed().filter((d) => d.s !== st.s).slice(0, 8);
  const kitsu = await animeBySlugs(now.map((d) => d.s), true).catch(() => new Map());
  const poster = a ? posterUrl(a, "medium") : null;
  // One link per site: two Netflix title pages read as "netflix.com netflix.com".
  const sources = [...new Map(st.sources.map(safeUrl).filter((u): u is string => Boolean(u)).map((u) => [host(u), u])).values()].slice(0, 4);
  const where = india.length ? join([...new Set(india.map((x) => x.service))]) : null;

  const answer = st.kind === "announced"
    ? `Not yet. ${announced(st)}.${where ? ` Until it starts, ${st.t} streams in India on ${where}.` : ""}`
    : `No. ${st.t} has no official Hindi dub yet, and no platform has announced one.${st.note ? ` ${st.note}` : ""}`;
  const regionalLine = regional.length ? regional.map(({ l, x }) => `${LANG[l].name} on ${join([...new Set(x.platforms.map((p) => p.name))])}`).join("; ") : null;

  const faq: FaqItem[] = [
    { q: `Is ${st.t} dubbed in Hindi?`, a: st.kind === "announced" ? `Not yet: ${announced(st)} (checked ${day(st.checked)}).` : `No. We checked the platforms that carry it in India on ${day(st.checked)} and none offers Hindi audio, and no Hindi dub has been announced.` },
    { q: `When will ${st.t} come in Hindi?`, a: st.kind === "announced" ? (st.premiere ? `${st.service} lists it from ${day(st.premiere)}. Dates can move; this page is updated when the first Hindi episode is out.` : `${st.service} hasn't given a date yet. This page is updated as soon as one is announced or the first Hindi episode is out.`) : `There's no date, because no platform has announced a Hindi dub. Indian dubs are usually announced a few weeks before they start, most often by Crunchyroll, Netflix or Sony YAY!. We re-check every month and update this page.` },
    ...(where ? [{ q: `Where can I watch ${st.t} in India?`, a: `Legally, on ${india.map((x) => `${x.service}${languageLine({ dubs: x.audio, subs: x.subs }) ? ` (${languageLine({ dubs: x.audio, subs: x.subs })})` : ""}`).join("; ")}.` }] : []),
    { q: `Is ${st.t} available in Tamil or Telugu?`, a: regionalLine ? `Yes: ${regionalLine}.` : `Not that we've found: there's no official Tamil or Telugu dub on record either.` },
    { q: `Are the "${st.t} Hindi dubbed" videos on YouTube or Telegram real?`, a: `Not official. ${st.kind === "announced" ? `Until ${st.service}'s dub starts, ` : ""}uploads called "Hindi dubbed" are fan dubs or unlicensed copies; the official Hindi dub, when there is one, comes from the platform that licenses the show.` },
  ];

  return (
    <div className="container-x pb-8">
      {a && <JsonLd data={pageAbout(a, hindiDubPath(st.s), `Is ${st.t} dubbed in Hindi?`)} />}
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/hindi-dub", label: "Hindi dubbed anime" }, { href: hindiDubPath(st.s), label: st.t }]}
        eyebrow={st.kind === "announced" ? "🇮🇳 Hindi dub · announced" : "🇮🇳 Hindi dub status"}
        title={st.kind === "announced" ? <><span className="text-gradient">{st.t}</span> in Hindi: coming soon</> : <>Is <span className="text-gradient">{st.t}</span> dubbed in Hindi?</>}
        subtitle={st.kind === "announced" ? `What's confirmed about the Hindi dub of ${st.t}, who announced it and when it starts, and where to watch it in India until then.` : `Whether ${st.t} has an official Hindi dub, what the platforms that carry it in India offer, and what to watch in Hindi instead.`}
        facts={[
          { value: st.kind === "announced" ? "Announced" : "No", label: "Hindi dub" },
          { value: st.premiere ? day(st.premiere) : "TBA", label: "Hindi start date" },
          ...(regional.length ? [{ value: regional.map(({ l }) => LANG[l].name).join(" + "), label: "dubbed in" }] : []),
        ]}
        hue={25}
        posters={poster ? [poster] : []}
      />

      <AnswerLead checked={day(st.checked)}>{answer}</AnswerLead>

      <section className="reveal mt-10" aria-labelledby="known-h">
        <h2 id="known-h" className="h-section mb-3">What&rsquo;s confirmed</h2>
        <dl className="card grid gap-x-6 gap-y-2 p-4 text-sm sm:grid-cols-[12rem_1fr]">
          <dt className="text-muted">Hindi dub</dt>
          <dd className="text-ink">{st.kind === "announced" ? `Announced by ${st.service}` : "Not announced"}</dd>
          <dt className="text-muted">Starts</dt>
          <dd className="text-ink">{st.premiere ? day(st.premiere) : st.kind === "announced" ? "No date yet" : "—"}</dd>
          {st.note && <><dt className="text-muted">Latest</dt><dd className="text-ink">{st.note}</dd></>}
          <dt className="text-muted">Last checked</dt>
          <dd className="text-ink">{day(st.checked)}</dd>
          {sources.length > 0 && <><dt className="text-muted">Sources</dt><dd className="flex flex-wrap gap-x-3 gap-y-1">{sources.map((u) => <a key={u} href={u} target="_blank" rel="noopener nofollow" className="text-violet hover:underline">{host(u)}</a>)}</dd></>}
        </dl>
      </section>

      <section className="reveal mt-10" aria-labelledby="now-h">
        <h2 id="now-h" className="h-section mb-3">Where to watch {st.t} in India now</h2>
        {india.length ? (
          <ul className="grid gap-2 text-sm sm:grid-cols-2">
            {india.map((x) => (
              <li key={x.service + x.scope} className="card p-3">
                <p className="font-semibold text-ink">{safeUrl(x.url) ? <a href={safeUrl(x.url)!} target="_blank" rel="noopener nofollow" className="hover:text-violet-2">{x.service}</a> : x.service} <span className="text-xs font-normal text-muted">· {x.kind === "free" ? "Free" : x.kind === "buy" ? "Buy or rent" : "Subscription"}</span></p>
                {languageLine({ dubs: x.audio, subs: x.subs }) && <p className="mt-0.5 text-ink/80">{languageLine({ dubs: x.audio, subs: x.subs })}</p>}
                {x.scope && <p className="mt-0.5 text-xs text-muted">{x.scope}</p>}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted">We don&rsquo;t have a confirmed legal stream in India on record.{a ? <> See <Link href={animePath(a)} className="text-violet hover:underline">{st.t}&rsquo;s page</Link> for where it streams.</> : null}</p>
        )}
        <p className="mt-3 flex flex-wrap gap-2 text-sm">
          {streams && <Link href={streamsPath(st.s)} className="chip">Where to watch {st.t} in every country</Link>}
          {regional.filter(({ l }) => regionalPageEntry(st.s, l) && topRegional(st.s, l)).map(({ l }) => <Link key={l} href={regionalPath(st.s, l)} className="chip">{st.t} in {LANG[l].name}</Link>)}
          <Link href="/new-dubs" className="chip">Hindi dubs coming soon</Link>
        </p>
      </section>

      <JoinChannels className="mt-8" source="hindi-status" />

      {now.length > 0 && (
        <section className="reveal mt-10" aria-labelledby="hindi-now-h">
          <h2 id="hindi-now-h" className="h-section mb-1">Popular anime you can watch in Hindi now</h2>
          <p className="mb-4 text-sm text-muted">Official Hindi dubs, most-watched first. <Link href="/hindi-dub" className="text-violet hover:underline">All Hindi dubbed anime →</Link></p>
          <ul className="grid grid-cols-4 gap-3 sm:grid-cols-8">
            {now.map((d) => {
              const k = kitsu.get(d.s);
              const img = k ? posterUrl(k, "small") : null;
              return (
                <li key={d.s} className="min-w-0">
                  <Link href={dubHref(d)} className="group block">
                    <span className="relative block aspect-[5/7] overflow-hidden rounded-lg bg-bg-2">{img && <Image src={img} alt={`${d.t} poster`} fill sizes="(max-width:640px) 22vw, 120px" className="object-cover transition duration-500 group-hover:scale-105" />}</span>
                    <span className="mt-1 line-clamp-2 text-xs font-medium text-ink group-hover:text-violet-2">{d.t}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <MadeBy className="mt-8" method="Checked on the platforms that carry the show in India (their audio languages), the licensors' announcements and Indian anime news. Fan dubs and unofficial uploads never count." date={st.checked} />
      <Faq title={`${st.t} Hindi dub: FAQ`} items={faq} />
    </div>
  );
}
