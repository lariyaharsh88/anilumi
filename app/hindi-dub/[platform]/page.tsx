import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import Image from "next/image";
import { animeBySlugs, animePath, posterUrl, type Anime } from "@/lib/kitsu";
import SectionNav from "@/components/fx/SectionNav";
import StatTiles from "@/components/viz/StatTiles";
import BarChart from "@/components/viz/BarChart";
import HindiDubList, { type DubCard } from "@/components/HindiDubList";
import { cheapestKind, genreCounts, eraCounts, hindiArrivals } from "@/lib/hindistats";
import { pricesFor, cheapestPlan, startingAt, PERIOD, PRICES_CHECKED } from "@/lib/platformprices";
import { itemList } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { HINDI_PLATFORMS, dubDate, dubHref, dubsOn, hindiDubbed, hindiPlatform, platformKind } from "@/lib/hindidub";

export const revalidate = 86400;
const fmtDay = (iso: string | null) => (iso ? new Date(/T/.test(iso) ? iso : `${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" }) : "");
const yearOf = (a: Anime | undefined) => (a?.startDate ? Number(a.startDate.slice(0, 4)) : null);
// Rendered on first request like the rest of the site: build-time pages with dynamicParams = false 404 on the
// Cloudflare build (OpenNext). Unknown values still 404 through load().
export async function generateStaticParams() { return []; }
type Props = { params: Promise<{ platform: string }> };

function load(slug: string) {
  const p = hindiPlatform(slug);
  if (!p) notFound();
  const list = dubsOn(p);
  if (!list.length) notFound();
  return { p, list };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { p, list } = load((await params).platform);
  const y = new Date().getFullYear();
  const name = p.label.replace(/ \(.*\)$/, "");
  return {
    // Free platforms lead with "free": what people search ("anime in hindi free on youtube").
    title: fitTitle(platformKind(list[0].rows[0].name) === "free"
      ? [`Watch Anime in Hindi Free on ${name} (${y}): ${list.length} Anime`, `Free Hindi Dubbed Anime on ${name} (${y}): ${list.length}`, `Free Hindi Dubbed Anime on ${name}`]
      : [`${name} Hindi Dubbed Anime List (${y}): ${list.length} Anime`, `${name} Hindi Dubbed Anime (${y}): ${list.length} Anime`, `${name} Hindi Dubbed Anime`]),
    description: fitDescription(`All ${list.length} anime with an official Hindi dub on ${p.label}, most-watched first: ${list.slice(0, 6).map((x) => x.d.t).join(", ")} and more, with which seasons have Hindi audio. Checked ${dubDate()}.`),
    alternates: { canonical: `/hindi-dub/${p.slug}` },
  };
}

/** Every anime a platform carries with Hindi audio, and how to switch the audio on. */
export default async function HindiPlatformPage({ params }: Props) {
  const { p, list } = load((await params).platform);
  const price = pricesFor(p.slug);
  const cheapest = price ? cheapestPlan(price) : null;
  const checkedOn = new Date(`${PRICES_CHECKED}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const fresh = hindiArrivals(120).filter((e) => p.match.test(e.service));
  const kitsu = await animeBySlugs([...list.map((x) => x.d.s), ...fresh.flatMap((e) => (e.slug ? [e.slug] : []))], true);
  const posters = list.slice(0, 3).map((x) => { const a = kitsu.get(x.d.s); return a ? posterUrl(a, "medium") : null; });
  const total = hindiDubbed().length;
  const genres = genreCounts(list.flatMap((x) => { const a = kitsu.get(x.d.s); return a ? [a.categories.map((c) => c.title)] : []; }), 6);
  const years = list.map((x) => yearOf(kitsu.get(x.d.s)));
  const eras = eraCounts(years);
  const known = years.filter((y): y is number => y != null);
  const alsoFree = list.filter((x) => platformKind(x.rows[0].name) !== "free" && cheapestKind(x.d) === "free");
  const cards: DubCard[] = list.map(({ d }) => ({
    s: d.s, t: d.t, href: dubHref(d), poster: (() => { const a = kitsu.get(d.s); return a ? posterUrl(a, "small") : null; })(), year: yearOf(kitsu.get(d.s)), cheapest: cheapestKind(d),
    platforms: d.platforms.map((x) => ({ name: x.name, scope: x.scope, url: x.url, kind: platformKind(x.name) })),
  }));
  const others = HINDI_PLATFORMS.filter((x) => x.slug !== p.slug).map((x) => ({ x, n: dubsOn(x).length })).filter((o) => o.n);
  const kind = platformKind(list[0].rows[0].name);
  const faq = [
    { q: `Which anime are in Hindi on ${p.label}?`, a: `${list.length} on our list: ${list.map((x) => x.d.t).join(", ")}.` },
    { q: `How do I watch anime in Hindi on ${p.label}?`, a: p.how },
    ...(price ? [{ q: `How much does ${p.label} cost in India?`, a: price.free ? `Nothing: it's free with ads.${cheapest ? ` An optional ad-free plan costs ₹${cheapest.price.toLocaleString("en-IN")} a ${PERIOD[cheapest.period]}.` : ""} (Checked ${checkedOn}.)` : cheapest ? `${startingAt(price)}; the best value is ${cheapest.name} at ₹${cheapest.price.toLocaleString("en-IN")} a ${PERIOD[cheapest.period]}. ${price.hindiNote ?? ""} (Checked ${checkedOn}; prices change, so confirm before you subscribe.)` : `${price.hindiNote ?? price.notes ?? ""}` }] : []),
    ...(fresh.length ? [{ q: `What's new in Hindi on ${p.label}?`, a: `${fresh.slice(0, 6).map((e) => `${e.t} (from ${fmtDay(e.premiere)})`).join(", ")}.` }] : []),
    { q: `Is ${p.label} free?`, a: kind === "free" ? "Yes. These are official uploads by the licensors, free with ads." : kind === "tv" ? "It is a TV channel, included in cable and DTH packs that carry it." : "No, it needs a subscription. For free and legal Hindi dubs, see the YouTube channels and MX Player on the main Hindi dub list." },
  ];

  return (
    <div className="container-x pb-8">
      <JsonLd data={itemList(`Hindi dubbed anime on ${p.label}`, list.map((x) => ({ url: dubHref(x.d), name: `${x.d.t} (Hindi dub)` })))} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/hindi-dub", label: "Hindi dubbed anime" }, { href: `/hindi-dub/${p.slug}`, label: p.label }]}
        eyebrow="🇮🇳 Hindi dub"
        title={<>Hindi dubbed anime on <span className="text-gradient">{p.label}</span></>}
        subtitle={`Every anime ${p.label} streams with an official Hindi audio track, most-watched first, with the seasons that have Hindi.`}
        facts={[
          { value: String(list.length), label: "anime in Hindi" },
          { value: `${Math.round((list.length / total) * 100)}%`, label: "of all Hindi dubs" },
          { value: kind === "free" ? "Free" : kind === "tv" ? "TV" : "Paid", label: kind === "free" ? "with ads" : kind === "tv" ? "channel" : "subscription" },
        ]}
        hue={25}
        posters={posters}
      />

      <SectionNav sections={[
        { id: "how", label: kind === "subscription" ? "How to switch" : "How to watch" },
        { id: "numbers", label: "In numbers" },
        ...(fresh.length ? [{ id: "new", label: "New" }] : []),
        { id: "list", label: `All ${list.length}` },
        ...(alsoFree.length ? [{ id: "also-free", label: "Also free" }] : []),
        ...(price ? [{ id: "price", label: "Price" }] : []),
        { id: "faq", label: "FAQ" },
      ]} />

      <section id="how" data-section className="reveal pt-10" aria-labelledby="how-h">
        <h2 id="how-h" className="h-section mb-3">{kind === "subscription" ? `How to switch to Hindi on ${p.label}` : `How to watch anime in Hindi on ${p.label}`}</h2>
        <p className="card p-4 text-sm leading-6 text-ink/90">{p.how}</p>
      </section>

      <section id="numbers" data-section className="reveal pt-10" aria-labelledby="num-h">
        <h2 id="num-h" className="h-section mb-1">{p.label} Hindi dubs in numbers</h2>
        <p className="mb-4 max-w-3xl text-sm text-muted">{p.label} carries {list.length} of the {total} Hindi dubbed anime on our list ({Math.round((list.length / total) * 100)}%){genres[0] ? `, mostly ${genres.slice(0, 2).map((g) => g.label.toLowerCase()).join(" and ")}` : ""}{known.length ? `, first aired between ${Math.min(...known)} and ${Math.max(...known)}` : ""}.</p>
        <StatTiles stats={[
          { label: "Anime in Hindi", value: String(list.length), sub: `of ${total} on all platforms` },
          { label: "New in the last 4 months", value: String(fresh.length), sub: "Hindi dubs started" },
          { label: "Top genre", value: genres[0]?.label ?? "–", sub: genres[0] ? `${genres[0].value} anime` : "", still: true },
          { label: "Newest series from", value: known.length ? String(Math.max(...known)) : "–", sub: known.length ? `oldest from ${Math.min(...known)}` : "", still: true },
        ]} />
        {list.length >= 5 && (
          <div className="mt-4 grid gap-4 lg:grid-cols-2">
            {genres.length > 1 && <BarChart orientation="bar" integer title={`Hindi dubs on ${p.label} by genre`} subtitle="An anime can have several genres" valueHeading="Anime" data={genres.map((g) => ({ key: g.label, label: g.label, value: g.value, display: `${g.value} anime` }))} highlightKey={genres[0].label} />}
            <BarChart integer title="When they first aired" subtitle={`Series on ${p.label} with a Hindi dub, by decade`} valueHeading="Anime" data={eras.map((e) => ({ key: e.label, label: e.label, value: e.value, display: `${e.value} anime` }))} labelKeys={eras.map((e) => e.label)} height={170} />
          </div>
        )}
      </section>

      {fresh.length > 0 && (
        <section id="new" data-section className="reveal pt-10" aria-labelledby="new-h">
          <h2 id="new-h" className="h-section mb-1">New in Hindi on {p.label}</h2>
          <p className="mb-4 text-sm text-muted">Hindi dubs that started on {p.label} in the last four months, newest first.</p>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-8">
            {fresh.slice(0, 16).map((e) => {
              const a = e.slug ? kitsu.get(e.slug) : undefined;
              return (
                <li key={`${e.t}-${e.premiere}`} className="min-w-0">
                  <Link href={e.slug ? animePath({ slug: e.slug }) : "/dub-schedule#hindi"} className="group block">
                    <span className="relative block aspect-[5/7] overflow-hidden rounded-xl border border-line bg-bg-2">
                      {a && posterUrl(a, "small") && <Image src={posterUrl(a, "small")!} alt={`${e.t} poster`} fill sizes="(max-width:640px) 30vw, 160px" className="object-cover transition duration-500 group-hover:scale-105" />}
                      <span className="absolute left-1.5 top-1.5 rounded-full bg-black/70 px-1.5 py-0.5 text-[10px] font-bold text-white">{fmtDay(e.premiere)}</span>
                    </span>
                    <span className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug text-ink group-hover:text-violet-2">{e.t}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section id="list" data-section className="reveal pt-10" aria-labelledby="list-h">
        <h2 id="list-h" className="h-section mb-1">All {list.length} anime in Hindi on {p.label}</h2>
        <p className="mb-4 text-sm text-muted">Checked {dubDate()} against {p.label}&apos;s own pages and Indian anime news. Most-watched first; each row links to the page that confirms it.</p>
        <HindiDubList items={cards} platforms={[...new Set(cards.flatMap((c) => c.platforms.map((x) => x.name)))]} />
      </section>

      {alsoFree.length > 0 && (
        <section id="also-free" data-section className="reveal pt-10" aria-labelledby="free-h">
          <h2 id="free-h" className="h-section mb-1">Also free elsewhere</h2>
          <p className="mb-4 text-sm text-muted">These {alsoFree.length} {p.label} Hindi dubs also stream free and legally, on YouTube or MX Player.</p>
          <ul className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2 lg:grid-cols-3">
            {alsoFree.map(({ d }) => (
              <li key={d.s} className="min-w-0 truncate">
                <Link href={dubHref(d)} className="font-medium text-ink hover:text-violet-2">{d.t}</Link>
                <span className="text-muted"> · {d.platforms.filter((x) => platformKind(x.name) === "free").map((x) => x.name.replace(/ \(YouTube\)$/, "")).join(", ")}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {price && (
        <section id="price" data-section className="reveal pt-10" aria-labelledby="price-h">
          <h2 id="price-h" className="h-section mb-1">{p.label}: plans and price in India</h2>
          <p className="mb-3 max-w-3xl text-sm text-muted">{price.free ? "" : price.plans.length ? `${startingAt(price)}. ` : "Included in DTH and cable packs that carry the channel. "}{price.hindiNote}</p>
          {price.plans.length > 0 && (
            <div className="card overflow-x-auto p-0">
              <table className="w-full min-w-[480px] border-collapse text-sm">
                <thead>
                  <tr className="text-left text-xs uppercase tracking-wide text-muted">
                    <th scope="col" className="px-3 py-2">Plan</th><th scope="col" className="px-3 py-2">Price</th><th scope="col" className="px-3 py-2">Ads</th><th scope="col" className="px-3 py-2">Quality</th>
                  </tr>
                </thead>
                <tbody>
                  {price.plans.map((x) => (
                    <tr key={`${x.name}-${x.period}`} className="border-t border-line/60">
                      <td className="px-3 py-2 font-medium text-ink">{x.name}{x === cheapest && !price.free ? <span className="ml-2 rounded bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">Cheapest</span> : null}</td>
                      <td className="whitespace-nowrap px-3 py-2 tabular-nums text-ink">₹{x.price.toLocaleString("en-IN")} <span className="text-muted">/ {PERIOD[x.period]}</span></td>
                      <td className="px-3 py-2 text-ink/90">{x.ads ? "With ads" : "No ads"}</td>
                      <td className="px-3 py-2 text-ink/90">{x.quality ?? "–"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          <p className="mt-2 text-xs text-muted">
            Checked {checkedOn} against {price.sources.length > 1 ? `${price.sources.length} sources` : "the platform's own page"}, including{" "}
            {price.sources.slice(0, 2).map((u, i) => <span key={u}>{i ? " and " : ""}<a href={u} target="_blank" rel="noopener nofollow" className="underline">{new URL(u).hostname.replace(/^www\./, "")}</a></span>)}.
            {price.confidence === "medium" ? " Some prices differ between the app and the website." : ""} Prices change and taxes may apply; confirm on {p.label} before you subscribe.
          </p>
        </section>
      )}

      <nav className="mt-10 text-sm" aria-label="Other platforms">
        <p className="mb-2 text-muted">Hindi dubs on other platforms</p>
        <ul className="flex flex-wrap gap-2">
          {others.map(({ x, n }) => <li key={x.slug}><Link href={`/hindi-dub/${x.slug}`} className="chip">{x.label} ({n})</Link></li>)}
          <li><Link href="/hindi-dub" className="chip">All Hindi dubbed anime</Link></li>
        </ul>
      </nav>

      <div id="faq" data-section className="pt-2"><Faq title={`${p.label}: Hindi dub FAQ`} items={faq} /></div>
    </div>
  );
}
