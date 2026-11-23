import type { Metadata } from "next";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import Faq, { type FaqItem } from "@/components/Faq";
import JoinChannels from "@/components/JoinChannels";
import AnswerLead from "@/components/AnswerLead";
import MadeBy from "@/components/MadeBy";
import { itemList } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { REGIONS, REGION_FLAG, REGION_NAME, allStreams, catalogue, freeIn, streamsDate, streamsPath, STREAMS_CHECKED, type Region, type Streams } from "@/lib/streams";
import { dubDate, dubHref, hindiDubbed, platformKind } from "@/lib/hindidub";
import { PERIOD, PRICES_CHECKED, cheapestPlan, pricesFor } from "@/lib/platformprices";

export const revalidate = 86400;

/**
 * Free and legal anime, by country, for the biggest "watch anime" searches in India (Keyword Planner, Nov 2026,
 * monthly): "free anime websites" 90.5K, "watch anime online" 90.5K, "anime sites" 40.5K, "watch anime free online"
 * 27K, "watch anime free" 22K, "best app to watch anime for free" 5.4K. One page for websites and apps: a separate
 * apps page would list the same free sources. Everything here comes from the where-to-watch research (lib/streams),
 * the Hindi dub list and the platform price data.
 */
const y = new Date().getFullYear();
const fmt = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
const list = (xs: string[]) => (xs.length > 1 ? `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}` : xs[0] ?? "");
// "MX Player (now free on Prime Video)" reads better as the service people open.
const short = (service: string) => service.replace(/ \(now free on Prime Video\)$/, " (Prime Video's free tier)");

function data() {
  const all = allStreams();
  const regions = REGIONS.map((r) => {
    const services = catalogue(r).filter((c) => c.kind === "free");
    const shows = all.filter((e) => freeIn(e, r).length);
    const dubbed = shows.filter((e) => freeIn(e, r).some((x) => x.audio.some((a) => a !== "ja")));
    return { r, services, shows, dubbed };
  }).sort((a, b) => b.shows.length - a.shows.length);
  const freeHindi = hindiDubbed().filter((d) => d.platforms.some((p) => platformKind(p.name) === "free"));
  const cr = pricesFor("crunchyroll"), yt = pricesFor("youtube"), mx = pricesFor("mx-player");
  const crPlan = cr ? cheapestPlan(cr) : null;
  const ytPlan = yt?.plans.find((p) => /premium/i.test(p.name) && p.period === "month") ?? null;
  return { all, regions, freeHindi, crPlan, ytPlan, mx, byR: Object.fromEntries(regions.map((x) => [x.r, x])) as Record<Region, (typeof regions)[number]> };
}

export function generateMetadata(): Metadata {
  const { all, byR, freeHindi } = data();
  const india = byR.IN;
  return {
    title: fitTitle([`Free Anime Websites & Apps (${y}): Watch Anime Free and Legally`, `Free Anime Websites (${y}): Where to Watch Anime Free, Legally`, `Free Anime Websites & Apps (${y})`]),
    description: fitDescription(`${india.shows.length} of the ${all.length} most-followed anime stream free and legally in India, ${freeHindi.length} of them in Hindi: on Prime Video's free tier (formerly MX Player) and the licensors' YouTube channels. Plus the free options in the US and UK. Checked ${streamsDate()}.`),
    alternates: { canonical: "/free-anime-websites" },
  };
}

function ShowChips({ shows, r }: { shows: Streams[]; r: Region }) {
  return (
    <ul className="mt-2 flex flex-wrap gap-1.5 text-xs">
      {shows.map((e) => (
        <li key={e.s}><Link href={streamsPath(e.s)} className="chip text-xs">{e.t}<span className="text-muted"> · {list([...new Set(freeIn(e, r).map((x) => short(x.service).replace(/ \(YouTube\)$/, "")))])}</span></Link></li>
      ))}
    </ul>
  );
}

