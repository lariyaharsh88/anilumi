import type { Metadata } from "next";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import { KIND_CLASS } from "@/components/HindiDub";
import Image from "next/image";
import { listAnime, posterUrl, type Anime } from "@/lib/kitsu";
import { itemList } from "@/lib/ld";
import { HINDI_PLATFORMS, byPlatform, dubDate, dubHref, hindiDubbed, notDubbed, platformKind, type PlatformKind } from "@/lib/hindidub";
import { fitTitle, fitDescription } from "@/lib/titles";
import { dubStats, cheapestKind, genreCounts, eraCounts } from "@/lib/hindistats";
import SectionNav from "@/components/fx/SectionNav";
import StatTiles from "@/components/viz/StatTiles";
import BarChart from "@/components/viz/BarChart";
import StackedBar from "@/components/viz/StackedBar";
import HindiDubList, { type DubCard } from "@/components/HindiDubList";

export const revalidate = 86400;
const KIND: Record<PlatformKind, string> = { free: "Free", subscription: "Subscription", tv: "TV channel" };

export function generateMetadata(): Metadata {
  const n = hindiDubbed().length;
  const free = hindiDubbed().filter((d) => d.platforms.some((p) => platformKind(p.name) === "free")).length;
  // Searchers ask "where to watch anime in Hindi for free": the title answers that the list includes free, legal options.
  return {
    title: fitTitle([`Hindi Dubbed Anime List (${new Date().getFullYear()}): ${n} Anime, ${free} Free`, `Hindi Dubbed Anime (${new Date().getFullYear()}): ${n} Anime, ${free} Free`, `Hindi Dubbed Anime List (${new Date().getFullYear()})`]),
    description: fitDescription(`${n} anime with an official Hindi dub and where to watch each: ${free} free and legal on YouTube (Muse India, Ani-One India) and MX Player, the rest on Crunchyroll, Netflix, Prime Video, JioHotstar and TV. Checked ${dubDate()}.`),
    alternates: { canonical: "/hindi-dub", languages: { en: "/hindi-dub", hi: "/hi/hindi-dub", "x-default": "/hindi-dub" } },
  };
}

/** Kitsu records (poster, genres, start year) for the dubbed franchises, 20 slugs per request, cached for a day. */
async function kitsuFor(slugs: string[]): Promise<Map<string, Anime>> {
  const pages = await Promise.all(Array.from({ length: Math.ceil(slugs.length / 20) }, (_, i) =>
    listAnime({ filter: { slug: slugs.slice(i * 20, i * 20 + 20).join(",") }, limit: 20, withCategories: true, revalidate: 86400, unrated: true }).then((r) => r.items).catch((): Anime[] => [])));
  return new Map(pages.flat().map((a) => [a.slug, a]));
}
const yearOf = (a: Anime | undefined) => (a?.startDate ? Number(a.startDate.slice(0, 4)) : null);

