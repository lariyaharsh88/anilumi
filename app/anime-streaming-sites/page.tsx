import type { Metadata } from "next";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import Faq, { type FaqItem } from "@/components/Faq";
import JoinChannels from "@/components/JoinChannels";
import AnswerLead from "@/components/AnswerLead";
import { webPage } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { allStreams, catalogue, streamsDate, streamsPath, type Streams } from "@/lib/streams";
import { HINDI_PLATFORMS, dubDate, dubHref, hindiDubbed, platformKind, type Dub } from "@/lib/hindidub";
import { dubbedIn, LANG, regionalDate, type RegionalDub } from "@/lib/regionaldub";
import { PERIOD, PRICES_CHECKED, cheapestPlan, pricesFor, startingAt } from "@/lib/platformprices";

export const revalidate = 86400;

/**
 * The legal ways to watch anime in India, grouped the way people think of them (Sony LIV's Crunchyroll channel is a
 * Sony LIV subscription; Anime Times and Animax are Prime Video channels). First match wins, so order matters.
 * Apple TV is left out: its Hindi listings mostly stream through Prime Video (data/hindi-dubs.json scopes).
 * `price` keys data/hindi-platform-prices.json; `hindi` is the /hindi-dub/<slug> platform page.
 */
const SITES = [
  { key: "sonyliv", name: "Sony LIV", match: /sony ?liv/i, free: false },
  { key: "crunchyroll", name: "Crunchyroll", match: /^crunchyroll/i, price: "crunchyroll", hindi: "crunchyroll", free: false },
  { key: "netflix", name: "Netflix", match: /^netflix/i, price: "netflix", hindi: "netflix", free: false },
  { key: "mx", name: "MX Player (free on Prime Video)", match: /mx player/i, price: "mx-player", hindi: "mx-player", free: true },
  { key: "prime", name: "Prime Video (Anime Times, Animax)", match: /prime video|anime times|animax/i, price: "prime-video", hindi: "prime-video", free: false },
  { key: "jiohotstar", name: "JioHotstar", match: /hotstar/i, price: "jiohotstar", hindi: "jiohotstar", free: false },
  { key: "youtube", name: "YouTube (Muse India, Ani-One)", match: /youtube/i, price: "youtube", hindi: "youtube", free: true },
  { key: "zee5", name: "ZEE5", match: /zee5/i, free: false },
] as const;
type Site = (typeof SITES)[number];
const siteOf = (service: string): Site | null => SITES.find((s) => s.match.test(service)) ?? null;

type Row = { site: Site; streams: Streams[]; hindi: Dub[]; ta: RegionalDub[]; te: RegionalDub[]; price: string | null; perMonth: number | null; plan: string | null };

function rows(): Row[] {
  const cat = catalogue("IN");
  const ta = dubbedIn("ta"), te = dubbedIn("te");
  const on = (s: Site, names: string[]) => names.some((n) => siteOf(n) === s);
  return SITES.map((site) => {
    const p = "price" in site ? pricesFor(site.price) : null;
    const plan = p && !p.free ? cheapestPlan(p) : null;
    return {
      site,
      streams: [...new Set(cat.filter((c) => siteOf(c.service) === site).flatMap((c) => c.titles))],
      hindi: hindiDubbed().filter((d) => on(site, d.platforms.map((x) => x.name))),
      ta: ta.filter((d) => on(site, d.platforms.map((x) => x.name))),
      te: te.filter((d) => on(site, d.platforms.map((x) => x.name))),
      price: p ? (p.free ? "Free with ads" : startingAt(p)) : null,
      perMonth: plan ? Math.round(plan.price / (plan.period === "year" ? 12 : plan.period === "quarter" ? 3 : 1)) : null,
      plan: plan ? `${plan.name}, ₹${plan.price.toLocaleString("en-IN")} a ${PERIOD[plan.period]}` : null,
    };
  }).filter((r) => r.streams.length || r.hindi.length).sort((a, b) => b.streams.length + b.hindi.length - (a.streams.length + a.hindi.length));
}

