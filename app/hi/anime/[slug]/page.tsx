import { fitDescription } from "@/lib/titles";
import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "@/components/Link";
import { getAnimeBySlug, buildWatchOrder, franchiseName, animePath, posterUrl, runtimeMinutes, getStreamingFor, aniListNextEpisodes, airingNotice, type WatchEntry } from "@/lib/kitsu";
import { getAniListSequel } from "@/lib/anilist";
import { fillerFor } from "@/lib/filler";
import { KIND_HI, hiDuration, hiDays, hiDate, hiExpected, hiCount, hasHindi, hindiIndexed, hindiPath } from "@/lib/hindi";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import { pageAbout, itemList } from "@/lib/ld";
import Faq, { type FaqItem } from "@/components/Faq";
import AdSlot from "@/components/AdSlot";
import BingePlan from "@/components/BingePlan";
import HindiDub from "@/components/HindiDub";
import { dubFor, dubFaq } from "@/lib/hindidub";
import { safeUrl, servicesIn, streamsFor, streamsPath, type Service } from "@/lib/streams";
import EditorWatched from "@/components/EditorWatched";
import { streamCoverage, oneLinkPerSite } from "@/lib/wostreams";
import { streamLink, affiliateRel } from "@/lib/affiliate";
import { adaptationFor, type Adaptation } from "@/lib/mangaseasons";
import { arcsFor, type Arc } from "@/lib/arcs";

/** Hindi wording for the new sections (arcs, source material). */
const hiArcRange = (x: Arc) => (x.to === null ? `${x.from} से आगे` : x.from === x.to ? String(x.from) : `${x.from}–${x.to}`);
const hiSource = (x: Adaptation) => (x.unit === "chapter" ? "मंगा के चैप्टर" : "लाइट नॉवेल के वॉल्यूम");
const hiShortRange = (x: Adaptation) => `${x.unit === "chapter" ? "चै." : "वॉ."} ${x.from === x.to ? x.from : `${x.from}–${x.to}`}`;

export const revalidate = 86400;
export async function generateStaticParams() { return []; }
type Props = { params: Promise<{ slug: string }> };

/**
 * Hindi guide for one franchise: watch order, total time, filler and next season, from the same data as the
 * English watch-order, how-long and next-season pages. Searches look like "naruto watch order in hindi",
 * "naruto kitne episode", "demon slayer season 5 kab aayega".
 */
async function load(raw: string) {
  const slug = decodeURIComponent(raw);
  if (!hasHindi(slug)) notFound();
  const a = await getAnimeBySlug(slug);
  if (!a) notFound();
  const wo = await buildWatchOrder(a);
  const name = franchiseName(wo);
  const ordered = wo.entries.filter((e) => e.kind !== "recap" && e.kind !== "alt");
  const mains = ordered.filter((e) => e.kind === "main");
  const movies = ordered.filter((e) => e.kind === "movie");
  const extras = ordered.filter((e) => e.kind === "side" || e.kind === "spinoff");
  const skippable = wo.entries.filter((e) => e.kind === "recap" || e.kind === "alt");
  // Next season: an announced entry in the chain first, else AniList's sequel of the latest released part.
  const released = mains.filter((e) => e.anime.status === "finished" || e.anime.status === "current");
  const latest = (released.length ? released : mains)[Math.max(0, (released.length ? released : mains).length - 1)]?.anime ?? a;
  // Announced = the main story first, then a film; spin-offs and side stories don't answer "next season".
  const upcoming = (e: WatchEntry) => ["upcoming", "unreleased", "tba"].includes(e.anime.status);
  const announced = (wo.entries.find((e) => e.kind === "main" && upcoming(e)) ?? wo.entries.find((e) => e.kind === "movie" && upcoming(e)))?.anime ?? null;
  const al = announced ? null : await getAniListSequel(latest.id).catch(() => null);
  const filler = fillerFor(slug, a.episodeCount ?? null);
  // An airing show can be on a break (One Piece until January): AniList's next air time, from the airing snapshot.
  const next = latest.status === "current" ? (await aniListNextEpisodes([latest.id]).catch(() => new Map())).get(latest.id) ?? null : null;
  const notice = latest.status === "current" ? airingNotice(latest.nextRelease, next?.at) : null;
  return { slug, a, wo, name, ordered, mains, movies, extras, skippable, latest, announced, al, filler, next, notice };
}

