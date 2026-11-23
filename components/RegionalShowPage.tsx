import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/Link";
import Image from "next/image";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import Faq, { type FaqItem } from "@/components/Faq";
import AnswerLead from "@/components/AnswerLead";
import JoinChannels from "@/components/JoinChannels";
import { getAnimeBySlug, posterUrl } from "@/lib/kitsu";
import { pageAbout } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { dubFor, dubHref, platformKind, type PlatformKind } from "@/lib/hindidub";
import { LANG, regionalDate, regionalFor, regionalPageEntry, regionalPath, topRegional, type RegionalDub, type RegionalLang } from "@/lib/regionaldub";
import { robotsFor } from "@/lib/indexing";
import { streamsBySlug, streamsPath } from "@/lib/streams";

const KIND_TAG: Record<PlatformKind, string> = { free: "Free", subscription: "Paid", tv: "TV channel" };
const join = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const names = (d: RegionalDub) => [...new Set(d.platforms.map((p) => p.name))];

function load(slug: string, lang: RegionalLang): RegionalDub {
  const d = regionalPageEntry(decodeURIComponent(slug), lang);
  if (!d) notFound();
  return d;
}

export function regionalShowMetadata(slug: string, lang: RegionalLang): Metadata {
  const d = load(slug, lang);
  const L = LANG[lang].name;
  const y = new Date().getFullYear();
  const free = d.platforms.some((p) => platformKind(p.name) === "free");
  return {
    title: fitTitle([`${d.t} in ${L}: Where to Watch the ${L} Dub (${y})`, `${d.t} in ${L}: Where to Watch (${y})`, `${d.t} ${L} Dub: Where to Watch`]),
    description: fitDescription(`${d.t} has an official ${L} dub on ${join(names(d).slice(0, 3))}${free ? ", including a free, legal option" : ""}. Which seasons are in ${L}, free or paid, and the Hindi and ${LANG[LANG[lang].other].name} dubs. Checked ${regionalDate()}.`),
    alternates: { canonical: regionalPath(d.s, lang) },
    robots: robotsFor(topRegional(d.s, lang)),
  };
}

/** One anime's official Tamil or Telugu dub: where it streams, which seasons, free or paid, and its other dubs. */
export default async function RegionalShowPage({ slug, lang }: { slug: string; lang: RegionalLang }) {
  const d = load(slug, lang);
  const L = LANG[lang], other = LANG[L.other];
  const a = await getAnimeBySlug(d.s).catch(() => null);
  const anime = { id: a?.id ?? "", slug: d.s };
  const rows = d.platforms.map((p) => ({ ...p, kind: platformKind(p.name) }));
  const free = rows.filter((r) => r.kind === "free");
  const hindi = a ? dubFor(a) : null;
  const otherDub = regionalFor(anime, L.other);
  const streams = streamsBySlug(d.s) ? streamsPath(d.s) : null;
  const poster = a ? posterUrl(a, "medium") : null;

  const faq: FaqItem[] = [
    { q: `Is ${d.t} dubbed in ${L.name}?`, a: `Yes. ${d.t} has an official ${L.name} dub on ${join(rows.map((r) => `${r.name}${r.scope ? ` (${r.scope})` : ""}`))}.` },
    { q: `Can I watch ${d.t} in ${L.name} for free?`, a: free.length ? `Yes, legally: ${join(free.map((r) => r.name))}, with ads.` : `Not legally, as far as we found: the ${L.name} dub is on ${join(names(d))}, which need a subscription.` },
    { q: `Is ${d.t} available in Hindi?`, a: hindi?.status === "available" ? `Yes, on ${join([...new Set(hindi.platforms.map((p) => p.name))])}.` : `No official Hindi dub found yet.` },
    { q: `Is ${d.t} available in ${other.name}?`, a: otherDub ? `Yes, on ${join(names(otherDub))}.` : `No official ${other.name} dub found yet.` },
    { q: `How do I switch ${d.t} to ${L.name} audio?`, a: `Open an episode, then the player's audio or language menu (Audio & Subtitles on Netflix and Prime Video, the gear icon on Crunchyroll and YouTube) and pick ${L.name}. If ${L.name} isn't listed for an episode, that season isn't dubbed yet.` },
  ];

  return (
    <div className="container-x pb-8">
      {a && <JsonLd data={pageAbout(a, regionalPath(d.s, lang), `${d.t} in ${L.name}`)} />}
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: L.path, label: `${L.name} dubbed anime` }, { href: regionalPath(d.s, lang), label: `${d.t} in ${L.name}` }]}
        eyebrow={`🇮🇳 ${L.name} dub · ${L.native}`}
        title={<>{d.t} in <span className="text-gradient">{L.name}</span></>}
        subtitle={`Where to watch ${d.t} with ${L.name} audio, legally: each platform, which seasons, and whether it's free.`}
        hue={lang === "ta" ? 15 : 200}
        posters={poster ? [poster] : []}
      >
        <p className="flex flex-wrap gap-2 text-sm">
          {a && <Link href={`/anime/${d.s}`} className="chip">{d.t} guide</Link>}
          {hindi?.status === "available" && <Link href={dubHref(hindi)} className="chip">🇮🇳 In Hindi</Link>}
          {otherDub && <Link href={regionalPath(otherDub.s, L.other)} className="chip">In {other.name}</Link>}
          {streams && <Link href={streams} className="chip">Where to watch (all languages)</Link>}
          <Link href={L.path} className="chip">All {L.name} dubbed anime</Link>
        </p>
      </PageHero>

      <AnswerLead checked={regionalDate()}>
        Yes. {d.t} has an official {L.name} dub on {join(rows.map((r) => `${r.name}${r.scope ? ` (${r.scope})` : ""}`))}.{free.length ? ` ${join(free.map((r) => r.name))} ${free.length === 1 ? "is" : "are"} free and legal.` : ""}
      </AnswerLead>

      <section className="reveal pt-10" aria-labelledby="where-h">
        <h2 id="where-h" className="h-section mb-3">Where to watch {d.t} in {L.name}</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {rows.map((r) => (
            <li key={r.name + r.scope} className="card flex gap-3 p-4">
              {poster && <span className="relative h-20 w-14 shrink-0 overflow-hidden rounded-md bg-bg-2"><Image src={poster} alt={`${d.t} poster`} fill sizes="56px" className="object-cover" /></span>}
              <div className="min-w-0">
                <p className="font-semibold text-ink">{r.name} <span className={`ml-1 rounded-full px-2 py-0.5 text-[11px] font-semibold ${r.kind === "free" ? "bg-emerald-500/15 text-emerald-300" : "bg-white/5 text-muted"}`}>{KIND_TAG[r.kind]}</span></p>
                {r.scope && <p className="mt-1 text-sm text-ink/85">{r.scope}</p>}
                <a href={r.url} target="_blank" rel="noopener nofollow" className="mt-1 inline-block text-xs text-violet hover:underline">Source ↗</a>
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">Checked against the platform&apos;s own page or the licensor&apos;s announcement on {regionalDate()}. Fan lists never count.</p>
      </section>

      <JoinChannels source={`${lang}-show`} className="mt-8" />
      <Faq title={`${d.t} in ${L.name}: FAQ`} items={faq} />
    </div>
  );
}
