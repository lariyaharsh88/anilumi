import type { Metadata } from "next";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import { KIND_CLASS } from "@/components/HindiDub";
import { getAnimeBySlug, posterUrl } from "@/lib/kitsu";
import { itemList } from "@/lib/ld";
import { byPlatform, dubDate, dubHref, hindiDubbed, notDubbed, platformKind, type PlatformKind } from "@/lib/hindidub";
import { fitTitle } from "@/lib/titles";

export const revalidate = 86400;
const KIND: Record<PlatformKind, string> = { free: "Free", subscription: "Subscription", tv: "TV channel" };

export function generateMetadata(): Metadata {
  const n = hindiDubbed().length;
  const free = hindiDubbed().filter((d) => d.platforms.some((p) => platformKind(p.name) === "free")).length;
  // Searchers ask "where to watch anime in Hindi for free": the title answers that the list includes free, legal options.
  return {
    title: fitTitle([`Hindi Dubbed Anime List (${new Date().getFullYear()}): ${n} Anime, ${free} Free`, `Hindi Dubbed Anime (${new Date().getFullYear()}): ${n} Anime, ${free} Free`, `Hindi Dubbed Anime List (${new Date().getFullYear()})`]),
    description: `${n} anime with an official Hindi dub and where to watch each: ${free} free and legal on YouTube (Muse India, Ani-One India) and MX Player, the rest on Crunchyroll, Netflix, Prime Video, JioHotstar and TV. Checked ${dubDate()}.`,
    alternates: { canonical: "/hindi-dub", languages: { en: "/hindi-dub", hi: "/hi/hindi-dub", "x-default": "/hindi-dub" } },
  };
}

