import type { Metadata } from "next";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import Faq, { type FaqItem } from "@/components/Faq";
import JoinChannels from "@/components/JoinChannels";
import { itemList } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { STREAMS_CHECKED, allStreams, audioLine, catalogue, servicesIn, streamsDate, streamsPath, type Service, type Streams } from "@/lib/streams";
import { pricesFor } from "@/lib/platformprices";
import { dubsOn, hindiPlatform } from "@/lib/hindidub";

export const revalidate = 86400;

/**
 * Anime on Netflix in India (Google India, Nov 2026: "anime on netflix india" 170 a month), from the where-to-watch
 * research (data/where-to-watch.json): the most-followed franchises, each checked on Netflix's own title page.
 */
const isNetflix = (x: Service) => /^netflix/i.test(x.service) && x.kind !== "buy";
function load() {
  const rows = allStreams().flatMap((e) => { const x = servicesIn(e, "IN").find(isNetflix); return x ? [{ e, x }] : []; });
  const hindi = rows.filter((r) => r.x.audio.includes("hi"));
  const regional = rows.filter((r) => r.x.audio.some((a) => a === "ta" || a === "te"));
  const tracked = allStreams().length;
  const rank = catalogue("IN").findIndex((c) => /^netflix/i.test(c.service)) + 1;
  // The Hindi count comes from the Hindi dub list, which also has Netflix's films and smaller shows, so it matches
  // /hindi-dub/netflix; the rows above are only the most-followed franchises.
  const nf = hindiPlatform("netflix");
  const hindiAll = nf ? dubsOn(nf).length : hindi.length;
  return { rows, hindi, hindiAll, regional, tracked, rank };
}
const mon = () => new Date(`${STREAMS_CHECKED}T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });

export function generateMetadata(): Metadata {
  const { rows, hindiAll } = load();
  return {
    title: fitTitle([`Anime on Netflix India (${mon()}): ${rows.length} Popular Anime, ${hindiAll} in Hindi`, `Anime on Netflix India: ${rows.length} Popular Anime, ${hindiAll} in Hindi`, "Anime on Netflix India"]),
    description: fitDescription(`${rows.length} of the most popular anime stream on Netflix in India, and ${hindiAll} anime have a Hindi dub there: ${rows.slice(0, 5).map((r) => r.e.t).join(", ")} and more, with the seasons Netflix has. Checked ${streamsDate()}.`),
    alternates: { canonical: "/anime-on-netflix-india" },
  };
}

function Row({ e, x }: { e: Streams; x: Service }) {
  return (
    <li className="flex items-baseline justify-between gap-3 border-b border-line/50 py-2 text-sm">
      <span className="min-w-0">
        <Link href={streamsPath(e.s)} className="font-medium text-ink hover:text-violet-2">{e.t}</Link>
        {x.scope && <span className="block text-xs text-muted">{x.scope}</span>}
      </span>
      <span className="shrink-0 text-right text-xs text-muted">
        {audioLine(x)}
        {x.audio.includes("hi") && <span className="ml-1 rounded-full bg-amber-400/15 px-1.5 text-[10px] font-semibold text-amber-200">HINDI</span>}
      </span>
    </li>
  );
}

export default function AnimeOnNetflixIndia() {
  const { rows, hindi, hindiAll, regional, tracked, rank } = load();
  const price = pricesFor("netflix");
  const cheapest = price?.plans.filter((p) => p.period === "month").sort((a, b) => a.price - b.price)[0];
  const faq: FaqItem[] = [
    { q: "How many anime are on Netflix India?", a: `Of the ${tracked} most-followed anime we track, ${rows.length} stream on Netflix in India, the ${rank === 1 ? "most" : rank === 2 ? "second most" : `number ${rank}`} of any service here. Netflix also carries smaller titles not on this list.` },
    ...(hindiAll ? [{ q: "Which anime on Netflix India are in Hindi?", a: `${hindiAll} on our checked Hindi dub list${hindi.length ? `, including ${hindi.slice(0, 8).map((r) => r.e.t).join(", ")}` : ""}. Choose Hindi under Audio & Subtitles.` }] : []),
    ...(regional.length ? [{ q: "Does Netflix India have anime in Tamil or Telugu?", a: `Yes: ${regional.slice(0, 6).map((r) => r.e.t).join(", ")}${regional.length > 6 ? " and more" : ""} have Tamil or Telugu audio.` }] : []),
    ...(cheapest ? [{ q: "How much does Netflix cost in India?", a: `From ₹${cheapest.price} a month (${cheapest.name}). Every plan includes the anime on this page; the cheapest is for one phone or tablet.` }] : []),
    { q: "Is Netflix or Crunchyroll better for anime in India?", a: "Crunchyroll has more anime and more Hindi dubs, and new episodes the same week they air in Japan. Netflix has fewer anime but its own exclusives and many dubs. See the Crunchyroll price page for a side-by-side." },
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={itemList("Anime on Netflix India", rows.map((r) => ({ url: streamsPath(r.e.s), name: r.e.t })))} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/where-to-watch", label: "Where to watch" }, { href: "/anime-on-netflix-india", label: "Netflix India" }]}
        eyebrow="🇮🇳 Netflix India"
        title={<>Anime on <span className="text-gradient">Netflix India</span></>}
        subtitle={`The popular anime you can stream on Netflix in India, with which seasons it has and the audio: Japanese, English, Hindi, Tamil or Telugu.`}
        facts={[{ value: String(rows.length), label: "popular anime" }, { value: String(hindiAll), label: "in Hindi" }, ...(cheapest ? [{ value: `₹${cheapest.price}`, label: "a month, cheapest" }] : [])]}
        hue={0}
      />

      {hindi.length > 0 && (
        <section className="reveal mt-10" aria-labelledby="hi-h">
          <h2 id="hi-h" className="h-section mb-1">🇮🇳 Popular anime on Netflix India in Hindi</h2>
          <p className="mb-3 text-sm text-muted">The most-followed ones; choose Hindi under Audio &amp; Subtitles. <Link href="/hindi-dub/netflix" className="text-violet hover:underline">All {hindiAll} Hindi dubbed anime on Netflix →</Link></p>
          <ul>{hindi.map((r) => <Row key={r.e.s} {...r} />)}</ul>
        </section>
      )}

      <section className="reveal mt-10" aria-labelledby="all-h">
        <h2 id="all-h" className="h-section mb-1">All {rows.length} popular anime on Netflix India</h2>
        <p className="mb-3 text-sm text-muted">Most-followed first, from the {tracked} anime we track. Checked {streamsDate()} on Netflix&rsquo;s own pages; catalogues change monthly.</p>
        <ul>{rows.map((r) => <Row key={r.e.s} {...r} />)}</ul>
      </section>

      <p className="mt-8 flex flex-wrap gap-2 text-sm">
        <Link href="/where-to-watch" className="chip">Where to watch every anime</Link>
        <Link href="/crunchyroll-price-india" className="chip">Crunchyroll price in India</Link>
        <Link href="/anime-streaming-sites" className="chip">Every streaming site in India</Link>
      </p>

      <JoinChannels source="netflix-india" lang="Indian" className="mt-8" />
      <Faq title="Anime on Netflix India: FAQ" items={faq} />
    </div>
  );
}
