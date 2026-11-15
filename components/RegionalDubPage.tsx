import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/components/Link";
import MadeBy from "@/components/MadeBy";
import PageHero from "@/components/PageHero";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import SectionNav from "@/components/fx/SectionNav";
import BarChart from "@/components/viz/BarChart";
import HindiDubList, { type DubCard } from "@/components/HindiDubList";
import LeadForm from "@/components/LeadForm";
import CorrectionForm from "@/components/CorrectionForm";
import { dbEnabled } from "@/lib/db";
import { animeBySlugs, posterUrl, type Anime } from "@/lib/kitsu";
import { itemList } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { dubHref, hasHindiDub, platformKind } from "@/lib/hindidub";
import { LANG, REGIONAL_CHECKED, cheapest, dubbedIn, platformsFor, regionalDate, type RegionalLang } from "@/lib/regionaldub";

/** /tamil-dub and /telugu-dub: every anime with an official dub in the language, free ones first, then by platform. */
export function regionalMetadata(lang: RegionalLang): Metadata {
  const L = LANG[lang], dubs = dubbedIn(lang);
  const free = dubs.filter((d) => cheapest(d) === "free").length;
  const year = new Date().getFullYear();
  return {
    title: fitTitle([`${L.name} Dubbed Anime List (${year}): ${dubs.length} Anime in ${L.name}${free ? `, ${free} Free` : ""}`, `${L.name} Dubbed Anime List (${year}): ${dubs.length} Anime`, `${L.name} Dubbed Anime List (${year})`]),
    description: fitDescription(`${dubs.length} anime with an official ${L.name} dub and where to watch each in India${free ? `, ${free} of them free` : ""}: ${platformsFor(dubs).slice(0, 4).map((p) => p.name).join(", ")}. Official platforms only, checked ${regionalDate()}.`),
    alternates: { canonical: L.path },
    ...(dubs.length >= 5 ? {} : { robots: { index: false, follow: true } }),
  };
}

const yearOf = (a: Anime | undefined) => (a?.startDate ? Number(a.startDate.slice(0, 4)) : null);

