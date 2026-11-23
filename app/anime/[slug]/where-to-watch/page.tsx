import type { Metadata } from "next";
import EditorWatched from "@/components/EditorWatched";
import { notFound } from "next/navigation";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import Faq, { type FaqItem } from "@/components/Faq";
import RegionTabs from "@/components/RegionTabs";
import StreamServices from "@/components/StreamServices";
import { getAnimeBySlug, animePath, posterUrl } from "@/lib/kitsu";
import { pageAbout } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { REGIONS, REGION_FLAG, REGION_NAME, REGION_SHORT, dubbedIn, freeIn, servicesIn, streamsBySlug, streamsDate, streamsPath, type Region, type Streams } from "@/lib/streams";
import { hasHindiDub } from "@/lib/hindidub";
import { WATCH_ORDER_OVERRIDES } from "@/data/watch-orders";

export const revalidate = 86400;
export async function generateStaticParams() { return []; }
type Props = { params: Promise<{ slug: string }> };

/** Researched franchises only: the page exists where data/where-to-watch.json has an entry for this exact slug. */
async function load(slug: string) {
  const e = streamsBySlug(decodeURIComponent(slug));
  if (!e) notFound();
  const a = await getAnimeBySlug(e.s).catch(() => null);
  return { e, a };
}

const names = (e: Streams, r: Region) => [...new Set(servicesIn(e, r).filter((x) => x.kind !== "buy").map((x) => x.service))];
const join = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
/** The brands a show streams on, most countries first ("Crunchyroll on Sony LIV" counts as Crunchyroll). */
function topBrands(e: Streams, n = 2): string[] {
  const count = new Map<string, number>();
  for (const r of REGIONS) for (const s of new Set(names(e, r).map((x) => x.replace(/ on .*$| \(.*\)$/, "")))) count.set(s, (count.get(s) ?? 0) + 1);
  return [...count.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([s]) => s);
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const { e } = await load(slug);
  const us = names(e, "US"), inn = names(e, "IN");
  const lead = [us.length ? `${join(us.slice(0, 3))} in the US` : null, inn.length ? `${join(inn.slice(0, 3))} in India` : null].filter(Boolean).join("; ");
  // The services by name: US searches pair them with the show ("crunchyroll one piece" 110K a month, "crunchyroll demon
  // slayer" 27K; Keyword Planner, Nov 2026).
  const brands = topBrands(e);
  return {
    title: fitTitle([brands.length ? `Where to Watch ${e.t}: ${brands.join(" & ")} (Sub & Dub)` : null, brands.length ? `Where to Watch ${e.t}: ${brands.join(" & ")}` : null, brands.length ? `${e.t}: ${brands.join(" & ")} & More, Where to Watch` : null, `Where to Watch ${e.t}: Streaming in the US, India & UK (Sub & Dub)`, `Where to Watch ${e.t}: US, India & UK Streaming`, `Where to Watch ${e.t} (Sub & Dub)`, `Where to Watch ${e.t}`]),
    description: fitDescription(`${lead ? `${e.t} streams on ${lead}.` : `Where ${e.t} streams legally.`} Every legal option by country, with sub, English dub${dubbedIn(e, "IN", "hi") ? " and Hindi dub" : ""}, free options and which seasons each service has. Checked ${streamsDate()}.`.slice(0, 300)),
    alternates: { canonical: streamsPath(e.s) },
  };
}

