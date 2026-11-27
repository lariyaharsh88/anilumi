import type { Metadata } from "next";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import Faq from "@/components/Faq";
import JoinChannels from "@/components/JoinChannels";
import JsonLd from "@/components/JsonLd";
import MadeBy from "@/components/MadeBy";
import SectionNav from "@/components/fx/SectionNav";
import HindiDubList, { type DubCard } from "@/components/HindiDubList";
import LeadForm from "@/components/LeadForm";
import { dbEnabled } from "@/lib/db";
import { animeBySlugs, posterUrl, type Anime } from "@/lib/kitsu";
import { cheapestKind } from "@/lib/hindistats";
import { itemList } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { filmFranchises, filmsPath } from "@/lib/franchisefilms";
import { dubDate, dubHref, hindiDubbed, platformFor, platformKind, type Dub } from "@/lib/hindidub";

export const revalidate = 86400;

/**
 * Anime films with an official Hindi dub. Google India, Nov 2026: "anime movies in hindi" 3.6K a month, plus
 * "animated hindi dubbed movie" 1.6K and "all anime hindi dubbed" 480. A film counts when every platform row is a
 * film; films that came with a series' Hindi dub (a Dragon Ball film, Spy x Family's CODE: White) are listed apart.
 */
const FILM = /\b(films?|movie)\b/i;
function films() {
  const all = hindiDubbed();
  const own = all.filter((d) => d.platforms.every((p) => FILM.test(p.scope)));
  const inSeries = all.filter((d) => !own.includes(d)).flatMap((d) => d.platforms.filter((p) => FILM.test(p.scope)).map((p) => ({ d, p })));
  return { own, inSeries };
}
const yearOf = (a: Anime | undefined) => (a?.startDate ? Number(a.startDate.slice(0, 4)) : null);
const services = (ds: Dub[]) => [...new Set(ds.flatMap((d) => d.platforms.map((p) => p.name)))];

export function generateMetadata(): Metadata {
  const { own } = films();
  const y = new Date().getFullYear();
  return {
    title: fitTitle([`Anime Movies in Hindi (${y}): ${own.length} Official Hindi Dubbed Films`, `Anime Movies in Hindi Dubbed (${y}): ${own.length} Films`, "Anime Movies in Hindi Dubbed"]),
    description: fitDescription(`All ${own.length} anime films with an official Hindi dub and where they stream in India: ${own.slice(0, 5).map((d) => d.t).join(", ")} and more, on ${services(own).join(" and ")}. Checked ${dubDate()}.`),
    alternates: { canonical: "/hindi-dub/movies" },
  };
}