const y = new Date().getFullYear();
const fmtDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export function generateMetadata(): Metadata {
  const r = rows();
  return {
    // Bing, Nov 2026: "where to watch anime online legally" 79 + "how to watch anime online" 68 + "anime streaming
    // legality" 22 impressions at positions 5-7, no clicks; the India sites stay in the description.
    title: fitTitle([`Where to Watch Anime Online Legally: Top Sites in India (${y})`, `Best Anime Streaming Sites in India (${y}): Free & Legal, with Hindi Dubs`, `Best Anime Streaming Sites in India (${y}): Free & Legal`, `Legal Anime Streaming Sites in India (${y})`]),
    description: fitDescription(`The ${r.length} legal anime streaming sites in India compared: how many popular anime each has, Hindi, Tamil and Telugu dubs, prices in rupees and the free options (${r.filter((x) => x.site.free).map((x) => x.site.name.replace(/ \(.*\)$/, "")).join(", ")}). Checked ${streamsDate()}.`),
    alternates: { canonical: "/anime-streaming-sites" },
  };
}

/** Every legal anime streaming site in India, compared on catalogue, Indian-language dubs and price. */
export default function AnimeStreamingSites() {
  const list = rows();
  const total = allStreams().length;
  const hindiTotal = hindiDubbed().length;
  const most = list[0];
  const mostHindi = [...list].sort((a, b) => b.hindi.length - a.hindi.length)[0];
  const free = list.filter((r) => r.site.free);
  const cheapest = list.filter((r) => r.perMonth !== null).sort((a, b) => a.perMonth! - b.perMonth!)[0];
  const tamil = [...list].sort((a, b) => b.ta.length - a.ta.length)[0];
  const freeHindi = hindiDubbed().filter((d) => d.platforms.some((p) => platformKind(p.name) === "free"));
  const name = (r: Row) => r.site.name.replace(/ \(.*\)$/, "");

  const faq: FaqItem[] = [
    { q: "What is the best anime streaming site in India?", a: `For the biggest catalogue, ${name(most)}: it carries ${most.streams.length} of the ${total} most-followed anime we track in India${most.price ? ` (${most.price.toLowerCase()})` : ""}. For Hindi dubs, ${name(mostHindi)} has the most (${mostHindi.hindi.length} of ${hindiTotal}).` },
    // Bing: "how to watch anime online", "where to watch anime online legally" and "anime streaming legality".
    { q: "How can I watch anime online legally?", a: `Pick a licensed site from the table: ${name(most)} has the most anime, ${free.map(name).join(" and ")} are free with ads. To find one show, open its page on AniLumi: it lists every legal place it streams in India, the US and the UK, with sub, English dub and Hindi dub.` },
    { q: "Which anime sites are free and legal in India?", a: `${free.map((r) => `${r.site.name}: ${r.streams.length} popular anime and ${r.hindi.length} Hindi dubs`).join("; ")}. All are free with ads and carry official uploads from the licensors.` },
    { q: "Where can I watch anime in Hindi?", a: `${hindiTotal} anime have an official Hindi dub. Most are on ${list.filter((r) => r.hindi.length).sort((a, b) => b.hindi.length - a.hindi.length).slice(0, 3).map((r) => `${name(r)} (${r.hindi.length})`).join(", ")}; ${freeHindi.length} of them are free on YouTube or MX Player.` },
    ...(cheapest ? [{ q: "What is the cheapest way to watch anime in India?", a: `Free: YouTube channels like Muse India and Ani-One, and MX Player on Prime Video. The cheapest paid plan we found is ${name(cheapest)}'s ${cheapest.plan} (about ₹${cheapest.perMonth} a month). Prices checked ${fmtDate(PRICES_CHECKED)}.` }] : []),
    { q: "Which sites have anime in Tamil and Telugu?", a: `${name(tamil)} has the most: ${tamil.ta.length} anime in ${LANG.ta.name} and ${tamil.te.length} in ${LANG.te.name}. ${list.filter((r) => r !== tamil && r.ta.length).map((r) => `${name(r)} has ${r.ta.length}`).join(", ")}.` },
    // Bing keyword research (21 Nov 2026): "hianime" 675K impressions a year, "hi anime" 141K, "hianime site" 6K.
    { q: "Is HiAnime legal, and what are the legal alternatives?", a: `No: HiAnime streams anime without a licence, and AniLumi doesn't link to it. The legal alternatives in India are ${name(most)} for the biggest catalogue and ${free.map(name).join(" and ")} for free anime with ads; each show's page on AniLumi lists every legal place it streams.` },
    // "sub dub anime" 3.2K Bing impressions in 3 months and climbing since August, plus "subdub anime" 1.5K and "sub dub
    // anime site/website" ~1K (Bing keyword research, Nov 2026): people looking for a site called SubDub Anime. Named
    // without a verdict, since we haven't reviewed it; the answer is where both versions stream legally.
    { q: "Is there a legal site like SubDub Anime, with both sub and dub?", a: `AniLumi doesn't review or link to unofficial streaming sites. For anime with both subtitles and dubs, legally: ${name(most)} streams most shows subtitled and many with an English dub, Netflix lets you switch the audio and subtitle language on most of its anime, and ${free.map(name).join(" and ")} are free with ads. Each show's page on AniLumi says whether it has an English or Hindi dub and where each version streams.` },
    { q: "Is anime streaming legal in India?", a: `Yes, on licensed services such as ${list.slice(0, 4).map(name).join(", ")} and the licensors' YouTube channels. Unlicensed sites infringe the Copyright Act, 1957, and Indian courts regularly order internet providers to block them.` },
    { q: "Is it legal to watch anime on free anime websites?", a: "Only on the licensed ones listed here. Sites that offer every new anime free, without ads from the licensor, are unlicensed uploads: they pay nothing to the studios, and their pop-up ads and fake download buttons are a common way to get malware." },
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={webPage("CollectionPage", "/anime-streaming-sites", "Anime streaming sites in India")} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/where-to-watch", label: "Where to watch" }, { href: "/anime-streaming-sites", label: "Streaming sites in India" }]}
        eyebrow="🇮🇳 Legal anime in India"
        title={<>The best <span className="text-gradient">anime streaming sites</span> in India</>}
        subtitle={`Every legal site, compared on what matters here: how many popular anime it has, which are in Hindi, Tamil and Telugu, what it costs in rupees, and which are free.`}
        facts={[
          { value: String(list.length), label: "legal sites" },
          { value: String(free.length), label: "free with ads" },
          { value: String(hindiTotal), label: "anime in Hindi" },
        ]}
        hue={150}
      />

      <AnswerLead checked={streamsDate()}>
        The best legal anime streaming site in India is {name(most)}: {most.streams.length} of the {total} most-followed anime and {mostHindi === most ? `${most.hindi.length} of the ${hindiTotal} Hindi dubs` : `${most.hindi.length} Hindi dubs`}{most.price ? `, ${most.price.toLowerCase()}` : ""}. {free.map(name).join(" and ")} are free and legal, with {freeHindi.length} anime in Hindi.
      </AnswerLead>

      <section className="reveal mt-10" aria-labelledby="quick-h">
        <h2 id="quick-h" className="h-section mb-3">Quick answer</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          <li className="card p-4 text-sm"><p className="font-semibold text-ink">🏆 Biggest catalogue: {name(most)}</p><p className="mt-1 text-ink/85">{most.streams.length} of the {total} most-followed anime we track. {most.price}.</p></li>
          <li className="card p-4 text-sm"><p className="font-semibold text-ink">🇮🇳 Most Hindi dubs: {name(mostHindi)}</p><p className="mt-1 text-ink/85">{mostHindi.hindi.length} of {hindiTotal} official Hindi dubs. <Link href="/hindi-dub" className="text-violet hover:underline">All Hindi dubs →</Link></p></li>
          <li className="card p-4 text-sm"><p className="font-semibold text-ink">🆓 Free and legal: {free.map(name).join(", ")}</p><p className="mt-1 text-ink/85">Official uploads with ads, including {freeHindi.length} anime in Hindi.</p></li>
          {cheapest && <li className="card p-4 text-sm"><p className="font-semibold text-ink">💸 Cheapest paid plan: {name(cheapest)}</p><p className="mt-1 text-ink/85">{cheapest.plan}, about ₹{cheapest.perMonth} a month.</p></li>}
        </ul>
      </section>

      <section className="reveal mt-10" aria-labelledby="table-h">
        <h2 id="table-h" className="h-section mb-1">All sites compared</h2>
        <p className="mb-4 text-sm text-muted">&ldquo;Popular anime&rdquo; counts how many of the {total} most-followed anime we track stream on the site in India.</p>
        <div className="-mx-4 overflow-x-auto px-4">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-xs uppercase tracking-wide text-muted">
              <tr className="border-b border-line"><th className="py-2 pr-3 font-semibold">Site</th><th className="py-2 pr-3 font-semibold">Price</th><th className="py-2 pr-3 text-right font-semibold">Popular anime</th><th className="py-2 pr-3 text-right font-semibold">Hindi</th><th className="py-2 pr-3 text-right font-semibold">Tamil</th><th className="py-2 text-right font-semibold">Telugu</th></tr>
            </thead>
            <tbody>
              {list.map((r) => (
                <tr key={r.site.key} className="border-b border-line/50">
                  <td className="py-2.5 pr-3 font-medium text-ink"><a href={`#${r.site.key}`} className="hover:text-violet-2">{r.site.name}</a></td>
                  <td className="py-2.5 pr-3 text-ink/85">{r.site.free ? <span className="rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">Free</span> : r.price ?? "See the site"}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{r.streams.length}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{r.hindi.length}</td>
                  <td className="py-2.5 pr-3 text-right tabular-nums">{r.ta.length}</td>
                  <td className="py-2.5 text-right tabular-nums">{r.te.length}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="reveal mt-10 space-y-4" aria-labelledby="sites-h">
        <h2 id="sites-h" className="h-section">Each site in detail</h2>
        {list.map((r) => {
          const site = r.site;
          const how = "hindi" in site ? HINDI_PLATFORMS.find((p) => p.slug === site.hindi) : null;
          return (
            <article key={r.site.key} id={r.site.key} className="card scroll-mt-32 p-4 sm:p-5">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="text-lg font-bold text-ink">{r.site.name}</h3>
                <span className="text-sm text-muted">{r.site.free ? "Free with ads" : r.price ?? "Subscription"}</span>
              </div>
              <p className="mt-2 text-sm text-ink/85">
                {r.streams.length} of the {total} most-followed anime in India
                {r.hindi.length ? `, ${r.hindi.length} with an official Hindi dub` : ""}
                {r.ta.length ? `, ${r.ta.length} in Tamil and ${r.te.length} in Telugu` : ""}.
                {r.plan && !r.site.free ? ` Cheapest plan: ${r.plan}.` : ""}
              </p>
              {how && <p className="mt-2 text-xs leading-5 text-muted"><span className="font-medium text-ink/80">Hindi audio:</span> {how.how}</p>}
              {r.streams.length > 0 && (
                <p className="mt-3 flex flex-wrap gap-1.5 text-xs">
                  <span className="py-1 text-muted">Popular here:</span>
                  {r.streams.slice(0, 8).map((e) => <Link key={e.s} href={streamsPath(e.s)} className="chip text-xs">{e.t}</Link>)}
                </p>
              )}
              {r.hindi.length > 0 && (
                <p className="mt-2 flex flex-wrap gap-1.5 text-xs">
                  <span className="py-1 text-muted">In Hindi:</span>
                  {r.hindi.slice(0, 8).map((d) => <Link key={d.s} href={dubHref(d)} className="chip text-xs">{d.t}</Link>)}
                  {how && <Link href={`/hindi-dub/${how.slug}`} className="py-1 font-medium text-violet hover:underline">All {r.hindi.length} →</Link>}
                </p>
              )}
            </article>
          );
        })}
      </section>

      {/* Bing, Nov 2026: "anime streaming legality" at position 3.5 and "where to watch anime online legally" at 6.2, no clicks. */}
      <section className="reveal mt-10" aria-labelledby="legal-h">
        <h2 id="legal-h" className="h-section mb-3">Is anime streaming legal in India?</h2>
        <div className="card max-w-3xl space-y-2 p-4 text-sm leading-6 text-ink/85">
          <p><strong className="text-ink">Yes, on licensed services.</strong> Watching anime on {list.map(name).filter((n) => n !== "YouTube").slice(0, 5).join(", ")} or the licensors&rsquo; own YouTube channels is legal: they pay the studios for the right to stream each show in India, which is also why a show can be on one service here and another abroad.</p>
          <p><strong className="text-ink">Unlicensed sites are not.</strong> Sites that copy episodes without a licence infringe the Copyright Act, 1957, and Indian courts regularly order internet providers to block them, including &ldquo;dynamic&rdquo; Delhi High Court orders that also cover their mirror domains. Downloading or sharing episodes from them can infringe too.</p>
          <p><strong className="text-ink">How to tell the difference:</strong> a legal service has a company behind it, a catalogue that changes as licences start and end, and no pop-ups or &ldquo;download&rdquo; buttons. If a site has every anime ever made, free, the day it airs, it isn&rsquo;t licensed.</p>
        </div>
      </section>

      <section className="reveal mt-10" aria-labelledby="free-h">
        <h2 id="free-h" className="h-section mb-3">What about &ldquo;free anime websites&rdquo;?</h2>
        <div className="card max-w-3xl space-y-2 p-4 text-sm leading-6 text-ink/85">
          <p>Sites that put every new episode up for free, the day it airs, are unlicensed. They pay nothing to the studios, and their pop-up ads and fake &ldquo;download&rdquo; buttons are a common source of malware and scams.</p>
          <p>The free options above are the licensors&rsquo; own uploads: {free.map((r) => `${r.site.name} (${r.streams.length} popular anime, ${r.hindi.length} Hindi dubs)`).join(" and ")}. They show ads, and some playlists come down when a licence ends.</p>
          <p><Link href="/hindi-dub" className="text-violet hover:underline">See which {freeHindi.length} anime are free in Hindi →</Link> · <Link href="/anime-salt-alternatives" className="text-violet hover:underline">Legal alternatives to Anime Salt →</Link></p>
        </div>
        <JoinChannels source="streaming-sites" className="mt-5" />
      </section>

      <p className="mt-8 text-xs text-muted">
        Catalogues from our where-to-watch research on the {total} most-followed anime (checked {streamsDate()}), Hindi dubs checked {dubDate()}, Tamil and Telugu dubs checked {regionalDate()}, prices checked {fmtDate(PRICES_CHECKED)}. Catalogues and prices change, so check the site before you subscribe. <Link href="/how-we-check" className="underline">How we check</Link> · <Link href="/where-to-watch" className="underline">Where to watch each anime</Link> · <Link href="/crunchyroll-price-india" className="underline">Crunchyroll price in India</Link> · <Link href="/download-anime-in-hindi" className="underline">Downloading anime in Hindi</Link>
      </p>

      <Faq title="Anime streaming in India: FAQ" items={faq} />
    </div>
  );
}
