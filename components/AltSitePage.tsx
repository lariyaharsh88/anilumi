import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/components/Link";
import MadeBy from "@/components/MadeBy";
import PageHero from "@/components/PageHero";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import SectionNav from "@/components/fx/SectionNav";
import { animeBySlugs, posterUrl } from "@/lib/kitsu";
import { itemList } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { DUB_CHECKED, HINDI_PLATFORMS, dubDate, dubHref, dubsOn, hindiDubbed, platformKind } from "@/lib/hindidub";
import { pricesFor, startingAt } from "@/lib/platformprices";


/**
 * People search unlicensed Hindi anime sites by name ("anime salt hindi", "anime world hindi", "animetoonhindi").
 * These pages never link to them: they answer the intent (Hindi dubbed anime, ideally free) with the official
 * platforms, cheapest first, from the same checked data as /hindi-dub. One template, one page per name
 * (ALT_SITES).
 */
export type AltSite = { slug: string; brand: string; /** How people search it, shown in the title. */ search: string };
/**
 * One page answers every name: separate near-identical pages per site would be doorway pages. Anime Salt leads (Bing:
 * "anime salt hindi", 6.3K a month); the others are named in the title and their own section. Google India, Nov 2026:
 * "anime world hindi" 49.5K + "anime world in hindi" 3.6K; "anime toon hindi" 1.6K + "animetoonhindi" 1K a month.
 */
export const ALT_SITES: Record<string, AltSite> = {
  "anime-salt": { slug: "anime-salt", brand: "Anime Salt", search: "Anime Salt Hindi" },
};
/** Other unlicensed names people search, covered by the same page (/anime-world-alternatives etc. redirect here). */
export const ALSO_SEARCHED = ["Anime World", "AnimeToon"];
export const altPath = (s: AltSite) => `/${s.slug}-alternatives`;
function data() {
  const dubbed = hindiDubbed();
  const platforms = HINDI_PLATFORMS.map((p) => {
    const titles = dubsOn(p);
    const price = pricesFor(p.slug);
    const free = Boolean(price?.free) || titles.some((x) => x.rows.some((r) => platformKind(r.name) === "free"));
    const tv = titles.every((x) => x.rows.every((r) => platformKind(r.name) === "tv"));
    return { ...p, titles, free, cost: free ? (p.slug === "youtube" ? "Free with ads" : "Free with ads, no membership") : tv ? "TV channel (cable or DTH)" : (price && startingAt(price)) || "Paid" };
  }).filter((p) => p.titles.length)
    .sort((a, b) => Number(b.free) - Number(a.free) || b.titles.length - a.titles.length);
  const free = dubbed.filter((d) => d.platforms.some((p) => platformKind(p.name) === "free"));
  return { dubbed, platforms, free };
}

export function altMetadata(site: AltSite): Metadata {
  const { dubbed, free } = data();
  return {
    // The title leads with how people search the name (ALT_SITES).
    title: fitTitle([`Anime Salt & Anime World Alternatives: ${dubbed.length} Legal Hindi Dubs`, `${site.search} Alternatives: ${dubbed.length} Legal Hindi Dubs, ${free.length} Free`, `${site.search} Alternatives: Legal Hindi Dubbed Anime (${new Date().getFullYear()})`, `${site.search} Alternatives (${new Date().getFullYear()})`]),
    description: fitDescription(`Looking for ${[site.brand, ...ALSO_SEARCHED].join(", ")}? ${dubbed.length} anime have an official Hindi dub, ${free.length} of them free on YouTube and Prime Video's free tier. Every legal platform compared by price, with the shows on each. Checked ${dubDate()}.`),
    alternates: { canonical: altPath(site) },
  };
}

