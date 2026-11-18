import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "@/components/Link";
import Image from "next/image";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import Faq, { type FaqItem } from "@/components/Faq";
import JoinChannels from "@/components/JoinChannels";
import AnswerLead from "@/components/AnswerLead";
import { getAnimeBySlug, animeBySlugs, animePath, posterUrl, buildWatchOrder } from "@/lib/kitsu";
import { dubShows, premiereAt } from "@/lib/dubschedule";
import { pricesFor as priceOf, cheapestPlan, PERIOD } from "@/lib/platformprices";
import { pageAbout } from "@/lib/ld";
import { fitTitle, fitDescription } from "@/lib/titles";
import { DUB_CHECKED, HINDI_PARTS, dubDate, dubHref, dubPageEntry, dubsOn, hindiDubPath, hindiDubbed, platformFor, platformKind, type Dub, type PlatformKind } from "@/lib/hindidub";
import { pricesFor, startingAt } from "@/lib/platformprices";
import { hindiCast } from "@/lib/hindistats";
import { LANG, regionalFor } from "@/lib/regionaldub";
import { hindiIndexed, hindiPath } from "@/lib/hindi";
import { hindiDubIndexed, robotsFor } from "@/lib/indexing";
import { streamsBySlug, streamsPath } from "@/lib/streams";
import { WATCH_ORDER_OVERRIDES } from "@/data/watch-orders";

export const revalidate = 86400;
export async function generateStaticParams() { return []; }
type Props = { params: Promise<{ slug: string }> };

/** Every anime with an official Hindi dub on record (data/hindi-dubs.json) has this page; others 404. */
function load(slug: string): Dub {
  const d = dubPageEntry(decodeURIComponent(slug));
  if (!d) notFound();
  return d;
}

const KIND_TAG: Record<PlatformKind, string> = { free: "Free", subscription: "Paid", tv: "TV channel" };
const join = (xs: string[]) => (xs.length <= 1 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
const names = (d: Dub) => [...new Set(d.platforms.map((p) => p.name))];
const checkedOn = (d: Dub) => dubDate("en", d.checked ?? DUB_CHECKED);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = load((await params).slug);
  const y = new Date().getFullYear();
  const free = d.platforms.some((p) => platformKind(p.name) === "free");
  return {
    title: fitTitle([...(HINDI_PARTS[d.s] ? [`${HINDI_PARTS[d.s].title} in Hindi: Where to Watch (${y})`] : []), `${d.t} in Hindi: Where to Watch the Hindi Dub (${y})`, `${d.t} in Hindi: Where to Watch (${y})`, `${d.t} Hindi Dub: Where to Watch`, `${d.t} in Hindi`]),
    description: fitDescription(`${d.t} has an official Hindi dub on ${join(names(d).slice(0, 3))}${free ? ", including a free, legal option" : ""}. Which seasons are in Hindi, what it costs, how to switch the audio, and Tamil and Telugu dubs. Checked ${checkedOn(d)}.`),
    alternates: { canonical: hindiDubPath(d.s) },
    robots: robotsFor(hindiDubIndexed(d.s)),
  };
}