/** Every anime film you can watch in Hindi legally, and the films that came with a series' Hindi dub. */
export default async function HindiDubMovies() {
  const { own, inSeries } = films();
  const kitsu = await animeBySlugs(own.map((d) => d.s), true);
  const cards: DubCard[] = own.map((d) => {
    const a = kitsu.get(d.s);
    return {
      s: d.s, t: d.t, href: dubHref(d), poster: a ? posterUrl(a, "small") : null, year: yearOf(a), cheapest: cheapestKind(d), checked: d.checked,
      platforms: d.platforms.map((x) => ({ name: x.name, scope: x.scope, url: x.url, kind: platformKind(x.name) })),
    };
  });
  const byService = services(own).map((name) => ({ name, n: own.filter((d) => d.platforms.some((p) => p.name === name)).length, page: platformFor(name) })).sort((a, b) => b.n - a.n);
  const ghibli = own.filter((d) => /spirited-away|howl|mononoke|totoro|kiki/.test(d.s));
  const shinkai = own.filter((d) => /kimi-no-na-wa|tenki-no-ko|suzume/.test(d.s));
  const faq = [
    { q: "Which anime movies are available in Hindi?", a: `${own.length} films have an official Hindi dub: ${own.map((d) => d.t).join(", ")}.${inSeries.length ? ` A few more came with a series' Hindi dub: ${inSeries.map(({ d, p }) => `${d.t} (${p.scope.replace(/\s*\(.*\)$/, "")})`).join("; ")}.` : ""}` },
    { q: "Where can I watch anime movies in Hindi?", a: `${byService.map((s) => `${s.name}: ${s.n} film${s.n === 1 ? "" : "s"}`).join("; ")}. Switch the audio to Hindi in the player.` },
    ...(ghibli.length ? [{ q: "Are Studio Ghibli movies available in Hindi?", a: `Yes, on Netflix India: ${ghibli.map((d) => d.t).join(", ")}.` }] : []),
    ...(shinkai.length ? [{ q: "Is Your Name available in Hindi?", a: `Yes. Makoto Shinkai's ${shinkai.map((d) => d.t).join(", ")} stream in Hindi on Crunchyroll India.` }] : []),
    { q: "Can I download anime movies in Hindi?", a: "Legally, only inside the streaming apps: Netflix, and Crunchyroll on its higher plans, let you save films to watch offline on your phone. Download sites that offer Hindi dubbed anime films aren't licensed, so AniLumi doesn't link to them." },
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={itemList("Anime movies in Hindi", own.map((d) => ({ url: dubHref(d), name: `${d.t} (Hindi dub)` })))} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/hindi-dub", label: "Hindi dubbed anime" }, { href: "/hindi-dub/movies", label: "Movies" }]}
        eyebrow="🇮🇳 Hindi dub"
        title={<>Anime movies in <span className="text-gradient">Hindi</span></>}
        subtitle="Every anime film with an official Hindi audio track, and where it streams in India. Official platforms only."
        facts={[
          { value: String(own.length), label: "films in Hindi" },
          { value: String(byService.length), label: byService.length === 1 ? "platform" : "platforms" },
          ...(byService[0] ? [{ value: String(byService[0].n), label: `on ${byService[0].name}` }] : []),
        ]}
        hue={25}
        posters={own.slice(0, 3).map((d) => { const a = kitsu.get(d.s); return a ? posterUrl(a, "medium") : null; })}
      />
      <MadeBy className="mt-4" method="Each film is confirmed on the platform's own title page or in the licensor's announcement; fan lists never count." />

      <SectionNav sections={[
        { id: "list", label: `All ${own.length}` },
        ...(inSeries.length ? [{ id: "series", label: "With a series" }] : []),
        { id: "where", label: "Where to watch" },
        { id: "faq", label: "FAQ" },
      ]} />

      <section id="list" data-section className="reveal pt-10" aria-labelledby="list-h">
        <h2 id="list-h" className="h-section mb-1">All {own.length} anime movies in Hindi</h2>
        <p className="mb-4 text-sm text-muted">Checked {dubDate()}. Each card links to where the Hindi dub is confirmed.</p>
        <HindiDubList items={cards} platforms={byService.map((s) => s.name)} />
        <p className="mt-4 flex flex-wrap items-center gap-2 text-sm"><span className="text-muted">Every film of a franchise, with its Hindi status:</span>{filmFranchises().map((f) => <Link key={f.slug} href={filmsPath(f.slug)} className="chip">{f.name} movies</Link>)}</p>
      </section>

      {inSeries.length > 0 && (
        <section id="series" data-section className="reveal pt-10" aria-labelledby="series-h">
          <h2 id="series-h" className="h-section mb-1">Films that came with a series&apos; Hindi dub</h2>
          <p className="mb-3 text-sm text-muted">Not on the list above because the Hindi dub is part of a series&apos; release.</p>
          <ul className="space-y-1.5 text-sm">
            {inSeries.map(({ d, p }) => (
              <li key={`${d.s}-${p.name}`}><Link href={dubHref(d)} className="font-medium text-ink hover:text-violet-2">{d.t}</Link><span className="text-muted"> · {p.scope} · {p.name}</span></li>
            ))}
          </ul>
        </section>
      )}

      <section id="where" data-section className="reveal pt-10" aria-labelledby="where-h">
        <h2 id="where-h" className="h-section mb-3">Where to watch anime movies in Hindi</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {byService.map((s) => (
            <li key={s.name} className="card p-4 text-sm">
              <p className="font-semibold text-ink">{s.page ? <Link href={`/hindi-dub/${s.page.slug}`} className="hover:text-violet-2">{s.name}</Link> : s.name}</p>
              <p className="mt-1 text-muted">{s.n} film{s.n === 1 ? "" : "s"} in Hindi: {own.filter((d) => d.platforms.some((p) => p.name === s.name)).map((d) => d.t).join(", ")}.</p>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-sm text-muted">Series too? See <Link href="/hindi-dub" className="text-violet hover:underline">every Hindi dubbed anime</Link>, or the ones <Link href="/new-dubs" className="text-violet hover:underline">new and coming soon</Link>.</p>
        {dbEnabled() && <LeadForm className="mt-6" kind="hindi" source="hindi-movies" title="🔔 Email me when an anime film gets a Hindi dub" blurb="One short email when an official Hindi dub is added, with where to watch it and whether it's free." />}
      </section>

      <JoinChannels source="hindi-movies" className="mt-8" />
      <div id="faq" data-section className="pt-2"><Faq title="Anime movies in Hindi: FAQ" items={faq} /></div>
    </div>
  );
}
