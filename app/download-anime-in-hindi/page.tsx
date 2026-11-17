import type { Metadata } from "next";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import Faq, { type FaqItem } from "@/components/Faq";
import JoinChannels from "@/components/JoinChannels";
import { webPage } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { dubHref, dubDate, dubsOn, hindiDubbed, hindiPlatform, platformKind, type HindiPlatform } from "@/lib/hindidub";
import { PERIOD, PRICES_CHECKED, pricesFor } from "@/lib/platformprices";

export const revalidate = 86400;

/**
 * "anime download in hindi" and its variants are searched about 50K times a month in India (Keyword Planner, Nov
 * 2026), almost all looking for pirate download sites. This page answers it legally: the official apps that let you
 * save Hindi dubbed episodes for offline viewing. Only Crunchyroll's tier detail comes from the checked price data;
 * the other steps are written generally ("look for the download icon") so they stay true as apps change.
 */
const STEPS: { slug: string; offline: string }[] = [
  { slug: "crunchyroll", offline: "Offline downloads come with Mega Fan and higher plans, in the Crunchyroll app on a phone or tablet. Pick Hindi as the audio before you download: the download keeps the language you chose." },
  { slug: "netflix", offline: "In the Netflix app on a phone or tablet, tap the download icon next to an episode. Choose Hindi under Audio & Subtitles first. Downloads expire after a while and some titles can't be downloaded." },
  { slug: "prime-video", offline: "In the Prime Video app, open the title and tap Download. Anime Times titles need that channel's subscription; downloads work inside the app only." },
  { slug: "jiohotstar", offline: "In the JioHotstar app, look for the download icon on the episode; it appears on titles that allow offline viewing." },
  { slug: "youtube", offline: "Muse India and Ani-One India upload Hindi episodes free. Saving them for offline viewing is a YouTube Premium feature, inside the YouTube app." },
];

function rows() {
  return STEPS.flatMap(({ slug, offline }) => {
    const p = hindiPlatform(slug) as HindiPlatform | null;
    if (!p) return [];
    const titles = dubsOn(p);
    const price = pricesFor(slug);
    const mega = slug === "crunchyroll" ? price?.plans.find((x) => /mega fan/i.test(x.name) && x.period === "month") : null;
    const premium = slug === "youtube" ? price?.plans.find((x) => /premium/i.test(x.name)) : null;
    const cost = mega ? `Mega Fan, ₹${mega.price} a ${PERIOD[mega.period]}` : premium ? `YouTube Premium, ₹${premium.price} a ${PERIOD[premium.period]} (watching is free)` : price && !price.free ? `From ₹${Math.min(...price.plans.map((x) => x.price))}` : "Free with ads";
    return titles.length ? [{ p, titles, offline, cost }] : [];
  });
}

export function generateMetadata(): Metadata {
  const r = rows();
  return {
    title: fitTitle([`Download Anime in Hindi Legally (${new Date().getFullYear()}): ${hindiDubbed().length} Hindi Dubs Offline`, `Download Hindi Dubbed Anime Legally (${new Date().getFullYear()})`, "Download Anime in Hindi, Legally"]),
    description: fitDescription(`How to download Hindi dubbed anime legally and watch offline: the official apps that allow downloads (${r.map((x) => x.p.label.replace(/ \(.*\)$/, "")).join(", ")}), which plan you need, and the ${hindiDubbed().length} anime with an official Hindi dub.`),
    alternates: { canonical: "/download-anime-in-hindi" },
  };
}