/** One anime's official Hindi dub: where it streams, which seasons, free or paid, the cost, the Hindi cast. */
export default async function HindiDubPage({ params }: Props) {
  const d = load((await params).slug);
  const a = await getAnimeBySlug(d.s).catch(() => null);
  const anime = { id: a?.id ?? "", slug: d.s };
  const rows = d.platforms.map((p) => {
    const plat = platformFor(p.name);
    const price = plat ? pricesFor(plat.slug) : null;
    return { ...p, kind: platformKind(p.name), plat, price: price ? (price.free ? "Free with ads" : startingAt(price)) : null };
  });
  const free = rows.filter((r) => r.kind === "free");
  const paid = rows.filter((r) => r.kind === "subscription");
  const cast = hindiCast(d.s);
  const regional = (["ta", "te"] as const).flatMap((l) => { const x = regionalFor(anime, l); return x ? [{ l, x }] : []; });
  const guide = hindiIndexed(d.s) ? hindiPath(d.s) : null;
  const order = WATCH_ORDER_OVERRIDES[d.s] ? `/watch-order/${d.s}` : null;
  const streams = streamsBySlug(d.s) ? streamsPath(d.s) : null;
  // More Hindi dubs on the same main platform, most-watched first: the next thing people look for.
  const main = rows.find((r) => r.plat)?.plat ?? null;
  const more = (main ? dubsOn(main).map((x) => x.d) : hindiDubbed()).filter((x) => x.s !== d.s).slice(0, 8);
  const kitsu = await animeBySlugs(more.map((x) => x.s), true).catch(() => new Map());
  const poster = a ? posterUrl(a, "medium") : null;
  // At a glance, from data no other "X in Hindi" page puts together: where the story starts, how long the whole thing
  // is (the watch order, Kitsu runtimes), when the Hindi dub started (the dub schedule) and the cheapest legal way in.
  const wo = a && a.subtype !== "movie" ? await buildWatchOrder(a).catch(() => null) : null;
  const core = wo ? wo.entries.filter((e) => e.kind === "main") : [];
  const films = wo ? wo.entries.filter((e) => e.kind === "movie").length : 0;
  // Where to start, only when the order begins with a series: Kitsu roots Doraemon at a 1995 short film.
  const start = core[0] && ["TV", "ONA"].includes(core[0].anime.subtype) ? core[0].anime : null;
  const hours = wo && wo.totalMinutes ? Math.round(wo.totalMinutes / 60) : null;
  const started = dubShows().filter((e) => e.lang === "hi" && e.slug === d.s && e.premiere).sort((x, y) => premiereAt(x) - premiereAt(y))[0] ?? null;
  // The lowest monthly plan ("from ₹99 a month"), as people compare; an annual plan only when there's no monthly one.
  const lowest = (pr: NonNullable<ReturnType<typeof priceOf>>) => [...pr.plans].filter((x) => x.period === "month").sort((x, y) => x.price - y.price)[0] ?? cheapestPlan(pr);
  const paidFrom = paid.flatMap((r) => { const pr = r.plat ? priceOf(r.plat.slug) : null; const c = pr ? lowest(pr) : null; return c ? [{ name: r.name, c }] : []; }).sort((x, y) => x.c.price - y.c.price)[0] ?? null;
  const tvOnly = rows.filter((r) => r.kind === "tv");
  const cheapestWay = free.length ? `Free on ${[...new Set(free.map((r) => r.name))].join(" and ")}` : paidFrom ? `${paidFrom.name}, from ₹${paidFrom.c.price} a ${PERIOD[paidFrom.c.period]}` : tvOnly.length ? `On TV (${[...new Set(tvOnly.map((r) => r.name))].join(", ")}), in DTH and cable packs` : null;
  const fmtDay = (iso: string) => new Date(/T/.test(iso) ? iso : `${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
  const glance = [
    start && core.length > 1 ? { k: "Start with", v: <><Link href={animePath(start)} className="text-violet hover:underline">{start.titleEn || start.title}</Link>{start.startDate ? ` (${start.startDate.slice(0, 4)})` : ""}</> } : null,
    wo && core.length > 1 ? { k: "The whole story", v: <>{core.length} {core.length === 1 ? "part" : "parts"}{films ? ` + ${films} film${films === 1 ? "" : "s"}` : ""}{hours ? `, about ${hours.toLocaleString("en-IN")} hours (${Math.ceil(hours / 2)} days at 2 hours a day)` : ""}</> } : null,
    wo && core.length === 1 && a?.subtype !== "movie" && (a?.episodeCount || hours) ? { k: "The whole series", v: <>{a?.episodeCount ? `${a.episodeCount.toLocaleString("en-IN")} episodes` : ""}{a?.episodeCount && hours ? ", " : ""}{hours ? `about ${hours.toLocaleString("en-IN")} hours` : ""}{a?.status === "current" ? " so far" : ""}</> } : null,
    a?.subtype === "movie" && a.episodeLength ? { k: "Running time", v: <>{Math.floor(a.episodeLength / 60)}h {a.episodeLength % 60}m</> } : null,
    started ? { k: "Hindi dub started", v: <>{fmtDay(started.premiere!)} on {started.service}</> } : null,
    cheapestWay ? { k: "Cheapest legal way", v: <>{cheapestWay}</> } : null,
  ].filter((x): x is { k: string; v: React.ReactElement } => Boolean(x));
  // The answer first, in one line: platform (with the first clause of its scope), then the cheapest legal way in.
  const shortScope = (x: string) => { const c = (x.split(";")[0].split("(")[0].trim() || x.split(";")[0]).trim(); return c.length > 60 ? `${c.slice(0, 57).replace(/[\s,(]+\S*$/, "")}…` : c; };
  const byPlatform = [...new Map(rows.map((r) => [r.name, r])).values()];
  const answer = `Yes. ${d.t} has an official Hindi dub on ${join(byPlatform.map((r) => (r.scope ? `${r.name} (${shortScope(r.scope)})` : r.name)))}.${cheapestWay ? ` Cheapest legal way: ${/^(Free|On TV)/.test(cheapestWay) ? cheapestWay.charAt(0).toLowerCase() + cheapestWay.slice(1) : cheapestWay}.` : ""}`;

  const faq: FaqItem[] = [
    { q: `Is ${d.t} dubbed in Hindi?`, a: `Yes. ${d.t} has an official Hindi dub on ${join(names(d))}. ${rows.map((r) => `${r.name}: ${r.scope || "available"}`).join("; ")}.` },
    ...(HINDI_PARTS[d.s] ? [{ q: HINDI_PARTS[d.s].q, a: HINDI_PARTS[d.s].a }] : []),
    { q: `Where can I watch ${d.t} in Hindi for free?`, a: free.length ? `Legally, on ${join([...new Set(free.map((r) => r.name))])}, free with ads (${free.map((r) => r.scope).filter(Boolean).join("; ")}).` : `There's no free, legal option on record: the Hindi dub is on ${join([...new Set(paid.concat(rows.filter((r) => r.kind === "tv")).map((r) => r.name))])}. Sites offering it free are unlicensed uploads.` },
    ...(paid.length ? [{ q: `How much does it cost to watch ${d.t} in Hindi?`, a: paid.map((r) => `${r.name}: ${r.price ?? "see the service for current prices"}`).join("; ") + "." }] : []),
    ...rows.filter((r) => r.plat).slice(0, 2).map((r) => ({ q: `How do I switch ${d.t} to Hindi on ${r.plat!.label.replace(/ \(.*\)$/, "")}?`, a: r.plat!.how })),
    ...(start && core.length > 1 ? [{ q: `Where should I start ${d.t} in Hindi?`, a: `With ${start.titleEn || start.title}${start.startDate ? ` (${start.startDate.slice(0, 4)})` : ""}, then follow the watch order: ${core.length} parts${films ? ` and ${films} film${films === 1 ? "" : "s"}` : ""}. Check the platform list above for which of them have the Hindi audio.` }] : []),
    ...(hours && core.length > 1 ? [{ q: `How long does it take to watch ${d.t}?`, a: `About ${hours.toLocaleString("en-IN")} hours for the main story${films ? " and films" : ""}, or ${Math.ceil(hours / 2)} days at 2 hours a day.` }] : []),
    ...(regional.length ? [{ q: `Is ${d.t} available in Tamil or Telugu?`, a: regional.map(({ l, x }) => `${LANG[l].name}: ${join([...new Set(x.platforms.map((p) => p.name))])}`).join(". ") + "." }] : []),
    ...(cast.length ? [{ q: `Who voices ${cast[0].character} in the Hindi dub of ${d.t}?`, a: `${cast[0].artist}${cast[0].dub ? ` (${cast[0].dub})` : ""}.${cast.length > 1 ? ` The Hindi cast also includes ${cast.slice(1, 4).map((c) => `${c.artist} as ${c.character}`).join(", ")}.` : ""}` }] : []),
  ];

  return (
    <div className="container-x pb-8">
      {a && <JsonLd data={pageAbout(a, hindiDubPath(d.s), `${d.t} in Hindi`)} />}
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/hindi-dub", label: "Hindi dubbed anime" }, { href: hindiDubPath(d.s), label: d.t }]}
        eyebrow="🇮🇳 Hindi dub"
        title={<><span className="text-gradient">{d.t}</span> in Hindi</>}
        subtitle={`Where to watch the official Hindi dub of ${d.t}: which service, which seasons have Hindi audio, free or paid, and how to switch the audio on.`}
        facts={[
          { value: String(new Set(names(d)).size), label: names(d).length === 1 ? "platform" : "platforms" },
          { value: free.length ? "Yes" : "No", label: "free option" },
          ...(regional.length ? [{ value: regional.map(({ l }) => LANG[l].name).join(" + "), label: "also dubbed" }] : []),
        ]}
        hue={25}
        posters={poster ? [poster] : []}
      />

      <AnswerLead checked={checkedOn(d)}>{answer}</AnswerLead>

      {glance.length > 0 && (
        <section className="reveal mt-10" aria-labelledby="glance-h">
          <h2 id="glance-h" className="h-section mb-3">{d.t} in Hindi at a glance</h2>
          <dl className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {glance.map((g) => <div key={g.k} className="card p-4"><dt className="text-xs uppercase tracking-wide text-muted">{g.k}</dt><dd className="mt-1 text-sm font-medium text-ink">{g.v}</dd></div>)}
          </dl>
          {wo && core.length > 1 && <p className="mt-3 text-sm"><Link href={`/watch-order/${d.s}`} className="text-violet hover:underline">Full {d.t} watch order →</Link> · <Link href={`${animePath({ slug: d.s })}/how-long-to-watch`} className="text-violet hover:underline">How long to watch →</Link></p>}
        </section>
      )}

      <section className="reveal mt-10" aria-labelledby="where-h">
        <h2 id="where-h" className="h-section mb-3">Where to watch {d.t} in Hindi</h2>
        <ul className="grid gap-3 md:grid-cols-2">
          {rows.map((r) => (
            <li key={`${r.name}-${r.scope}`} className="card p-4">
              <div className="flex items-baseline justify-between gap-3">
                <h3 className="font-semibold text-ink">{r.plat ? <Link href={`/hindi-dub/${r.plat.slug}`} className="hover:text-violet-2">{r.name}</Link> : r.name}</h3>
                <span className={`shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold ${r.kind === "free" ? "bg-emerald-500/15 text-emerald-300" : "border border-line text-muted"}`}>{KIND_TAG[r.kind]}</span>
              </div>
              {r.scope && <p className="mt-1 text-sm text-ink/85">{r.scope}</p>}
              {r.price && <p className="mt-1 text-xs text-muted">{r.price}</p>}
              {r.plat && <p className="mt-2 text-xs leading-5 text-muted"><span className="font-medium text-ink/80">How to get Hindi audio:</span> {r.plat.how}</p>}
              {/^https:\/\//.test(r.url) && <a href={r.url} target="_blank" rel="noopener nofollow" className="mt-2 inline-block text-xs text-violet hover:underline">Where we confirmed it ↗</a>}
            </li>
          ))}
        </ul>
        {d.note && <p className="mt-4 max-w-3xl text-sm text-ink/85">{d.note}</p>}
        <p className="mt-3 text-xs text-muted">Checked {checkedOn(d)} against the platforms&rsquo; own pages and Indian anime news. Catalogues change, so check the service before you subscribe. <Link href="/how-we-check" className="underline">How we check</Link></p>
        <JoinChannels source="hindi-dub-page" className="mt-5" />
      </section>

      {cast.length > 0 && (
        <section className="reveal mt-10" aria-labelledby="cast-h">
          <h2 id="cast-h" className="h-section mb-3">{d.t} Hindi voice cast</h2>
          <ul className="grid gap-x-6 gap-y-1.5 text-sm sm:grid-cols-2">
            {cast.slice(0, 16).map((c) => (
              <li key={`${c.artist}-${c.character}`} className="flex items-baseline justify-between gap-3 border-b border-line/50 py-1.5">
                <span className="truncate text-muted">{c.characterHref ? <Link href={c.characterHref} className="hover:text-violet-2">{c.character}</Link> : c.character}</span>
                <Link href={c.artistHref} className="shrink-0 font-medium text-ink hover:text-violet-2">{c.artist}</Link>
              </li>
            ))}
          </ul>
        </section>
      )}

      {regional.length > 0 && (
        <section className="reveal mt-10" aria-labelledby="reg-h">
          <h2 id="reg-h" className="h-section mb-3">{d.t} in Tamil and Telugu</h2>
          <ul className="grid gap-3 md:grid-cols-2">
            {regional.map(({ l, x }) => (
              <li key={l} className="card p-4 text-sm">
                <p className="font-semibold text-ink"><Link href={LANG[l].path} className="hover:text-violet-2">{LANG[l].name} dub</Link></p>
                <p className="mt-1 text-ink/85">{x.platforms.map((p) => `${p.name}${p.scope ? ` (${p.scope})` : ""}`).join("; ")}</p>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="reveal mt-10" aria-labelledby="next-h">
        <h2 id="next-h" className="h-section mb-3">Before you start</h2>
        <div className="flex flex-wrap gap-2 text-sm">
          {order && <Link href={order} className="chip">📺 {d.t} watch order</Link>}
          {guide && <Link href={guide} className="chip" hrefLang="hi">🇮🇳 हिंदी में गाइड</Link>}
          {streams && <Link href={streams} className="chip">▶ All streaming options (sub, English dub)</Link>}
          {a && <Link href={animePath(a)} className="chip">About {d.t}</Link>}
          <Link href="/anime-streaming-sites" className="chip">Anime streaming sites in India</Link>
          <Link href="/anime-salt-alternatives" className="chip">Anime Salt alternatives</Link>
        </div>
      </section>

      {more.length > 0 && (
        <section className="reveal mt-10" aria-labelledby="more-h">
          <h2 id="more-h" className="h-section mb-3">More anime in Hindi{main ? ` on ${main.label.replace(/ \(.*\)$/, "")}` : ""}</h2>
          <ul className="grid grid-cols-4 gap-3 sm:grid-cols-8">
            {more.map((x) => {
              const k = kitsu.get(x.s);
              const src = k ? posterUrl(k, "small") : null;
              return (
                <li key={x.s} className="min-w-0">
                  <Link href={dubHref(x)} className="group block">
                    <span className="relative block aspect-[5/7] overflow-hidden rounded-xl border border-line bg-bg-2">{src && <Image src={src} alt={`${x.t} poster`} fill sizes="(max-width:640px) 25vw, 120px" className="object-cover transition duration-500 group-hover:scale-105" />}</span>
                    <span className="mt-1.5 line-clamp-2 text-xs font-semibold leading-snug text-ink group-hover:text-violet-2">{x.t}</span>
                  </Link>
                </li>
              );
            })}
          </ul>
          <p className="mt-4 text-sm"><Link href="/hindi-dub" className="text-violet hover:underline">All Hindi dubbed anime →</Link></p>
        </section>
      )}

      <Faq title={`${d.t} in Hindi: FAQ`} items={faq} />
    </div>
  );
}
