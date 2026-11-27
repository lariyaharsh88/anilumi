import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import MadeBy from "@/components/MadeBy";
import AnswerLead from "@/components/AnswerLead";
import JoinChannels from "@/components/JoinChannels";
import HindiDubList, { type DubCard } from "@/components/HindiDubList";
import { hrefIn } from "@/components/RegionalDubPage";
import { animeBySlugs, posterUrl } from "@/lib/kitsu";
import { itemList } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { dubsOn, hasHindiDub, platformKind } from "@/lib/hindidub";
import { pricesFor, startingAt } from "@/lib/platformprices";
import { LANG, REGIONAL_CHECKED, cheapest, dubbedIn, platformLabel, regionalDate, regionalPlatform, regionalPlatformPath, regionalPlatforms, type RegionalLang } from "@/lib/regionaldub";

function load(lang: RegionalLang, slug: string) {
  const x = regionalPlatform(lang, decodeURIComponent(slug));
  if (!x) notFound();
  return x;
}
/** The platform's "how to switch the audio" line, in this language. */
const howIn = (how: string, lang: RegionalLang) => how.replace(/Hindi/g, LANG[lang].name);
const join = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);

export function regionalPlatformMetadata(lang: RegionalLang, slug: string): Metadata {
  const { p, titles } = load(lang, slug);
  const L = LANG[lang], name = platformLabel(p), y = new Date().getFullYear();
  return {
    title: fitTitle([`${L.name} Dubbed Anime on ${name} (${y}): All ${titles.length} Anime`, `${L.name} Dubbed Anime on ${name} (${y})`, `${L.name} Anime on ${name}`]),
    description: fitDescription(`${titles.length} anime with an official ${L.name} dub on ${name}, including ${titles.slice(0, 4).map((d) => d.t).join(", ")}: which seasons, how to switch the audio to ${L.name} and what it costs. Checked ${regionalDate()}.`),
    alternates: { canonical: regionalPlatformPath(lang, p.slug) },
  };
}