export default async function WhereToWatchPage({ params }: Props) {
  const { slug } = await params;
  const { e, a } = await load(slug);
  const guide = WATCH_ORDER_OVERRIDES[e.s] ? `/watch-order/${e.s}` : null;
  const free = REGIONS.filter((r) => freeIn(e, r).length);
  const faq: FaqItem[] = [
    ...REGIONS.map((r) => {
      const n = names(e, r);
      return { q: `Where can I watch ${e.t} in ${r === "US" ? "the US" : r === "GB" ? "the UK" : "India"}?`, a: n.length ? `On ${join(n)}. ${servicesIn(e, r).filter((x) => x.kind !== "buy").map((x) => `${x.service}: ${x.scope || "available"}`).join("; ")}.` : `We found no legal streaming service for ${e.t} in ${REGION_NAME[r]} on ${streamsDate()}.` };
    }),
    ...(() => {
      const on = REGIONS.filter((r) => names(e, r).some((x) => /^crunchyroll/i.test(x)));
      return [{ q: `Is ${e.t} on Crunchyroll?`, a: on.length ? `Yes, in ${join(on.map((r) => (r === "US" ? "the US" : r === "GB" ? "the UK" : "India")))}${on.length < REGIONS.length ? `; not in ${join(REGIONS.filter((r) => !on.includes(r)).map((r) => (r === "US" ? "the US" : r === "GB" ? "the UK" : "India")))}` : ""}. ${servicesIn(e, on[0]).filter((x) => /^crunchyroll/i.test(x.service)).map((x) => x.scope).filter(Boolean).map((x) => (/[.!?]$/.test(x) ? x : `${x}.`))[0] ?? ""}`.trim() : `Not in the US, India or the UK, as far as we found. It streams on ${join(topBrands(e, 3)) || "no legal service we found"}.` }];
    })(),
    { q: `Can I watch ${e.t} for free?`, a: free.length ? `Yes, legally: ${free.map((r) => `${freeIn(e, r).map((x) => x.service).join(", ")} in ${REGION_SHORT[r]}`).join("; ")}. Usually with ads.` : `Not legally, as far as we found. Sites offering it free are unlicensed uploads.` },
    { q: `Is ${e.t} dubbed in English?`, a: REGIONS.some((r) => dubbedIn(e, r, "en")) ? `Yes. The English dub is on ${join([...new Set(REGIONS.flatMap((r) => servicesIn(e, r).filter((x) => x.audio.includes("en")).map((x) => `${x.service} (${REGION_SHORT[r]})`)))])}.` : `We found no English dub on the services we checked.` },
  ];
  const poster = a ? posterUrl(a, "medium") : null;

  return (
    <div className="container-x pb-8">
      {a && <JsonLd data={pageAbout(a, streamsPath(e.s), `Where to watch ${e.t}`)} />}
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, ...(a ? [{ href: animePath(a), label: a.title }] : [{ href: "/where-to-watch", label: "Where to watch anime" }]), { href: streamsPath(e.s), label: "Where to watch" }]}
        eyebrow="▶ Where to watch"
        title={<>Where to watch <span className="text-gradient">{e.t}</span></>}
        subtitle={`Every legal way to stream ${e.t} in the US, India and the UK: which service, sub or dub, free or paid, and which seasons it has.`}
        facts={REGIONS.map((r) => ({ value: String(names(e, r).length), label: `services in ${REGION_SHORT[r]}` }))}
        hue={200}
        posters={poster ? [poster] : []}
      />
      <EditorWatched anime={{ id: a?.id ?? "", slug: e.s }} className="mt-4" />

      <section className="reveal mt-8" aria-labelledby="wtw-h">
        <h2 id="wtw-h" className="sr-only">Streaming by country</h2>
        <RegionTabs regions={[...REGIONS]} labels={Object.fromEntries(REGIONS.map((r) => [r, `${REGION_FLAG[r]} ${REGION_SHORT[r]}`]))}>
          <div className="grid gap-3">
            {REGIONS.map((r) => (
              <div key={r} data-region={r} className="card p-4 sm:p-5">
                <h3 className="mb-3 font-semibold text-ink">{REGION_FLAG[r]} {REGION_NAME[r]}</h3>
                <StreamServices e={e} r={r} />
                {r === "IN" && hasHindiDub(e.s) && <p className="mt-3 text-sm"><Link href="/hindi-dub" className="text-violet hover:underline">More anime in Hindi →</Link></p>}
              </div>
            ))}
          </div>
        </RegionTabs>
        {e.note && <p className="mt-4 max-w-3xl text-sm text-ink/85">{e.note}</p>}
        <p className="mt-3 text-xs text-muted">Checked {streamsDate()} against each service&apos;s own page, JustWatch and official announcements. Catalogues change, so check the service before you subscribe. Other countries: see the live list on the <Link href={a ? `${animePath(a)}#watch` : "/where-to-watch"} className="text-violet hover:underline">anime page</Link>.</p>
        <div className="mt-4 flex flex-wrap gap-2 text-sm">
          {guide && <Link href={guide} className="chip">Watch order</Link>}
          {a && <Link href={animePath(a)} className="chip">About {e.t}</Link>}
          <Link href="/dub-schedule" className="chip">Dub schedule</Link>
          <Link href="/where-to-watch" className="chip">More anime: where to watch</Link>
        </div>
      </section>

      {e.sources.length > 0 && (
        <details className="mt-8 text-sm text-muted">
          <summary className="cursor-pointer">Sources ({e.sources.length})</summary>
          <ul className="mt-2 space-y-1 break-all">
            {e.sources.filter((u) => /^https:\/\//.test(u)).map((u) => <li key={u}><a href={u} target="_blank" rel="noopener nofollow" className="hover:text-violet-2 hover:underline">{u}</a></li>)}
          </ul>
        </details>
      )}

      <Faq title={`${e.t}: streaming FAQ`} items={faq} />
    </div>
  );
}