/** Every popular anime with an official Hindi dub, by title and by platform, plus the big ones still without. */
export default async function HindiDubHub() {
  const dubbed = hindiDubbed();
  const platforms = byPlatform();
  const free = dubbed.filter((d) => d.platforms.some((p) => platformKind(p.name) === "free"));
  const none = notDubbed();
  const posters = (await Promise.all(dubbed.slice(0, 3).map((d) => getAnimeBySlug(d.s).catch(() => null)))).map((a) => (a ? posterUrl(a, "medium") : null));
  const top = platforms[0];
  const faq = [
    { q: "Which anime have an official Hindi dub?", a: `${dubbed.length} popular anime on our list do, including ${dubbed.slice(0, 8).map((d) => d.t).join(", ")}. The full list with platforms is above.` },
    { q: "Where can I watch anime in Hindi for free?", a: free.length ? `${platforms.filter((p) => p.kind === "free").map((p) => p.name).join(", ")} carry Hindi dubs at no cost, for example ${free.slice(0, 6).map((d) => d.t).join(", ")}.` : "None of the dubs on our list is free right now." },
    { q: "Which platform has the most Hindi-dubbed anime?", a: `${top.name}, with ${top.titles.length} of the anime on this list, followed by ${platforms.slice(1, 3).map((p) => `${p.name} (${p.titles.length})`).join(" and ")}.` },
    { q: "How was this list checked?", a: `Against each platform's own title page (Crunchyroll lists Hindi under Audio; Netflix India lists audio languages) and Indian anime news, on ${dubDate()}. Fan lists alone never count. Platforms add and drop dubs, so check the audio menu before you start.` },
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={itemList("Anime with an official Hindi dub", dubbed.map((d) => ({ url: dubHref(d), name: `${d.t} (Hindi dub)` })))} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/hindi-dub", label: "Hindi dubbed anime" }]}
        eyebrow="🇮🇳 Hindi dub"
        title={<>Anime with an official <span className="text-gradient">Hindi dub</span></>}
        subtitle="Which popular anime you can watch in Hindi, on which platform and for which seasons. Every entry links to the page that confirms it."
        facts={[
          { value: String(dubbed.length), label: "anime in Hindi" },
          { value: String(free.length), label: "free to watch" },
          { value: String(platforms.length), label: "platforms" },
        ]}
        hue={25}
        posters={posters}
      >
        <p className="flex flex-wrap gap-2 text-sm">
          <Link href="/hi/hindi-dub" className="chip" hrefLang="hi">हिंदी में देखें</Link>
          {free.length > 0 && <a href="#free" className="chip">Free and legal ({free.length})</a>}
          <a href="#by-platform" className="chip">By platform</a>
          <a href="#no-dub" className="chip">No Hindi dub yet</a>
        </p>
      </PageHero>

      {free.length > 0 && (
        <section id="free" className="card reveal mt-10 scroll-mt-24 border-emerald-500/40 bg-emerald-500/[.06] p-4" aria-labelledby="free-h">
          <h2 id="free-h" className="font-semibold text-ink">Watch anime in Hindi for free, legally</h2>
          <p className="mt-1 text-sm text-ink/80">These {free.length} official Hindi dubs cost nothing: they stream on the licensors&apos; own YouTube channels or ad-supported MX Player. Sites offering &ldquo;free Hindi anime&rdquo; beyond these are unlicensed uploads.</p>
          <ul className="mt-3 grid gap-x-4 gap-y-1.5 text-sm sm:grid-cols-2">
            {free.map((d) => (
              <li key={d.s} className="min-w-0">
                <Link href={dubHref(d)} className="font-medium text-ink hover:text-violet-2">{d.t}</Link>
                <span className="text-muted"> · {d.platforms.filter((p) => platformKind(p.name) === "free").map((p, i) => <span key={p.name}>{i ? ", " : ""}<a href={p.url} target="_blank" rel="noopener nofollow" className="hover:text-violet-2 hover:underline">{p.name}{p.scope ? ` (${p.scope})` : ""}</a></span>)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="reveal mt-10" aria-labelledby="list-h">
        <h2 id="list-h" className="h-section mb-1">Hindi dubbed anime, most-watched first</h2>
        <p className="mb-4 text-sm text-muted">Checked {dubDate()}. Scope shows which seasons or films have Hindi audio.</p>
        <ul className="grid gap-3 md:grid-cols-2">
          {dubbed.map((d) => (
            <li key={d.s} className="card p-4">
              <Link href={dubHref(d)} className="font-semibold text-ink hover:text-violet-2">{d.t}</Link>
              <ul className="mt-2 space-y-1.5">
                {d.platforms.map((p) => (
                  <li key={p.name + p.scope} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                    <span className="font-medium text-ink/90">{p.name}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${KIND_CLASS[platformKind(p.name)]}`}>{KIND[platformKind(p.name)]}</span>
                    {p.scope && <span className="text-muted">· {p.scope}</span>}
                    <a href={p.url} target="_blank" rel="noopener nofollow" className="text-xs text-violet hover:underline">source ↗</a>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <section id="by-platform" className="reveal mt-12 scroll-mt-24" aria-labelledby="plat-h">
        <h2 id="plat-h" className="h-section mb-4">Hindi dubs by platform</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {platforms.map((p) => (
            <div key={p.name} className="card p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-ink">{p.name}</h3>
                <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${KIND_CLASS[p.kind]}`}>{KIND[p.kind]}</span>
              </div>
              <p className="text-xs text-muted">{p.titles.length} anime</p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {p.titles.map(({ d }) => <li key={d.s}><Link href={dubHref(d)} className="chip text-xs">{d.t}</Link></li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section id="no-dub" className="reveal mt-12 scroll-mt-24" aria-labelledby="none-h">
        <h2 id="none-h" className="h-section mb-1">Popular anime with no Hindi dub yet</h2>
        <p className="mb-4 text-sm text-muted">Checked on the platforms that stream them in India; none offered Hindi audio on {dubDate()}.</p>
        <ul className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3">
          {none.map((d) => (
            <li key={d.s} className="min-w-0">
              <Link href={dubHref(d)} className="font-medium text-ink hover:text-violet-2">{d.t}</Link>
              <span className="block text-xs text-muted">{d.note}</span>
            </li>
          ))}
        </ul>
      </section>

      <Faq title="Hindi dub FAQ" items={faq} />
    </div>
  );
}