/** /tamil-dub/<platform>, /telugu-dub/<platform>: every anime with an official dub in the language on one platform. */
export default async function RegionalPlatformPage({ lang, slug }: { lang: RegionalLang; slug: string }) {
  const { p, titles } = load(lang, slug);
  const L = LANG[lang], other = LANG[L.other], name = platformLabel(p);
  const kitsu = await animeBySlugs(titles.map((d) => d.s), true);
  const list = [...titles].sort((a, b) => (kitsu.get(b.s)?.userCount ?? 0) - (kitsu.get(a.s)?.userCount ?? 0));
  const price = pricesFor(p.slug);
  const cost = price ? (price.free ? "free with ads" : startingAt(price)?.replace(/^From/, "from")) : null;
  const inOther = list.filter((d) => dubbedIn(L.other).some((x) => x.s === d.s && x.platforms.some((r) => p.match.test(r.name)))).length;
  const inHindi = list.filter((d) => hasHindiDub(d.s)).length;
  const others = regionalPlatforms(lang).filter((x) => x.p.slug !== p.slug);
  const hindiHere = dubsOn(p).length;
  const cards: DubCard[] = list.map((d) => {
    const a = kitsu.get(d.s);
    // This platform's rows only, and the badge from them: One Punch Man is free on Muse India, not on Crunchyroll.
    const rows = d.platforms.filter((r) => p.match.test(r.name));
    return {
      s: d.s, t: d.t, href: hrefIn(d, lang), poster: a ? posterUrl(a, "small") : null, year: a?.startDate ? Number(a.startDate.slice(0, 4)) : null, cheapest: cheapest({ ...d, platforms: rows }), checked: d.checked, oneSource: d.confidence === "medium",
      platforms: rows.map((r) => ({ name: r.name, scope: r.scope, url: r.url, kind: platformKind(r.name) })),
    };
  });
  const answer = `${list.length} anime have an official ${L.name} dub on ${name}, including ${join(list.slice(0, 5).map((d) => d.t))}.${cost ? ` ${name} is ${cost}.` : ""} ${howIn(p.how, lang)}`;
  const faq = [
    { q: `Which anime are in ${L.name} on ${name}?`, a: `${list.length} of them, most-watched first: ${list.slice(0, 10).map((d) => d.t).join(", ")}${list.length > 10 ? ` and ${list.length - 10} more` : ""}.` },
    { q: `How do I watch anime in ${L.name} on ${name}?`, a: howIn(p.how, lang) },
    ...(cost ? [{ q: `How much does ${name} cost in India?`, a: `${name} is ${cost}. Prices are India's, as listed on ${name}'s plans page.` }] : []),
    { q: `Are these anime also in ${other.name} and Hindi?`, a: `${inOther} of the ${list.length} are also in ${other.name} on ${name}, and ${inHindi} have an official Hindi dub. Indian dubs are often made together.` },
    ...(others.length ? [{ q: `Which other apps have ${L.name} dubbed anime?`, a: `${others.map((x) => `${platformLabel(x.p)} (${x.titles.length})`).join(", ")}. The full ${L.name} list covers every platform, TV channels included.` }] : []),
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={itemList(`${L.name} dubbed anime on ${name}`, list.map((d) => ({ url: hrefIn(d, lang), name: `${d.t} (${L.name} dub)` })))} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: L.path, label: `${L.name} dubbed anime` }, { href: regionalPlatformPath(lang, p.slug), label: name }]}
        eyebrow={`🇮🇳 ${L.name} dub · ${L.native}`}
        title={<>{L.name} dubbed anime on <span className="text-gradient">{name}</span></>}
        subtitle={`Every anime you can watch in ${L.name} on ${name}, which seasons have the ${L.name} audio, and how to turn it on. Official platform pages only.`}
        facts={[
          { value: String(list.length), label: `anime in ${L.name}` },
          { value: String(inOther), label: `also in ${other.name}` },
          { value: String(inHindi), label: "also in Hindi" },
          ...(cost ? [{ value: price?.free ? "Free" : `${startingAt(price!)?.match(/₹[\d,]+/)?.[0] ?? "Paid"}`, label: price?.free ? "with ads" : "cheapest plan" }] : []),
        ]}
        hue={lang === "ta" ? 15 : 45}
        posters={list.slice(0, 3).map((d) => { const a = kitsu.get(d.s); return a ? posterUrl(a, "medium") : null; })}
      >
        <p className="flex flex-wrap gap-2 text-sm">
          <Link href={L.path} className="chip">All {L.name} dubs</Link>
          {regionalPlatform(L.other, p.slug) && <Link href={regionalPlatformPath(L.other, p.slug)} className="chip">{other.name} on {name}</Link>}
          {hindiHere > 0 && <Link href={`/hindi-dub/${p.slug}`} className="chip">Hindi on {name}</Link>}
          <Link href={`${L.path}/best`} className="chip">Best {L.name} dubs</Link>
          {others.map((x) => <Link key={x.p.slug} href={regionalPlatformPath(lang, x.p.slug)} className="chip">{platformLabel(x.p)}</Link>)}
        </p>
      </PageHero>

      <AnswerLead checked={regionalDate()}>{answer}</AnswerLead>

      <section className="reveal pt-10" aria-labelledby="list-h">
        <h2 id="list-h" className="h-section mb-1">All {list.length} {L.name} dubbed anime on {name}</h2>
        <p className="mb-4 max-w-3xl text-sm text-muted">Most-watched first, with the seasons that have the {L.name} audio.</p>
        <HindiDubList items={cards} platforms={[]} labels={{ searchLabel: `Search ${L.name} anime on ${name}`, none: `No match on ${name}. It may not have a ${L.name} dub there yet.`, dub: `${L.name} dub` }} canReport={false} />
        <MadeBy className="mt-4" method={`Each ${L.name} dub is checked on ${name}'s own title page (audio languages), the licensor's announcement or Indian anime news; fan lists and unofficial uploads never count.`} date={REGIONAL_CHECKED} />
      </section>

      <JoinChannels className="mt-8" source={`${lang === "ta" ? "tamil" : "telugu"}-${p.slug}`} lang={L.name} />
      <div id="faq" data-section className="pt-2"><Faq title={`${L.name} anime on ${name}: FAQ`} items={faq} /></div>
    </div>
  );
}