/** Every popular anime with an official Hindi dub, by title and by platform, plus the big ones still without. */
export default async function HindiDubHub() {
  const dubbed = hindiDubbed();
  const platforms = byPlatform();
  const free = dubbed.filter((d) => d.platforms.some((p) => platformKind(p.name) === "free"));
  const none = notDubbed();
  const kitsu = await kitsuFor(dubbed.map((d) => d.s));
  const poster = (slug: string, size: "small" | "medium" = "small") => { const a = kitsu.get(slug); return a ? posterUrl(a, size) : null; };
  const posters = dubbed.slice(0, 3).map((d) => poster(d.s, "medium"));
  const st = dubStats();
  const genres = genreCounts(dubbed.flatMap((d) => { const a = kitsu.get(d.s); return a ? [a.categories.map((c) => c.title)] : []; }));
  const eras = eraCounts(dubbed.map((d) => yearOf(kitsu.get(d.s))));
  const withYear = eras.reduce((n, e) => n + e.value, 0);
  const cards: DubCard[] = dubbed.map((d) => ({
    s: d.s, t: d.t, href: dubHref(d), poster: poster(d.s), year: yearOf(kitsu.get(d.s)), cheapest: cheapestKind(d),
    platforms: d.platforms.map((p) => ({ name: p.name, scope: p.scope, url: p.url, kind: platformKind(p.name) })),
  }));
  const platformPage = (name: string) => { const page = HINDI_PLATFORMS.find((x) => x.match.test(name)); return page ? `/hindi-dub/${page.slug}` : null; };
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
          { value: `${st.share}%`, label: "of popular anime" },
        ]}
        hue={25}
        posters={posters}
      >
        <p className="flex flex-wrap gap-2 text-sm">
          <Link href="/hi/hindi-dub" className="chip" hrefLang="hi">हिंदी में देखें</Link>
          <Link href="/dub-schedule#hindi" className="chip">New Hindi dubs</Link>
          <Link href="/hindi-voice-artists" className="chip">Hindi voice artists</Link>
          <Link href="/where-to-watch" className="chip">Where to watch in India</Link>
        </p>
      </PageHero>
      <SectionNav sections={[
        ...(free.length ? [{ id: "free", label: `Free (${free.length})` }] : []),
        { id: "numbers", label: "In numbers" },
        { id: "list", label: `All ${dubbed.length}` },
        { id: "by-platform", label: "By platform" },
        { id: "no-dub", label: "No dub yet" },
        { id: "faq", label: "FAQ" },
      ]} />

      {free.length > 0 && (
        <section id="free" data-section className="reveal pt-10" aria-labelledby="free-h">
          <h2 id="free-h" className="h-section mb-1">Watch anime in Hindi for free, legally</h2>
          <p className="mb-4 max-w-3xl text-sm text-muted">These {free.length} official Hindi dubs cost nothing: they stream on the licensors&apos; own YouTube channels or ad-supported MX Player. Sites offering &ldquo;free Hindi anime&rdquo; beyond these are unlicensed uploads.</p>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-8">
            {free.map((d) => (
              <li key={d.s} className="min-w-0">
                <Link href={dubHref(d)} className="group block">
                  <span className="relative block aspect-[5/7] overflow-hidden rounded-xl border border-emerald-500/30 bg-bg-2">
                    {poster(d.s) && <Image src={poster(d.s)!} alt={`${d.t} poster`} fill sizes="(max-width:640px) 30vw, 160px" className="object-cover transition duration-500 group-hover:scale-105" />}
                    <span className="absolute left-1.5 top-1.5 rounded-full bg-emerald-600/90 px-1.5 py-0.5 text-[10px] font-bold text-white">FREE</span>
                  </span>
                  <span className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug text-ink group-hover:text-violet-2">{d.t}</span>
                </Link>
                <span className="block truncate text-xs text-muted">{d.platforms.filter((p) => platformKind(p.name) === "free").map((p, i) => <span key={p.name}>{i ? ", " : ""}<a href={p.url} target="_blank" rel="noopener nofollow" className="hover:text-violet-2 hover:underline">{p.name.replace(/ \(YouTube\)$/, "")}</a></span>)}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section id="numbers" data-section className="reveal pt-10" aria-labelledby="num-h">
        <h2 id="num-h" className="h-section mb-1">Hindi dubbed anime in numbers</h2>
        <p className="mb-4 max-w-3xl text-sm text-muted">Of the {st.checked} most-watched anime franchises we checked, {st.dubbed} ({st.share}%) have an official Hindi dub. {st.multi} of them stream in more than one place, so you can often pick the cheapest.</p>
        <StatTiles stats={[
          { label: "Anime with a Hindi dub", value: String(st.dubbed), sub: `of ${st.checked} checked` },
          { label: "Free to watch", value: String(st.access.free), sub: "YouTube or MX Player" },
          { label: "Platforms carrying them", value: String(st.platformCount), sub: "streaming and TV" },
          { label: "On 2+ platforms", value: String(st.multi), sub: `${Math.round((st.multi / Math.max(1, st.dubbed)) * 100)}% of dubs` },
        ]} />
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <StackedBar title="How you can watch them" subtitle="Each dub counted once, by its cheapest option" unit="anime" segments={[
            { key: "free", label: "Free somewhere", value: st.access.free },
            { key: "sub", label: "Subscription only", value: st.access.subscription },
            { key: "tv", label: "TV channel only", value: st.access.tv },
          ]} />
          <StackedBar title="Popular anime with and without a Hindi dub" subtitle={`The ${st.checked} most-watched franchises we checked`} unit="anime" segments={[
            { key: "yes", label: "Hindi dub", value: st.dubbed },
            { key: "no", label: "No Hindi dub yet", value: st.none },
          ]} />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <BarChart orientation="bar" integer title="Which platform has the most Hindi dubs?" subtitle={`Anime on each platform${st.other ? `. Other: ${st.other.names.join(", ")}` : ""}`} valueHeading="Anime"
            data={[...st.platforms.map((p) => ({ key: p.name, label: p.name, value: p.count, display: `${p.count} anime`, href: platformPage(p.name) ?? undefined })), ...(st.other ? [{ key: "other", label: "Other", value: st.other.count, display: `${st.other.count} anime` }] : [])]}
            labelKeys={st.platforms.slice(0, 3).map((p) => p.name)} highlightKey={st.platforms[0]?.name} />
          <div className="grid gap-4">
            {genres.length > 0 && <BarChart orientation="bar" integer title="Hindi dubs by genre" subtitle={`${genres[0]?.label} and ${genres[1]?.label} lead; an anime can have several genres`} valueHeading="Anime"
              data={genres.map((g) => ({ key: g.label, label: g.label, value: g.value, display: `${g.value} anime` }))} labelKeys={genres.slice(0, 2).map((g) => g.label)} highlightKey={genres[0]?.label} />}
          </div>
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          {withYear > 0 && <BarChart integer title="When the dubbed anime first aired" subtitle="Most Hindi dubs are of recent hits, but classics from the 1990s and 2000s are there too" valueHeading="Anime"
            data={eras.map((e) => ({ key: e.label, label: e.label, value: e.value, display: `${e.value} anime` }))} labelKeys={eras.map((e) => e.label)} height={170} />}
          <BarChart integer title="On how many platforms is each dub?" subtitle="More platforms means more ways to watch, often one of them free" valueHeading="Anime"
            data={st.spread.map((x) => ({ key: x.label, label: `${x.label} platform${x.label === "1" ? "" : "s"}`, value: x.value, display: `${x.value} anime` }))} labelKeys={st.spread.map((x) => x.label)} height={170} />
        </div>
      </section>

      <section id="list" data-section className="reveal pt-10" aria-labelledby="list-h">
        <h2 id="list-h" className="h-section mb-1">All {dubbed.length} Hindi dubbed anime, most-watched first</h2>
        <p className="mb-4 text-sm text-muted">Checked {dubDate()}. Scope shows which seasons or films have Hindi audio; every row links to the page that confirms it.</p>
        <HindiDubList items={cards} platforms={platforms.map((p) => p.name)} />
      </section>

      <section id="by-platform" data-section className="reveal pt-10" aria-labelledby="plat-h">
        <h2 id="plat-h" className="h-section mb-4">Hindi dubs by platform</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {platforms.map((p) => (
            <div key={p.name} className="card p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-ink">{platformPage(p.name) ? <Link href={platformPage(p.name)!} className="hover:text-violet-2 hover:underline">{p.name}</Link> : p.name}</h3>
                <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${KIND_CLASS[p.kind]}`}>{KIND[p.kind]}</span>
              </div>
              <p className="text-xs text-muted">{p.titles.length} anime</p>
              <span className="mt-2 block h-1.5 rounded-full bg-white/10"><span className="block h-1.5 rounded-full bg-violet" style={{ width: `${(p.titles.length / platforms[0].titles.length) * 100}%` }} /></span>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {p.titles.slice(0, 8).map(({ d }) => <li key={d.s}><Link href={dubHref(d)} className="chip text-xs">{d.t}</Link></li>)}
              </ul>
              {p.titles.length > 8 && (platformPage(p.name)
                ? <Link href={platformPage(p.name)!} className="mt-2 inline-block text-xs font-medium text-violet hover:underline">All {p.titles.length} on {p.name} →</Link>
                : <details className="mt-2 text-xs"><summary className="cursor-pointer text-violet">+{p.titles.length - 8} more</summary><ul className="mt-2 flex flex-wrap gap-1.5">{p.titles.slice(8).map(({ d }) => <li key={d.s}><Link href={dubHref(d)} className="chip text-xs">{d.t}</Link></li>)}</ul></details>)}
            </div>
          ))}
        </div>
      </section>

      <section id="no-dub" data-section className="reveal pt-10" aria-labelledby="none-h">
        <h2 id="none-h" className="h-section mb-1">Popular anime with no Hindi dub yet</h2>
        <p className="mb-4 text-sm text-muted">Checked on the platforms that stream them in India; none offered Hindi audio on {dubDate()}.</p>
        {(() => {
          const item = (d: (typeof none)[number]) => (
            <li key={d.s} className="min-w-0">
              <Link href={dubHref(d)} className="font-medium text-ink hover:text-violet-2">{d.t}</Link>
              <span className="block text-xs text-muted">{d.note}</span>
            </li>
          );
          const grid = "grid gap-x-6 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-3";
          return (
            <>
              <ul className={grid}>{none.slice(0, 24).map(item)}</ul>
              {none.length > 24 && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-violet">Show all {none.length} without a Hindi dub</summary>
                  <ul className={`${grid} mt-3`}>{none.slice(24).map(item)}</ul>
                </details>
              )}
            </>
          );
        })()}
      </section>

      <p className="mt-8 text-sm"><Link href="/hindi-voice-artists" className="font-medium text-violet hover:underline">🎙️ Who voices anime in Hindi? Meet the voice artists →</Link></p>
      <div id="faq" data-section className="pt-2"><Faq title="Hindi dub FAQ" items={faq} /></div>
    </div>
  );
}
