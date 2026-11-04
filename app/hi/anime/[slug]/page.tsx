import type { Metadata } from "next";
import Image from "next/image";
import { notFound } from "next/navigation";
import Link from "@/components/Link";
import { getAnimeBySlug, buildWatchOrder, franchiseName, animePath, posterUrl, runtimeMinutes, type WatchEntry } from "@/lib/kitsu";
import { getAniListSequel } from "@/lib/anilist";
import { fillerFor } from "@/lib/filler";
import { KIND_HI, hiDuration, hiDays, hiDate, hiExpected, hiCount, hasHindi, hindiPath } from "@/lib/hindi";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import { pageAbout, itemList } from "@/lib/ld";
import Faq, { type FaqItem } from "@/components/Faq";
import AdSlot from "@/components/AdSlot";
import BingePlan from "@/components/BingePlan";

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
  return { slug, a, wo, name, ordered, mains, movies, extras, skippable, latest, announced, al, filler };
}

function nextSeasonText(d: Awaited<ReturnType<typeof load>>): string {
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
    description: `${d.name} किस क्रम में देखें? ${hiCount(d.mains.length, "मुख्य हिस्सा", "मुख्य हिस्से")}${d.movies.length ? `, ${hiCount(d.movies.length, "मूवी", "मूवीज़")}` : ""} और कुल समय ${hiDuration(d.wo.totalMinutes)}। फ़िलर, मूवीज़ कहाँ देखें और अगले सीज़न की ताज़ा जानकारी हिंदी में।`.slice(0, 300),
    alternates: {
      canonical: hindiPath(d.slug),
      languages: { en: `/watch-order/${d.slug}`, hi: hindiPath(d.slug), "x-default": `/watch-order/${d.slug}` },
    },
  };
}

export default async function HindiGuide({ params }: Props) {
  const d = await load((await params).slug);
  const { a, wo, name, ordered, mains, movies, extras, skippable, filler } = d;
  const mainTitle = new Map(mains.map((e) => [e.anime.id, e.anime.title]));
  const meta = (e: WatchEntry) => [e.anime.startDate?.slice(0, 4), e.anime.subtype !== "movie" && e.anime.episodeCount ? `${e.anime.episodeCount} एपिसोड` : null, runtimeMinutes(e.anime) ? hiDuration(runtimeMinutes(e.anime)) : null].filter(Boolean).join(" · ");
  const next = nextSeasonText(d);
  const faq: FaqItem[] = [
    { q: `${name} किस क्रम में देखें?`, a: `${mains.map((e, i) => `${i + 1}. ${e.anime.title}`).join(", ")}। ${movies.length ? "मूवीज़ उस सीज़न के बाद देखें जिसके बाद वे ऊपर लिस्ट में हैं।" : ""}`.trim() },
    { q: `${name} देखने में कितना समय लगेगा?`, a: wo.totalMinutes ? `मुख्य कहानी और मूवीज़ मिलाकर लगभग ${hiDuration(wo.totalMinutes)}। रोज़ 2 घंटे देखें तो करीब ${hiDays(wo.totalMinutes)} दिन लगेंगे।` : "पूरा रनटाइम अभी उपलब्ध नहीं है।" },
    { q: `${name} का अगला सीज़न कब आएगा?`, a: next },
    ...(movies.length ? [{ q: `क्या ${name} की मूवीज़ देखना ज़रूरी है?`, a: `मूवीज़ ज़्यादातर ऑप्शनल हैं, पर कहानी का मज़ा बढ़ाती हैं: ${movies.map((m) => `${m.anime.title}${m.attachedTo && mainTitle.get(m.attachedTo) ? ` (${mainTitle.get(m.attachedTo)} के बाद)` : ""}`).join("; ")}।` }] : []),
    ...(filler ? [{ q: `${a.title} में कितने फ़िलर एपिसोड हैं?`, a: `${filler.total} में से ${filler.count} एपिसोड (${filler.share.toFixed(0)}%) फ़िलर हैं, जिन्हें आप छोड़ सकते हैं।` }] : []),
  ];

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
          { value: String(mains.length), label: "मुख्य हिस्से" },
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
              </span>
            </li>
          ))}
        </ol>
        {skippable.length > 0 && <p className="mt-3 text-sm text-muted">इन्हें छोड़ सकते हैं (रीकैप या दोबारा बनाए गए वर्ज़न): {skippable.map((e) => e.anime.title).join(", ")}।</p>}
        {extras.length > 0 && <p className="mt-2 text-sm text-muted">साइड स्टोरी और OVA ऑप्शनल हैं; मुख्य कहानी समझने के लिए ज़रूरी नहीं।</p>}
      </section>

      <BingePlan ordered={ordered} lang="hi" />

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