export default function DownloadAnimeInHindi() {
  const r = rows();
  const dubbed = hindiDubbed();
  const free = dubbed.filter((d) => d.platforms.some((p) => platformKind(p.name) === "free"));
  const cr = r.find((x) => x.p.slug === "crunchyroll");
  const faq: FaqItem[] = [
    { q: "How can I download anime in Hindi legally?", a: `Use an official app's download button: ${r.map((x) => `${x.p.label} (${x.titles.length} Hindi dubs)`).join(", ")}. Downloads play inside the app, offline, for as long as your plan is active.` },
    ...(cr ? [{ q: "Can I download Hindi anime on Crunchyroll?", a: `Yes, on Mega Fan or higher: ${cr.cost}. ${cr.titles.length} anime on Crunchyroll have a Hindi dub. Choose Hindi audio before downloading.` }] : []),
    { q: "Are anime download sites safe?", a: "Sites offering free Hindi anime downloads are unlicensed. Downloading from them is copyright infringement in India, and their fake download buttons and installers are a common source of malware and scam ads on phones." },
    { q: "Can I watch Hindi dubbed anime free without downloading?", a: `Yes: ${free.length} official Hindi dubs stream free with ads on the licensors' YouTube channels and on MX Player (Prime Video's free tier), including ${free.slice(0, 5).map((d) => d.t).join(", ")}.` },
    { q: "Can I save downloaded anime to my gallery or a pen drive?", a: "No. Official downloads are protected files that play only inside the app that downloaded them, and they expire if your plan ends. That's the trade-off for the legal, full-quality Hindi dub." },
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={webPage("WebPage", "/download-anime-in-hindi", "Download anime in Hindi legally")} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/hindi-dub", label: "Hindi dubbed anime" }, { href: "/download-anime-in-hindi", label: "Download in Hindi" }]}
        eyebrow="⬇️ Offline, legally"
        title={<>Download anime <span className="text-gradient">in Hindi</span>, legally</>}
        subtitle="The official apps that let you save Hindi dubbed episodes and watch them offline, which plan you need, and where each anime's Hindi dub is."
        facts={[{ value: String(r.length), label: "official apps" }, { value: String(dubbed.length), label: "anime in Hindi" }, { value: String(free.length), label: "free to stream" }]}
        hue={200}
      />

      <section className="reveal mt-10" aria-labelledby="apps-h">
        <h2 id="apps-h" className="h-section mb-1">Apps that let you download Hindi dubbed anime</h2>
        <p className="mb-4 text-sm text-muted">Downloads play inside each app, offline. Not every title can be downloaded, and downloads expire, so check the download icon on the episode.</p>
        <ol className="grid gap-3 md:grid-cols-2">
          {r.map(({ p, titles, offline, cost }, i) => (
            <li key={p.slug} className="card p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-semibold text-ink"><span className="mr-1.5 text-muted">{i + 1}.</span><Link href={`/hindi-dub/${p.slug}`} className="hover:text-violet-2">{p.label}</Link></h3>
                <span className="shrink-0 text-xs text-muted">{titles.length} Hindi dubs</span>
              </div>
              <p className="mt-1 text-xs font-medium text-ink/80">{cost}</p>
              <p className="mt-2 text-sm leading-6 text-ink/90">{offline}</p>
              <p className="mt-2 flex flex-wrap gap-1.5 text-xs">{titles.slice(0, 5).map((x) => <Link key={x.d.s} href={dubHref(x.d)} className="chip text-xs">{x.d.t}</Link>)}</p>
            </li>
          ))}
        </ol>
        <p className="mt-3 text-xs text-muted">Hindi dubs checked {dubDate()}; prices checked {new Date(`${PRICES_CHECKED}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })}. <Link href="/how-we-check" className="underline">How we check</Link></p>
      </section>

      <section className="reveal mt-10" aria-labelledby="why-h">
        <h2 id="why-h" className="h-section mb-3">Why not a free download site?</h2>
        <div className="card max-w-3xl space-y-2 p-4 text-sm leading-6 text-ink/85">
          <p>Sites offering free Hindi anime downloads don&rsquo;t license the shows. Their fake download buttons, installers and redirect ads are a common way phones pick up malware.</p>
          <p>If cost is the reason, {free.length} official Hindi dubs stream free, legally: <Link href="/hindi-dub" className="text-violet hover:underline">see which ones</Link>. Searching for a site by name? See the <Link href="/anime-salt-alternatives" className="text-violet hover:underline">legal alternatives to Anime Salt and Anime World</Link>.</p>
        </div>
        <JoinChannels source="download-hindi" className="mt-5" />
      </section>

      <p className="mt-8 flex flex-wrap gap-2 text-sm">
        <Link href="/anime-streaming-sites" className="chip">Streaming sites in India</Link>
        <Link href="/crunchyroll-price-india" className="chip">Crunchyroll price in India</Link>
        <Link href="/hindi-dub/this-week" className="chip">This week&rsquo;s Hindi episodes</Link>
      </p>

      <Faq title="Downloading anime in Hindi: FAQ" items={faq} />
    </div>
  );
}
