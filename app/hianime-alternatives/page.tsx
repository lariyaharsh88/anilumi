import type { Metadata } from "next";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import Faq, { type FaqItem } from "@/components/Faq";
import AnswerLead from "@/components/AnswerLead";
import MadeBy from "@/components/MadeBy";
import { itemList } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { REGIONS, REGION_FLAG, REGION_NAME, allStreams, catalogue, servicesIn, streamsDate, streamsPath, STREAMS_CHECKED, type Region, type Streams } from "@/lib/streams";
import { hindiDubbed, platformKind } from "@/lib/hindidub";

export const revalidate = 86400;

/**
 * Legal alternatives to HiAnime for viewers anywhere (the India-only Hindi page is /anime-salt-alternatives).
 * Keyword Planner, India, 2026: "hianime alternative" 8.1K a month in May, 1.3K in October; "aniwatch alternative"
 * 880. Bing keyword research (Nov 2026, impressions a year): hianime 675K, aniwatch 519K, hi anime 141K, anime kai
 * 126K, zoro anime 17K, animesuge 17K. Counts come from the where-to-watch research (lib/streams), by country.
 */
const y = new Date().getFullYear();
const list = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}` : xs[0] ?? "");
const short = (service: string) => service.replace(/ \(now free on Prime Video\)$/, " (Prime Video's free tier)");
/** Names people search alongside HiAnime. Named without a verdict on each: we haven't reviewed them. */
const ALSO = ["Aniwatch", "Zoro", "Anime Kai", "AnimeSuge"];

type Row = { service: string; free: boolean; titles: Streams[]; dubbed: number };
function rows(r: Region): Row[] {
  return catalogue(r).map((c) => ({
    service: c.service,
    free: c.kind === "free",
    titles: c.titles,
    // English dub on that service, in that country.
    dubbed: c.titles.filter((e) => servicesIn(e, r).some((x) => x.service === c.service && x.audio.includes("en"))).length,
  }));
}

function data() {
  const all = allStreams();
  const by = Object.fromEntries(REGIONS.map((r) => [r, rows(r)])) as Record<Region, Row[]>;
  const freeHindi = hindiDubbed().filter((d) => d.platforms.some((p) => platformKind(p.name) === "free")).length;
  return { all, by, freeHindi };
}

export function generateMetadata(): Metadata {
  const { all, by } = data();
  const best = by.US[0];
  return {
    title: fitTitle([`HiAnime Alternatives (${y}): Legal Sites With Sub & Dub`, `HiAnime Alternatives (${y}): Legal Anime Sites`, `HiAnime Alternatives (${y})`]),
    description: fitDescription(`Legal alternatives to HiAnime, by country: ${best.service} streams ${best.titles.length} of the ${all.length} most-followed anime in the US, with free options in the US, India and the UK and which have English and Hindi dubs. Checked ${streamsDate()}.`),
    alternates: { canonical: "/hianime-alternatives" },
  };
}

/** The legal services that come closest to HiAnime (one site, most shows, sub and dub), country by country. */
export default function HiAnimeAlternatives() {
  const { all, by, freeHindi } = data();
  const top = (r: Region) => by[r][0];
  const freeOf = (r: Region) => by[r].filter((x) => x.free);
  const dubsMost = (r: Region) => [...by[r]].sort((a, b) => b.dubbed - a.dubbed)[0];
  const where = (r: Region) => (r === "IN" ? "India" : r === "US" ? "the US" : "the UK");

  const faq: FaqItem[] = [
    { q: "What is the best alternative to HiAnime?", a: `${REGIONS.every((r) => top(r).service === top("US").service) ? `${top("US").service} has the biggest catalogue in all three countries: ${top("US").titles.length} of the ${all.length} most-followed anime in the US, ${top("IN").titles.length} in India and ${top("GB").titles.length} in the UK` : REGIONS.map((r) => `${top(r).service} leads in ${where(r)} (${top(r).titles.length} of the ${all.length})`).join(", ")}, subtitled and often dubbed. Next: ${REGIONS.map((r) => `${by[r].find((x) => !x.free && x !== top(r))?.service} in ${where(r)}`).join(", ")}.` },
    { q: "Is there a free alternative to HiAnime?", a: `Yes, with ads and a smaller catalogue: ${list(freeOf("US").slice(0, 3).map((x) => x.service))} in the US; ${list(freeOf("IN").slice(0, 2).map((x) => short(x.service).replace(/ \(YouTube\)$/, " on YouTube")))} in India, where ${freeHindi} anime are also free in Hindi. See every free anime website and app.` },
    { q: "Which HiAnime alternative has English dubs?", a: `In the US, ${dubsMost("US").service}: ${dubsMost("US").dubbed} of the most-followed anime have an English dub there. In the UK, ${dubsMost("GB").service} (${dubsMost("GB").dubbed}); in India, ${dubsMost("IN").service} (${dubsMost("IN").dubbed}).` },
    { q: "Is HiAnime legal?", a: "No. HiAnime streams anime without a licence from the studios or distributors, so AniLumi doesn't link to it. Every service on this page licenses the shows it streams." },
    { q: "Is HiAnime safe?", a: "Unlicensed streaming sites pay their way with pop-ups and redirect ads, a common route for scams and malware, especially on phones. The services here are apps and sites run by the licensors, with no pop-ups." },
    { q: `What about ${list(ALSO)}?`, a: "AniLumi doesn't review unofficial sites. The legal options are the same: the services on this page, and each show's page on AniLumi lists every place it streams in your country." },
    { q: "Where can I watch anime in Hindi instead?", a: `${freeHindi} anime are free and legal in Hindi on the licensors' YouTube channels and Prime Video's free tier, and more on Crunchyroll, Netflix and JioHotstar. See the Hindi alternatives to Anime Salt and Anime World.` },
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={itemList("Legal alternatives to HiAnime", REGIONS.flatMap((r) => by[r].slice(0, 4).map((x) => ({ url: `/hianime-alternatives#${r.toLowerCase()}`, name: `${x.service} (${REGION_NAME[r]})` }))))} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/where-to-watch", label: "Where to watch" }, { href: "/hianime-alternatives", label: "HiAnime alternatives" }]}
        eyebrow="✅ Legal anime sites"
        title={<>HiAnime alternatives: <span className="text-gradient">legal sites with sub &amp; dub</span></>}
        subtitle={`Looking for HiAnime, ${list(ALSO)}? These are the licensed services that come closest, country by country, with how many popular anime each has and which have dubs. AniLumi isn't affiliated with any of them.`}
        facts={[
          { value: String(all.length), label: "anime checked" },
          { value: String(REGIONS.length), label: "countries" },
          { value: String(REGIONS.reduce((n, r) => n + freeOf(r).length, 0)), label: "free services" },
        ]}
        hue={210}
      >
        <p className="flex flex-wrap gap-2 text-sm">
          <Link href="/free-anime-websites" className="chip">🆓 Free anime websites</Link>
          <Link href="/where-to-watch" className="chip">Where to watch each anime</Link>
          <Link href="/sub-vs-dub" className="chip">Sub vs dub</Link>
          <Link href="/anime-salt-alternatives" className="chip">🇮🇳 Hindi: Anime Salt alternatives</Link>
        </p>
      </PageHero>

      <AnswerLead checked={streamsDate()}>
        {REGIONS.every((r) => top(r).service === top("US").service)
          ? `The closest legal alternative to HiAnime is ${top("US").service}, the biggest licensed catalogue in all three countries: ${top("US").titles.length} of the ${all.length} most-followed anime in the US, ${top("IN").titles.length} in India and ${top("GB").titles.length} in the UK, subtitled and often dubbed.`
          : `The closest legal alternative to HiAnime is the biggest licensed catalogue in your country: ${list(REGIONS.map((r) => `${top(r).service} in ${where(r)} (${top(r).titles.length} of the ${all.length} most-followed anime)`))}, subtitled and often dubbed.`} For free, with ads: {list(freeOf("US").slice(0, 2).map((x) => x.service))} in the US and {short(freeOf("IN")[0]?.service ?? "YouTube")} in India.
      </AnswerLead>

      {REGIONS.map((r) => (
        <section key={r} id={r.toLowerCase()} className="reveal scroll-mt-32 pt-10" aria-labelledby={`${r}-h`}>
          <h2 id={`${r}-h`} className="h-section mb-1">{REGION_FLAG[r]} HiAnime alternatives in {where(r)}</h2>
          <p className="mb-4 max-w-3xl text-sm text-muted">The biggest catalogue is {top(r).service} ({top(r).titles.length} of the {all.length} most-followed anime); the most English dubs, {dubsMost(r).service} ({dubsMost(r).dubbed}).</p>
          <div className="-mx-4 overflow-x-auto px-4">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wide text-muted">
                <tr className="border-b border-line"><th className="py-2 pr-3 font-semibold">Service</th><th className="py-2 pr-3 font-semibold">Cost</th><th className="py-2 pr-3 text-right font-semibold">Popular anime</th><th className="py-2 text-right font-semibold">English dub</th></tr>
              </thead>
              <tbody>
                {by[r].slice(0, 8).map((x) => (
                  <tr key={x.service} className="border-b border-line/50">
                    <td className="py-2.5 pr-3 font-medium text-ink">{short(x.service)}</td>
                    <td className="py-2.5 pr-3">{x.free ? <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">Free</span> : <span className="text-ink/80">Subscription</span>}</td>
                    <td className="py-2.5 pr-3 text-right tabular-nums">{x.titles.length}</td>
                    <td className="py-2.5 text-right tabular-nums">{x.dubbed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mt-3 flex flex-wrap gap-1.5 text-xs"><span className="py-1 text-muted">On {top(r).service}:</span>{top(r).titles.slice(0, 8).map((e) => <Link key={e.s} href={streamsPath(e.s)} className="chip text-xs">{e.t}</Link>)}</p>
        </section>
      ))}

      <section className="reveal pt-10" aria-labelledby="why-h">
        <h2 id="why-h" className="h-section mb-3">Why not HiAnime?</h2>
        <ul className="grid gap-3 md:grid-cols-3">
          <li className="card p-4 text-sm leading-6 text-ink/90"><strong className="block text-ink">It isn&apos;t licensed</strong>The studios and distributors who make the shows aren&apos;t paid, and AniLumi doesn&apos;t link to it.</li>
          <li className="card p-4 text-sm leading-6 text-ink/90"><strong className="block text-ink">Pop-ups and redirects</strong>Unlicensed sites run on ads that open new tabs and fake download buttons, a common way to get malware on a phone.</li>
          <li className="card p-4 text-sm leading-6 text-ink/90"><strong className="block text-ink">One show at a time</strong>Not sure where a show streams in your country? Every anime page on AniLumi lists each legal service, with sub, dub and free options.</li>
        </ul>
        <p className="mt-4 text-sm text-muted">Searching for {list(ALSO)}? AniLumi doesn&apos;t review unofficial sites; the services above are the legal options. <Link href="/anime-streaming-sites#legal-h" className="text-violet hover:underline">Is anime streaming legal in India? →</Link></p>
      </section>

      <MadeBy className="mt-8" method="Each service is checked on JustWatch's country pages and the service's own title page, with AniList links and news as a second source; English dubs from each service's audio list." date={STREAMS_CHECKED} />
      <Faq title="HiAnime alternatives: FAQ" items={faq} />
    </div>
  );
}