export default async function RegionalDubPage({ lang }: { lang: RegionalLang }) {
  const L = LANG[lang], other = LANG[L.other];
  const dubs = dubbedIn(lang), platforms = platformsFor(dubs);
  const free = dubs.filter((d) => cheapest(d) === "free");
  const both = dubs.filter((d) => dubbedIn(L.other).some((x) => x.s === d.s)).length;
  const hindi = dubs.filter((d) => hasHindiDub(d.s)).length;
  const kitsu = await animeBySlugs(dubs.map((d) => d.s), true);
  // Kitsu followers rank titles the franchise list doesn't know yet (Doraemon, this year's Crunchyroll dubs).
  const byFollowers = (a: { s: string }, b: { s: string }) => (kitsu.get(b.s)?.userCount ?? 0) - (kitsu.get(a.s)?.userCount ?? 0);
  dubs.sort(byFollowers); free.sort(byFollowers);
  for (const p of platforms) p.titles.sort(byFollowers);
  const poster = (s: string, size: "small" | "medium" = "small") => { const a = kitsu.get(s); return a ? posterUrl(a, size) : null; };
  const cards: DubCard[] = dubs.map((d) => ({
    s: d.s, t: d.t, href: dubHref(d), poster: poster(d.s), year: yearOf(kitsu.get(d.s)), cheapest: cheapest(d), checked: d.checked, oneSource: d.confidence === "medium",
    platforms: d.platforms.map((p) => ({ name: p.name, scope: p.scope, url: p.url, kind: platformKind(p.name) })),
  }));
  const top = platforms[0];
  const faq = [
    { q: `Which anime are dubbed in ${L.name}?`, a: dubs.length ? `${dubs.length} anime have an official ${L.name} dub on our list, including ${dubs.slice(0, 8).map((d) => d.t).join(", ")}. Each card above shows where to watch it.` : `We haven't confirmed an official ${L.name} dub yet.` },
    ...(top ? [{ q: `Which app has the most ${L.name} dubbed anime?`, a: `${top.name}, with ${top.titles.length} of them${platforms.length > 1 ? `, followed by ${platforms.slice(1, 3).map((p) => `${p.name} (${p.titles.length})`).join(" and ")}` : ""}. On streaming apps, start an episode and pick ${L.name} in the audio menu.` }] : []),
    { q: `Can I watch anime in ${L.name} for free?`, a: free.length ? `Yes, legally: ${free.slice(0, 6).map((d) => d.t).join(", ")} stream free on ${platforms.filter((p) => p.kind === "free").map((p) => p.name).join(" and ")}.` : `Not on our list yet: the official ${L.name} dubs are on subscription apps. Free uploads elsewhere are unlicensed.` },
    { q: `Do these anime have a ${other.name} and Hindi dub too?`, a: `${both} of the ${dubs.length} also have an official ${other.name} dub and ${hindi} a Hindi dub: Indian dubs are often made together. See the ${other.name} and Hindi lists.` },
    { q: "How was this list checked?", a: `Against each platform's own title page (its audio languages), the licensors' announcements and Indian anime news, on ${regionalDate()}. Fan lists and unofficial uploads never count. Platforms add and drop dubs, so check the audio menu before you start.` },
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={itemList(`Anime with an official ${L.name} dub`, dubs.map((d) => ({ url: dubHref(d), name: `${d.t} (${L.name} dub)` })))} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/hindi-dub", label: "Indian dubs" }, { href: L.path, label: `${L.name} dubbed anime` }]}
        eyebrow={`🇮🇳 ${L.name} dub · ${L.native}`}
        title={<>Anime with an official <span className="text-gradient">{L.name} dub</span></>}
        subtitle={`Which anime you can watch in ${L.name}, on which platform and for which seasons. Official platforms only; every entry links to the page that confirms it.`}
        facts={[
          { value: String(dubs.length), label: `anime in ${L.name}` },
          { value: String(free.length), label: "free to watch" },
          { value: String(platforms.length), label: "platforms" },
          { value: String(both), label: `also in ${other.name}` },
        ]}
        hue={lang === "ta" ? 15 : 45}
        posters={dubs.slice(0, 3).map((d) => poster(d.s, "medium"))}
      >
        <p className="flex flex-wrap gap-2 text-sm">
          <Link href={other.path} className="chip">{other.name} dubbed anime</Link>
          <Link href="/hindi-dub" className="chip">Hindi dubbed anime</Link>
          <Link href="/anime-salt-alternatives" className="chip">Free legal options</Link>
          <Link href="/where-to-watch" className="chip">Where to watch in India</Link>
        </p>
      </PageHero>
      <SectionNav sections={[
        ...(free.length ? [{ id: "free", label: `Free (${free.length})` }] : []),
        { id: "list", label: `All ${dubs.length}` },
        ...(platforms.length ? [{ id: "by-platform", label: "By platform" }] : []),
        { id: "faq", label: "FAQ" },
      ]} />

      {free.length > 0 && (
        <section id="free" data-section className="reveal pt-10" aria-labelledby="free-h">
          <h2 id="free-h" className="h-section mb-1">Watch anime in {L.name} for free, legally</h2>
          <p className="mb-4 max-w-3xl text-sm text-muted">These {free.length} official {L.name} dubs cost nothing, on {platforms.filter((p) => p.kind === "free").map((p) => p.name).join(" and ")}.</p>
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
              </li>
            ))}
          </ul>
        </section>
      )}

      {dbEnabled() && <LeadForm className="mt-8" kind={lang === "ta" ? "tamil" : "telugu"} source={lang === "ta" ? "tamil-hub" : "telugu-hub"} title={`🇮🇳 Email me when a new anime gets a ${L.name} dub`} blurb={`One short email when an official ${L.name} dub is added, with where to watch it and whether it's free. No pirate links, ever.`} />}

      <section id="list" data-section className="reveal pt-10" aria-labelledby="list-h">
        <h2 id="list-h" className="h-section mb-1">All {dubs.length} {L.name} dubbed anime</h2>
        <p className="mb-4 max-w-3xl text-sm text-muted">Most-watched first. Filter by how you watch or by platform.</p>
        <HindiDubList items={cards} platforms={platforms.map((p) => p.name)} labels={{ searchLabel: `Search ${L.name} dubbed anime`, none: `No ${L.name} dub matches. It may not have one yet, or we haven't confirmed it.`, dub: `${L.name} dub` }} canReport={dbEnabled()} />
        {dbEnabled() && <CorrectionForm kind="dub" className="mt-4" />}
        <MadeBy className="mt-4" method={`Each ${L.name} dub is checked on the platform's own title page (audio languages), the licensor's announcement or Indian anime news; fan lists and unofficial uploads never count.`} date={REGIONAL_CHECKED} />
      </section>

      {platforms.length > 0 && (
        <section id="by-platform" data-section className="reveal pt-10" aria-labelledby="platform-h">
          <h2 id="platform-h" className="h-section mb-4">{L.name} dubs by platform</h2>
          <div className="grid gap-4 lg:grid-cols-2">
            <BarChart orientation="bar" integer title={`Which platform has the most ${L.name} dubs?`} subtitle="Anime on each platform" valueHeading="Anime"
              data={platforms.slice(0, 8).map((p) => ({ key: p.name, label: p.name, value: p.titles.length, display: `${p.titles.length} anime` }))} labelKeys={platforms.slice(0, 3).map((p) => p.name)} highlightKey={top?.name} />
            <ul className="grid gap-2 text-sm">
              {platforms.map((p) => (
                <li key={p.name} className="card p-3">
                  <p className="font-semibold text-ink">{p.name} <span className="text-xs font-normal text-muted">· {p.kind === "free" ? "Free" : p.kind === "tv" ? "TV channel" : "Subscription"} · {p.titles.length} anime</span></p>
                  <p className="mt-0.5 text-ink/80">{p.titles.slice(0, 6).map((d, i) => <span key={d.s}>{i ? ", " : ""}<Link href={dubHref(d)} className="hover:text-violet-2 hover:underline">{d.t}</Link></span>)}{p.titles.length > 6 ? ` and ${p.titles.length - 6} more` : ""}</p>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <div id="faq" data-section className="pt-2"><Faq title={`${L.name} dub FAQ`} items={faq} /></div>
    </div>
  );
}