function nextSeasonText(d: Awaited<ReturnType<typeof load>>): string {
  if (d.latest.status === "current" && d.notice?.onBreak && d.notice.next) {
    const when = hiDate(new Date(d.notice.next).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" }));
    return `${d.latest.title} अभी ब्रेक पर है। AniList के शेड्यूल में${d.next ? ` एपिसोड ${d.next.episode}` : " अगला एपिसोड"} ${when} को दिखाया गया है, यानी करीब ${Math.round((d.notice.breakDays ?? 0) / 7)} हफ़्ते बाद। इतनी आगे की तारीख आधिकारिक घोषणा तक बदल सकती है।`;
  }
  if (d.latest.status === "current") return `${d.latest.title} अभी चल रहा है। नए एपिसोड हर हफ़्ते आते हैं।`;
  if (d.announced) {
    // Month and year only: Kitsu's exact days for unreleased shows are sometimes placeholders.
    const when = hiDate(d.announced.startDate?.slice(0, 7));
    return `${d.announced.title} की घोषणा हो चुकी है${when ? `; उम्मीद है यह ${when} में जापान में शुरू होगा` : "; रिलीज़ डेट अभी तय नहीं है"}।`;
  }
  if (d.al && (d.al.status === "upcoming")) {
    const when = hiDate(d.al.startDate?.slice(0, 7)) || hiExpected(d.al.expected);
    return `${d.al.title} की घोषणा हो चुकी है${when ? `, उम्मीद है ${when} में` : "; रिलीज़ डेट अभी तय नहीं है"}।`;
  }
  const asOf = hiDate(new Date().toISOString().slice(0, 7));
  return `${asOf} तक ${d.name} के किसी नए सीज़न की आधिकारिक घोषणा नहीं हुई है। नया सीज़न आते ही यह पेज अपडेट हो जाएगा।`;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = await load((await params).slug);
  return {
    title: `${d.name} Watch Order in Hindi: देखने का सही क्रम, कुल समय और अगला सीज़न`,
    description: fitDescription(`${d.name} किस क्रम में देखें? ${hiCount(d.mains.length, "मुख्य हिस्सा", "मुख्य हिस्से")}${d.movies.length ? `, ${hiCount(d.movies.length, "मूवी", "मूवीज़")}` : ""} और कुल समय ${hiDuration(d.wo.totalMinutes)}। फ़िलर, मूवीज़ कहाँ देखें और अगले सीज़न की ताज़ा जानकारी हिंदी में।`.slice(0, 300)),
    alternates: {
      canonical: hindiPath(d.slug),
      languages: { en: `/watch-order/${d.slug}`, hi: hindiPath(d.slug), "x-default": `/watch-order/${d.slug}` },
    },
    // Offered to search engines when the franchise has an official Hindi dub (lib/hindi.ts hindiIndexed).
    ...(hindiIndexed(d.slug) ? {} : { robots: { index: false, follow: true } }),
  };
}

export default async function HindiGuide({ params }: Props) {
  const d = await load((await params).slug);
  const { a, wo, name, ordered, mains, movies, extras, skippable, filler } = d;
  const mainTitle = new Map(mains.map((e) => [e.anime.id, e.anime.title]));
  const meta = (e: WatchEntry) => [e.anime.startDate?.slice(0, 4), e.anime.subtype !== "movie" && e.anime.episodeCount ? `${e.anime.episodeCount} एपिसोड` : null, runtimeMinutes(e.anime) ? hiDuration(runtimeMinutes(e.anime)) : null].filter(Boolean).join(" · ");
  const next = nextSeasonText(d);
  const dub = dubFor(a);
  const dubQ = dubFaq(dub, name, "hi");
  // Where it streams in India, from the where-to-watch research (US/IN/UK), in Hindi.
  const india = (() => { const st = streamsFor(a); return st ? { st, list: servicesIn(st, "IN") } : null; })();
  const STREAM_KIND_HI: Record<Service["kind"], string> = { free: "मुफ़्त", subscription: "सब्सक्रिप्शन", buy: "ख़रीदें या किराए पर" };
  const AUDIO_HI: Record<string, string> = { ja: "जापानी (सबटाइटल)", en: "इंग्लिश डब", hi: "हिंदी डब", ta: "तमिल डब", te: "तेलुगु डब" };
  const audioHi = (x: Service) => x.audio.map((l) => AUDIO_HI[l] ?? l.toUpperCase()).join(", ");
  const indiaQ: FaqItem | null = india?.list.length ? { q: `${name} भारत में कहाँ देखें?`, a: india.list.map((x) => `${x.service} (${STREAM_KIND_HI[x.kind]}${audioHi(x) ? `, ${audioHi(x)}` : ""}${x.scope ? `, ${x.scope}` : ""})`).join("; ") + "।" } : null;
  // Same data as the English watch-order page: where each part streams, the season table, arcs.
  const core = ordered.filter((e) => e.kind === "main" || e.kind === "movie");
  const streams = await getStreamingFor(ordered.map((e) => e.anime.id));
  const coverage = streamCoverage(core.map((e) => e.anime.id), streams);
  const rows = mains.map((e) => ({ e, score: e.anime.rating ? e.anime.rating / 10 : null, filler: fillerFor(e.anime.slug, e.anime.episodeCount), adapt: adaptationFor(e.anime.slug) }));
  const best = rows.filter((r) => r.score).sort((x, y) => y.score! - x.score!)[0] ?? null;
  const sourceRow = [...rows].reverse().find((r) => r.adapt) ?? null;
  const arcGroups = mains.flatMap((e) => { const arcs = arcsFor(e.anime.slug); return arcs ? [{ e, arcs }] : []; });
  const faq: FaqItem[] = [
    ...(dubQ ? [dubQ] : []),
    ...(indiaQ ? [indiaQ] : []),
    { q: `${name} किस क्रम में देखें?`, a: `${mains.map((e, i) => `${i + 1}. ${e.anime.title}`).join(", ")}। ${movies.length ? "मूवीज़ उस सीज़न के बाद देखें जिसके बाद वे ऊपर लिस्ट में हैं।" : ""}`.trim() },
    { q: `${name} देखने में कितना समय लगेगा?`, a: wo.totalMinutes ? `मुख्य कहानी और मूवीज़ मिलाकर लगभग ${hiDuration(wo.totalMinutes)}। रोज़ 2 घंटे देखें तो करीब ${hiDays(wo.totalMinutes)} दिन लगेंगे।` : "पूरा रनटाइम अभी उपलब्ध नहीं है।" },
    ...(coverage.length ? [{ q: `${name} कहाँ देखें?`, a: `${coverage[0].site} पर ${core.length} में से ${coverage[0].n} सीज़न और मूवीज़ हैं${coverage[1] ? `, ${coverage[1].site} पर ${coverage[1].n}` : ""}। हर देश में कैटलॉग अलग होता है, इसलिए ऊपर हर हिस्से के लिंक देखें।` }] : []),
    { q: `${name} का अगला सीज़न कब आएगा?`, a: next },
    ...(sourceRow?.adapt ? [{ q: `${name} का ${sourceRow.adapt.medium === "manga" ? "मंगा" : "लाइट नॉवेल"} कहाँ से पढ़ें?`, a: `${sourceRow.e.anime.title} में ${hiSource(sourceRow.adapt)} ${sourceRow.adapt.from}–${sourceRow.adapt.to} हैं।${sourceRow.adapt.continue ? ` आगे की कहानी के लिए ${sourceRow.adapt.unit === "chapter" ? "चैप्टर" : "वॉल्यूम"} ${sourceRow.adapt.continue} से पढ़ें।` : ""}` }] : []),
    ...(movies.length ? [{ q: `क्या ${name} की मूवीज़ देखना ज़रूरी है?`, a: `मूवीज़ ज़्यादातर ऑप्शनल हैं, पर कहानी का मज़ा बढ़ाती हैं: ${movies.map((m) => `${m.anime.title}${m.attachedTo && mainTitle.get(m.attachedTo) ? ` (${mainTitle.get(m.attachedTo)} के बाद)` : ""}`).join("; ")}।` }] : []),
    ...(filler ? [{ q: `${a.title} में कितने फ़िलर एपिसोड हैं?`, a: `${filler.total} में से ${filler.count} एपिसोड (${filler.share.toFixed(0)}%) फ़िलर हैं, जिन्हें आप छोड़ सकते हैं।` }] : []),
    ...(arcGroups[0] ? [{ q: `${arcGroups[0].e.anime.title} में कौन-कौन से आर्क हैं?`, a: `${arcGroups[0].arcs.length} आर्क, क्रम से: ${arcGroups[0].arcs.filter((x) => !x.filler).map((x) => x.name).join(", ")}${arcGroups[0].arcs.some((x) => x.filler) ? " (फ़िलर आर्क अलग से ऊपर दिखाए गए हैं)" : ""}।` }] : []),
    ...(best && rows.filter((r) => r.score).length >= 2 ? [{ q: `${name} का सबसे अच्छा सीज़न कौन सा है?`, a: `Kitsu कम्युनिटी स्कोर के हिसाब से ${best.e.anime.title} (${best.score!.toFixed(2)}/10) सबसे ऊपर है। ऊपर की टेबल में हर सीज़न का स्कोर, एपिसोड और फ़िलर है।` }] : []),
  ].slice(0, 8);

  return (
    <div className="container-x pb-8" lang="hi">
      <JsonLd data={pageAbout(a, hindiPath(d.slug), `${name} watch order in Hindi`, undefined, "hi")} />
      <JsonLd data={{ ...itemList(`${name} देखने का सही क्रम`, ordered.map((e) => ({ url: animePath(e.anime), name: e.anime.title }))), inLanguage: "hi" }} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/hi", label: "हिंदी गाइड" }, { href: hindiPath(d.slug), label: name }]}
        eyebrow="🇮🇳 हिंदी गाइड"
        title={<><span className="text-gradient">{name}</span> किस क्रम में देखें</>}
        subtitle={`${name} देखने का सही क्रम, कुल समय, फ़िलर और अगले सीज़न की जानकारी, सब एक जगह।`}
        facts={[
          { value: String(mains.length), label: mains.length === 1 ? "मुख्य हिस्सा" : "मुख्य हिस्से" },
          ...(movies.length ? [{ value: String(movies.length), label: "मूवीज़" }] : []),
          ...(wo.totalMinutes ? [{ value: hiDuration(wo.totalMinutes), label: "कुल समय" }] : []),
        ]}
        hue={20}
        backdrop={a.cover?.large || null}
        posters={mains.slice(0, 3).map((e) => posterUrl(e.anime, "medium"))}
      >
        <p className="text-sm"><Link href={`/watch-order/${d.slug}`} className="chip" hrefLang="en">Read in English</Link></p>
      </PageHero>

      <section className="reveal mt-10" aria-labelledby="order-h">
        <h2 id="order-h" className="h-section mb-3">देखने का सही क्रम</h2>
        <ol className="space-y-2">
          {ordered.map((e, i) => (
            <li key={e.anime.id} className={`card flex gap-3 p-3 ${e.attachedTo ? "ml-4 sm:ml-8" : ""}`}>
              <span className="w-7 shrink-0 pt-1 text-center text-lg font-extrabold text-muted">{i + 1}</span>
              <span className="relative h-20 w-14 shrink-0 overflow-hidden rounded-md bg-bg-2">{posterUrl(e.anime, "small") && <Image src={posterUrl(e.anime, "small")!} alt="" fill sizes="56px" className="object-cover" />}</span>
              <span className="min-w-0 flex-1">
                <span className="text-[11px] font-bold uppercase tracking-wide text-accent-2">{KIND_HI[e.kind]}{e.optional && e.kind !== "movie" ? " · चाहें तो छोड़ सकते हैं" : ""}</span>
                <Link href={animePath(e.anime)} className="block font-semibold text-ink hover:text-violet-2">{e.anime.title}</Link>
                <span className="block text-xs text-muted">{meta(e)}</span>
                {oneLinkPerSite(streams.get(e.anime.id) || []).length > 0 && (
                  <span className="mt-1.5 flex flex-wrap gap-1.5">
                    {oneLinkPerSite(streams.get(e.anime.id) || []).slice(0, 3).map((x) => (
                      <a key={x.id} href={streamLink(x.url)} target="_blank" rel={affiliateRel} className="rounded-md border border-line bg-bg-2 px-2 py-0.5 text-[11px] font-semibold text-ink/90 hover:border-violet/60" title={`${e.anime.title}: ${x.site}`}>▶ {x.site}</a>
                    ))}
                  </span>
                )}
              </span>
            </li>
          ))}
        </ol>
        {skippable.length > 0 && <p className="mt-3 text-sm text-muted">इन्हें छोड़ सकते हैं (रीकैप या दोबारा बनाए गए वर्ज़न): {skippable.map((e) => e.anime.title).join(", ")}।</p>}
        {extras.length > 0 && <p className="mt-2 text-sm text-muted">साइड स्टोरी और OVA ऑप्शनल हैं; मुख्य कहानी समझने के लिए ज़रूरी नहीं।</p>}
      </section>

      {coverage.length > 0 && (
        <section className="card mt-8 p-4" aria-labelledby="where-h">
          <h2 id="where-h" className="font-semibold text-ink">{name} कहाँ देखें</h2>
          <p className="mt-1 text-sm text-muted">हर सर्विस पर {core.length} में से कितने सीज़न और मूवीज़ हैं। देश के हिसाब से कैटलॉग बदलता है; हर हिस्से के लिंक ऊपर क्रम में हैं।</p>
          <ul className="mt-3 flex flex-wrap gap-2">
            {coverage.slice(0, 6).map((c) => <li key={c.site} className="chip"><strong className="mr-1 font-semibold text-ink">{c.site}</strong> {core.length} में से {c.n}</li>)}
          </ul>
        </section>
      )}

      {rows.length >= 2 && (
        <section className="reveal mt-10" aria-labelledby="compare-h">
          <h2 id="compare-h" className="h-section mb-1">सीज़न की तुलना</h2>
          <p className="mb-3 text-sm text-muted">मुख्य कहानी के हर हिस्से का साल, एपिसोड, Kitsu स्कोर{rows.some((r) => r.filler) ? ", फ़िलर" : ""}{sourceRow ? (sourceRow.adapt!.unit === "chapter" ? " और मंगा के चैप्टर" : " और लाइट नॉवेल के वॉल्यूम") : ""}।{best ? ` सबसे ऊँचा स्कोर: ${best.e.anime.title}।` : ""}</p>
          <div className="card overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="text-[11px] text-muted">
                <tr className="border-b border-line">
                  <th scope="col" className="px-3 py-2 font-semibold">भाग</th>
                  <th scope="col" className="px-3 py-2 font-semibold">साल</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">एपिसोड</th>
                  <th scope="col" className="px-3 py-2 text-right font-semibold">स्कोर</th>
                  {rows.some((r) => r.filler) && <th scope="col" className="px-3 py-2 text-right font-semibold">फ़िलर</th>}
                  {sourceRow && <th scope="col" className="px-3 py-2 font-semibold">{sourceRow.adapt!.unit === "chapter" ? "मंगा" : "नॉवेल"}</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-line/60">
                {rows.map((r) => (
                  <tr key={r.e.anime.id} className={r === best ? "bg-violet/10" : ""}>
                    <th scope="row" className="px-3 py-2 font-medium"><Link href={animePath(r.e.anime)} className="text-ink hover:text-violet-2">{r.e.anime.title}</Link></th>
                    <td className="px-3 py-2 tabular-nums text-muted">{r.e.anime.startDate?.slice(0, 4) || "–"}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.e.anime.episodeCount ?? (r.e.anime.status === "current" ? "चल रहा है" : "–")}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{r.score ? r.score.toFixed(2) : "–"}</td>
                    {rows.some((x) => x.filler) && <td className="px-3 py-2 text-right tabular-nums">{r.filler ? `${Math.round(r.filler.share)}%` : "–"}</td>}
                    {sourceRow && <td className="px-3 py-2 tabular-nums text-muted">{r.adapt ? hiShortRange(r.adapt) : "–"}</td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {sourceRow?.adapt?.continue && <p className="mt-2 text-sm text-ink/90">📚 आगे की कहानी: {sourceRow.e.anime.title} के बाद {hiSource(sourceRow.adapt).replace(/ के .*/, "")} में {sourceRow.adapt.unit === "chapter" ? "चैप्टर" : "वॉल्यूम"} {sourceRow.adapt.continue} से पढ़ें।</p>}
          <p className="mt-1 text-xs text-muted">चैप्टर और आर्क की जानकारी ड्राफ़्ट है, सीरीज़ विकी और एपिसोड लिस्ट से मिलाकर। <Link href="/how-we-check" className="underline" hrefLang="en">हम कैसे जाँचते हैं</Link></p>
        </section>
      )}

      {arcGroups.length > 0 && (
        <section className="reveal mt-10" aria-labelledby="arcs-h">
          <h2 id="arcs-h" className="h-section mb-1">आर्क का क्रम</h2>
          <p className="mb-3 text-sm text-muted">कहानी के बड़े हिस्से (आर्क) और उनके एपिसोड। फ़िलर आर्क छोड़े जा सकते हैं।</p>
          {arcGroups.map(({ e, arcs }) => (
            <details key={e.anime.id} className="card mb-3 p-4" open={arcGroups.length === 1 && arcs.length <= 25}>
              <summary className="cursor-pointer list-none font-semibold text-ink">{e.anime.title} <span className="text-sm font-normal text-muted">· {arcs.length} आर्क</span></summary>
              <ol className="mt-3 grid gap-1.5 sm:grid-cols-2">
                {arcs.map((x, i) => (
                  <li key={`${x.from}-${x.name}`} className="flex items-baseline gap-2 text-sm">
                    <span className="arc-n">{i + 1}</span>
                    <span className="min-w-0 flex-1 text-ink">{x.name}{x.filler && <span className="tag-xs">फ़िलर</span>}</span>
                    <span className="arc-ep">एपिसोड {hiArcRange(x)}</span>
                  </li>
                ))}
              </ol>
            </details>
          ))}
        </section>
      )}

      <BingePlan ordered={ordered} lang="hi" />
      <HindiDub dub={dub} title={name} lang="hi" className="mt-8" />
      {india && india.list.length > 0 && (
        <section className="card reveal mt-8 p-4" aria-labelledby="india-h">
          <h2 id="india-h" className="font-semibold text-ink">🇮🇳 भारत में {name} कहाँ देखें</h2>
          <ul className="mt-2 space-y-1.5 text-sm">
            {india.list.map((x) => { const url = safeUrl(x.url); return (
              <li key={x.service + x.scope} className="flex flex-wrap gap-x-2">
                {url ? <a href={url} target="_blank" rel="noopener nofollow" className="font-semibold text-ink hover:text-violet-2 hover:underline">{x.service} ↗</a> : <span className="font-semibold text-ink">{x.service}</span>}
                <span className="text-muted">{STREAM_KIND_HI[x.kind]}{audioHi(x) ? ` · ${audioHi(x)}` : ""}{x.scope ? ` · ${x.scope}` : ""}</span>
              </li>
            ); })}
          </ul>
          <p className="mt-2 text-xs text-muted">स्ट्रीमिंग प्लेटफ़ॉर्म के अपने पेज और JustWatch से जाँचा गया। <Link href={streamsPath(india.st.s)} hrefLang="en" className="text-violet hover:underline">US और UK में कहाँ देखें (English) →</Link></p>
        </section>
      )}
      <EditorWatched anime={a} className="mt-6" />

      <section className="reveal mt-10">
        <div className="card p-5">
          <h2 className="text-lg font-bold">📅 अगला सीज़न कब आएगा</h2>
          <p className="mt-2 text-ink/85">{next}</p>
          <p className="mt-3 text-sm"><Link href={`${animePath(d.latest)}/next-season`} className="text-violet hover:underline" hrefLang="en">Season status (English) →</Link></p>
        </div>
      </section>

      <AdSlot slot="hindi-mid" />
      <Faq title={`${name}: अक्सर पूछे जाने वाले सवाल`} items={faq} />
      <p className="mt-6 text-sm"><Link href="/hi" className="chip">सभी हिंदी गाइड देखें →</Link></p>
    </div>
  );
}