/** Every free, legal way to watch anime, by country, with the apps and the free Hindi dubs. */
export default function FreeAnimeWebsites() {
  const { all, regions, byR, freeHindi, crPlan, ytPlan, mx } = data();
  const india = byR.IN, us = byR.US, uk = byR.GB;
  const top = (r: Region) => byR[r].services[0];
  const youtube = india.services.filter((s) => /youtube/i.test(s.service));
  const ytCount = new Set(youtube.flatMap((s) => s.titles.map((t) => t.s))).size;
  const mxHindi = freeHindi.filter((d) => d.platforms.some((p) => /mx player|prime video.*free/i.test(p.name))).length;
  const usApps = us.services.slice(0, 2);

  const faq: FaqItem[] = [
    { q: "What is the best free anime website?", a: `In India, ${short(top("IN").service)}: ${top("IN").titles.length} of the ${all.length} most-followed anime stream there free with ads, and the licensors' YouTube channels (${list(youtube.map((s) => s.service.replace(/ \(YouTube\)$/, "")))}) add ${ytCount} more. In the US, ${list(us.services.slice(0, 2).map((s) => s.service))}; in the UK, ${uk.services[0]?.service ?? "very little is free"}.` },
    { q: "Which app is best to watch anime for free?", a: `In India, the Prime Video app's free section (formerly MX Player): no Prime membership needed, ${top("IN").titles.length} popular anime${mxHindi ? ` and ${mxHindi} of the ${freeHindi.length} free Hindi dubs` : ""}. The YouTube app is next, through the official Muse and Ani-One channels. In the US, the ${list(usApps.map((s) => s.service))} apps.` },
    { q: "Is there a free anime website with no ads?", a: `Not a legal one: free means ad-supported.${ytPlan ? ` On the YouTube channels, YouTube Premium (₹${ytPlan.price} a month in India) removes the ads and lets you save episodes offline.` : ""} Sites that offer every anime free and ad-free aren't licensed.` },
    { q: "Is Crunchyroll free in India?", a: `No. Crunchyroll's free ad-supported tier in India ended on 31 December 2025, so a paid plan is needed${crPlan ? `: the cheapest is ${crPlan.name} at ₹${crPlan.price} a ${PERIOD[crPlan.period]}` : ""}. See the Crunchyroll price in India for every plan.` },
    { q: "Where can I watch anime in Hindi for free?", a: `${freeHindi.length} anime have an official Hindi dub you can watch free, on Prime Video's free tier and the Muse India, Ani-One India and Muse Hindi Dub YouTube channels: ${list(freeHindi.slice(0, 6).map((d) => d.t))} and more.` },
    { q: "Are HiAnime, Aniwatch or Anime Salt free anime websites?", a: "They're free because they aren't licensed: they stream anime without paying the studios, run on pop-up and redirect ads, and AniLumi doesn't link to them. Everything on this page is the licensors' own free option." },
    { q: "Can I download anime for free?", a: "Legally, only inside the apps: YouTube Premium saves the free YouTube episodes, and paid apps like Netflix, Prime Video and Crunchyroll (Mega Fan and up) allow offline viewing. Download sites that give you the video file aren't licensed." },
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={itemList("Free, legal anime streaming services", regions.flatMap((g) => g.services.map((s) => ({ url: `/free-anime-websites#${g.r.toLowerCase()}`, name: `${s.service} (${REGION_NAME[g.r]})` }))))} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/where-to-watch", label: "Where to watch" }, { href: "/free-anime-websites", label: "Free anime websites" }]}
        eyebrow="🆓 Free and legal"
        title={<>Free anime websites <span className="text-gradient">&amp; apps</span></>}
        subtitle="Where to watch anime free without pirate sites: the licensors' own free channels and ad-supported services, country by country, with the free Hindi dubs."
        facts={[
          { value: String(india.shows.length), label: "free in India" },
          { value: String(freeHindi.length), label: "free in Hindi" },
          { value: String(us.shows.length), label: "free in the US" },
          { value: String(uk.shows.length), label: "free in the UK" },
        ]}
        hue={150}
      >
        <p className="flex flex-wrap gap-2 text-sm">
          <Link href="/anime-streaming-sites" className="chip">🇮🇳 Every streaming site compared</Link>
          <Link href="/hindi-dub#free" className="chip">Free Hindi dubs</Link>
          <Link href="/download-anime-in-hindi" className="chip">Download anime legally</Link>
          <Link href="/anime-salt-alternatives" className="chip">Anime Salt alternatives</Link>
        </p>
      </PageHero>

      <AnswerLead checked={streamsDate()}>
        In India, {india.shows.length} of the {all.length} most-followed anime stream free and legally: {top("IN").titles.length} on {short(top("IN").service)} and {ytCount} on the licensors&apos; YouTube channels, and {freeHindi.length} anime are free in Hindi. In the US, {list(us.services.slice(0, 2).map((s) => s.service))} carry {us.shows.length}; in the UK, {uk.shows.length}. Crunchyroll&apos;s free tier in India ended on 31 December 2025.
      </AnswerLead>

      {regions.map((g) => (
        <section key={g.r} id={g.r.toLowerCase()} className="reveal scroll-mt-32 pt-10" aria-labelledby={`${g.r}-h`}>
          <h2 id={`${g.r}-h`} className="h-section mb-1">{REGION_FLAG[g.r]} Free anime in {g.r === "IN" ? "India" : g.r === "US" ? "the US" : "the UK"}: {g.shows.length} of the {all.length} most-followed</h2>
          <p className="mb-4 max-w-3xl text-sm text-muted">{g.services.length ? `${g.services.length} free, licensed services${g.dubbed.length ? `; ${g.dubbed.length} of these shows have a dub there` : ""}. Free means ad-supported, and some playlists come down when a licence ends.` : "Nothing popular is free right now."}</p>
          <ul className="grid gap-3 md:grid-cols-2">
            {g.services.map((s) => (
              <li key={s.service} className="card p-4">
                <div className="flex items-baseline justify-between gap-3">
                  <h3 className="font-semibold text-ink">{short(s.service)}</h3>
                  <span className="shrink-0 text-xs font-semibold text-emerald-300">{s.titles.length} {s.titles.length === 1 ? "show" : "shows"}</span>
                </div>
                <ShowChips shows={s.titles.slice(0, 8)} r={g.r} />
                {s.titles.length > 8 && <p className="mt-2 text-xs text-muted">+{s.titles.length - 8} more</p>}
              </li>
            ))}
          </ul>
        </section>
      ))}

      <section id="apps" className="reveal scroll-mt-32 pt-10" aria-labelledby="apps-h">
        <h2 id="apps-h" className="h-section mb-3">Best free apps to watch anime</h2>
        <ol className="grid gap-3 md:grid-cols-2">
          <li className="card p-4 text-sm leading-6 text-ink/90"><strong className="block text-ink">1. Prime Video (free tier, formerly MX Player) · India</strong>{top("IN").titles.length} popular anime{mxHindi ? ` and ${mxHindi} Hindi dubs` : ""} free with ads, no Prime membership. {mx?.hindiNote ? "The Android MX Player app still works; on iPhone, TV and the web it opens in Prime Video." : ""}</li>
          <li className="card p-4 text-sm leading-6 text-ink/90"><strong className="block text-ink">2. YouTube · India and Asia</strong>The licensors&apos; channels ({list(youtube.map((s) => s.service.replace(/ \(YouTube\)$/, "")))}) upload whole seasons, Hindi dubs included. {ytPlan ? `YouTube Premium (₹${ytPlan.price} a month) removes ads and adds offline viewing.` : ""}</li>
          <li className="card p-4 text-sm leading-6 text-ink/90"><strong className="block text-ink">3. {list(usApps.map((s) => s.service))} · US</strong>{list(usApps.map((s) => `${s.service}: ${s.titles.length}`))} popular anime free with ads, each in its own app for phones and TVs.</li>
          <li className="card p-4 text-sm leading-6 text-ink/90"><strong className="block text-ink">4. Paid, for everything else</strong>Crunchyroll has the biggest catalogue{crPlan ? ` (from ₹${crPlan.price} a ${PERIOD[crPlan.period]} in India)` : ""}. Compare every app&apos;s price and Hindi dubs on <Link href="/anime-streaming-sites" className="text-violet hover:underline">anime streaming sites in India</Link>.</li>
        </ol>
      </section>

      {freeHindi.length > 0 && (
        <section id="hindi" className="reveal scroll-mt-32 pt-10" aria-labelledby="hindi-h">
          <h2 id="hindi-h" className="h-section mb-1">🇮🇳 {freeHindi.length} anime free in Hindi</h2>
          <p className="mb-3 max-w-3xl text-sm text-muted">Official Hindi dubs at no cost, each checked on the platform. Checked {dubDate()}.</p>
          <ul className="flex flex-wrap gap-1.5 text-xs">{freeHindi.map((d) => <li key={d.s}><Link href={dubHref(d)} className="chip text-xs">{d.t}</Link></li>)}</ul>
        </section>
      )}

      <section className="reveal pt-10" aria-labelledby="pirate-h">
        <h2 id="pirate-h" className="h-section mb-3">What about HiAnime, GogoAnime, KissAnime and the other &ldquo;free anime sites&rdquo;?</h2>
        <div className="card max-w-3xl space-y-2 p-4 text-sm leading-6 text-ink/85">
          <p>Sites that put every anime up free, the day it airs, aren&apos;t licensed: they pay nothing to the studios, and their pop-ups and fake download buttons are a common way to get malware on a phone. AniLumi doesn&apos;t link to them.</p>
          <p>Everything above is the licensors&apos; own free option. <Link href="/anime-streaming-sites#legal-h" className="text-violet hover:underline">Is anime streaming legal in India? →</Link> · <Link href="/hianime-alternatives" className="text-violet hover:underline">HiAnime, GogoAnime &amp; KissAnime alternatives →</Link> · <Link href="/anime-salt-alternatives" className="text-violet hover:underline">Legal alternatives to Anime Salt and Anime World →</Link></p>
        </div>
        <JoinChannels source="free-anime-websites" className="mt-5" />
      </section>

      <MadeBy className="mt-8" method="Free services come from our where-to-watch research on the most-followed anime (each service's own title page and JustWatch, by country); Hindi dubs from the platform's audio list; prices from each platform's India plans page." date={STREAMS_CHECKED} />
      <p className="mt-2 text-xs text-muted">Prices checked {fmt(PRICES_CHECKED)}. Free catalogues change every month, so check the service before you settle in.</p>

      <Faq title="Free anime websites: FAQ" items={faq} />
    </div>
  );
}