/** The legal places to watch Hindi dubbed anime, for people searching for an unlicensed site by name. */
export default async function AltSitePage({ site }: { site: AltSite }) {
  const { dubbed, platforms, free } = data();
  const kitsu = await animeBySlugs(free.slice(0, 16).map((d) => d.s), true);
  const poster = (slug: string) => { const a = kitsu.get(slug); return a ? posterUrl(a, "small") : null; };
  const freePlatforms = platforms.filter((p) => p.free);
  const most = [...platforms].sort((a, b) => b.titles.length - a.titles.length)[0];
  const faq = [
    { q: `What is the best alternative to ${site.brand}?`, a: `For free: ${freePlatforms.map((p) => p.label).join(" and ")}, which together carry ${free.length} official Hindi dubs at no cost. For the biggest catalogue: ${most.label}, with ${most.titles.length} of the ${dubbed.length} Hindi dubbed anime on our list.` },
    { q: `Is ${site.brand} legal?`, a: `AniLumi lists only services that license the anime they stream, and ${site.brand} isn't one of them, so we don't link to it. Streaming or downloading anime from unlicensed sites is copyright infringement under India's Copyright Act, and those sites run on pop-up and redirect ads that are a common route for malware on phones.` },
    { q: "Where can I watch Hindi dubbed anime for free, legally?", a: `${free.length} official Hindi dubs are free: ${free.slice(0, 8).map((d) => d.t).join(", ")} and more, on the licensors' YouTube channels (Muse India, Ani-One India) and on MX Player, now Prime Video's free tier.` },
    // "hindi anime websites" (Bing Copilot cites AniLumi for 29% of its answers, Nov 2026).
    { q: "What are the best websites for Hindi dubbed anime?", a: `The official ones: ${platforms.map((p) => `${p.label} (${p.titles.length} Hindi dub${p.titles.length === 1 ? "" : "s"}, ${p.cost.toLowerCase()})`).join("; ")}. Each carries the licensed Hindi audio, so the dub is the real one and the site is safe.` },
    { q: "Which app has the most Hindi dubbed anime?", a: `${most.label}, with ${most.titles.length} of the anime on our list, followed by ${[...platforms].sort((a, b) => b.titles.length - a.titles.length).slice(1, 3).map((p) => `${p.label} (${p.titles.length})`).join(" and ")}.` },
    { q: `Are ${ALSO_SEARCHED.join(" and ")} legal?`, a: `No: like ${site.brand}, they stream anime without a licence, and we don\'t link to them. The legal options are the platforms above, ${free.length} Hindi dubs of them free.` },
    { q: "Is AniLumi a streaming site?", a: "No. AniLumi doesn't host or stream video. It tells you where each anime streams officially, in which languages, and links you to that platform." },
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={itemList("Legal alternatives for Hindi dubbed anime", platforms.map((p) => ({ url: `/hindi-dub/${p.slug}`, name: p.label })))} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/hindi-dub", label: "Hindi dubbed anime" }, { href: altPath(site), label: `${site.brand} alternatives` }]}
        eyebrow="🇮🇳 Legal Hindi anime"
        title={<>{site.brand} alternatives: <span className="text-gradient">legal Hindi dubbed anime</span></>}
        subtitle={`Searching for ${site.brand}, ${ALSO_SEARCHED.join(" or ")}? These are the official places to watch anime in Hindi, free ones first. AniLumi isn't affiliated with any of them and doesn't link to unlicensed sites.`}
        facts={[
          { value: String(dubbed.length), label: "anime in Hindi" },
          { value: String(free.length), label: "free and legal" },
          { value: String(platforms.length), label: "official platforms" },
        ]}
        hue={25}
      >
        <p className="flex flex-wrap gap-2 text-sm">
          <Link href="/hindi-dub" className="chip">Full Hindi dub list</Link>
          <Link href="/hi/hindi-dub" className="chip" hrefLang="hi">हिंदी में देखें</Link>
          <Link href="/dub-schedule#hindi" className="chip">New Hindi dubs</Link>
          <Link href="/download-anime-in-hindi" className="chip">Download Hindi anime legally</Link>
        </p>
      </PageHero>
      <SectionNav sections={[
        ...(free.length ? [{ id: "free", label: "Free" }] : []),
        { id: "platforms", label: "All platforms" },
        { id: "others", label: ALSO_SEARCHED[0] },
        { id: "why", label: "Why official" },
        { id: "faq", label: "FAQ" },
      ]} />

      {free.length > 0 && (
        <section id="free" data-section className="reveal pt-10" aria-labelledby="free-h">
          <h2 id="free-h" className="h-section mb-1">Free Hindi dubbed anime, legally</h2>
          <p className="mb-4 max-w-3xl text-sm text-muted">The closest thing to a free anime site, without the risk: {free.length} official Hindi dubs stream at no cost on {freePlatforms.map((p) => p.label).join(" and ")}.</p>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-8">
            {free.slice(0, 16).map((d) => (
              <li key={d.s} className="min-w-0">
                <Link href={dubHref(d)} className="group block">
                  <span className="relative block aspect-[5/7] overflow-hidden rounded-xl border border-emerald-500/30 bg-bg-2">
                    {poster(d.s) && <Image src={poster(d.s)!} alt={`${d.t} poster`} fill sizes="(max-width:640px) 30vw, 160px" className="object-cover transition duration-500 group-hover:scale-105" />}
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-emerald-600/90 px-1.5 py-0.5 text-[10px] font-bold text-white">FREE</span>
                  </span>
                  <span className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug text-ink group-hover:text-violet-2">{d.t}</span>
                </Link>
              </li>
            ))}
          </ul>
          {free.length > 16 && <p className="mt-3 text-sm"><Link href="/hindi-dub#free" className="text-violet hover:underline">All {free.length} free Hindi dubs →</Link></p>}
        </section>
      )}

      <section id="platforms" data-section className="reveal pt-10" aria-labelledby="platforms-h">
        <h2 id="platforms-h" className="h-section mb-1">Every legal platform for Hindi dubbed anime</h2>
        <p className="mb-4 max-w-3xl text-sm text-muted">Free first, then by how many Hindi dubs each carries. Prices are India&apos;s cheapest plans.</p>
        <ol className="grid gap-3 md:grid-cols-2">
          {platforms.map((p, i) => (
            <li key={p.slug} className="card p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-semibold text-ink"><span className="mr-1.5 text-muted">{i + 1}.</span><Link href={`/hindi-dub/${p.slug}`} className="hover:text-violet-2">{p.label}</Link></h3>
                <span className={`shrink-0 text-xs font-semibold ${p.free ? "text-emerald-300" : "text-muted"}`}>{p.cost}</span>
              </div>
              <p className="mt-1 text-sm text-ink/90">{p.titles.length} Hindi dub{p.titles.length === 1 ? "" : "s"}, including {p.titles.slice(0, 4).map((x, j) => <span key={x.d.s}>{j ? ", " : ""}<Link href={dubHref(x.d)} className="hover:text-violet-2 hover:underline">{x.d.t}</Link></span>)}{/[.!?]$/.test(p.titles[Math.min(3, p.titles.length - 1)].d.t) ? "" : "."}</p>
              <p className="mt-1.5 text-xs leading-5 text-muted">{p.how}</p>
            </li>
          ))}
        </ol>
        <MadeBy className="mt-4" method="Each Hindi dub is checked on the platform's own title page (audio languages) and Indian anime news; fan lists alone never count. Prices are from each platform's India plans page." date={DUB_CHECKED} />
      </section>

      <section id="others" data-section className="reveal pt-10" aria-labelledby="others-h">
        <h2 id="others-h" className="h-section mb-1">Looking for {ALSO_SEARCHED.join(" or ")}?</h2>
        <p className="max-w-3xl text-sm leading-6 text-ink/85">Like {site.brand}, {ALSO_SEARCHED.join(" and ")} aren&rsquo;t licensed to stream the anime they carry, so the same answer applies: the {free.length} free official Hindi dubs above, then the platforms by price. AniLumi checks each Hindi dub on the platform&rsquo;s own page, so every show listed here really has the Hindi audio. For offline viewing, see <Link href="/download-anime-in-hindi" className="text-violet hover:underline">how to download Hindi dubbed anime legally</Link>.</p>
      </section>

      <section id="why" data-section className="reveal pt-10" aria-labelledby="why-h">
        <h2 id="why-h" className="h-section mb-3">Why watch on an official platform</h2>
        <ul className="grid gap-3 md:grid-cols-3">
          <li className="card p-4 text-sm leading-6 text-ink/90"><strong className="block text-ink">Safer phones</strong>Unlicensed anime sites pay their way with pop-ups and redirect ads, a common route for malware and scams.</li>
          <li className="card p-4 text-sm leading-6 text-ink/90"><strong className="block text-ink">The real dub</strong>Official Hindi dubs are cast and mixed by the licensor; uploads elsewhere are often fan-made or re-encoded at low quality.</li>
          <li className="card p-4 text-sm leading-6 text-ink/90"><strong className="block text-ink">More Hindi dubs</strong>Platforms fund new dubs from viewing numbers, so watching officially is how more anime gets dubbed in Hindi.</li>
        </ul>
      </section>

      <div id="faq" data-section className="pt-2"><Faq title={`${site.brand} alternatives FAQ`} items={faq} /></div>
    </div>
  );
}
