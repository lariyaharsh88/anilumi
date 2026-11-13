import { fitDescription } from "@/lib/titles";
import type { Metadata } from "next";
import Image from "next/image";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import { itemList } from "@/lib/ld";
import { HINDI_PLATFORMS, byPlatform, dubDate, dubHref, hindiDubbed, notDubbed, platformKind } from "@/lib/hindidub";
import { animeBySlugs, animePath, posterUrl, type Anime } from "@/lib/kitsu";
import { dubStats, cheapestKind, genreCounts, eraCounts, hindiArrivals, hindiComing, castShows } from "@/lib/hindistats";
import { premiereAt } from "@/lib/dubschedule";
import SectionNav from "@/components/fx/SectionNav";
import StatTiles from "@/components/viz/StatTiles";
import BarChart from "@/components/viz/BarChart";
import StackedBar from "@/components/viz/StackedBar";
import HindiDubList, { type DubCard } from "@/components/HindiDubList";

export const revalidate = 86400;
const fmtDay = (iso: string | null) => (iso ? new Date(/T/.test(iso) ? iso : `${iso}T00:00:00Z`).toLocaleDateString("hi-IN", { day: "numeric", month: "short", timeZone: "UTC" }) : "तारीख़ अभी तय नहीं");
const yearOf = (a: Anime | undefined) => (a?.startDate ? Number(a.startDate.slice(0, 4)) : null);
// English genre names from Kitsu, shown in Hindi on the chart.
const GENRE_HI: Record<string, string> = {
  Action: "एक्शन", Adventure: "एडवेंचर", Comedy: "कॉमेडी", Fantasy: "फ़ैंटेसी", Drama: "ड्रामा", Romance: "रोमांस", "Science Fiction": "साइंस फ़िक्शन",
  Supernatural: "सुपरनैचुरल", Mystery: "मिस्ट्री", Sports: "स्पोर्ट्स", "Slice of Life": "स्लाइस ऑफ़ लाइफ़", Horror: "हॉरर", Psychological: "साइकोलॉजिकल", Thriller: "थ्रिलर",
};
const ERA_HI: Record<string, string> = { "Before 2000": "2000 से पहले", "2000s": "2000 का दशक", "2010s": "2010 का दशक", "2020s": "2020 का दशक" };

export function generateMetadata(): Metadata {
  const n = hindiDubbed().length;
  return {
    title: `Hindi Dubbed Anime List – हिंदी डब एनीमे की लिस्ट और कहाँ देखें (${n} एनीमे)`,
    description: fitDescription(`${n} पॉपुलर एनीमे जिनका आधिकारिक हिंदी डब है, और हर एक कहाँ देखें: Crunchyroll, Netflix, Prime Video, JioHotstar, मुफ़्त YouTube चैनल और टीवी। नए और आने वाले हिंदी डब भी। ${dubDate("hi")} को जाँचा गया।`),
    alternates: { canonical: "/hi/hindi-dub", languages: { en: "/hindi-dub", hi: "/hi/hindi-dub", "x-default": "/hindi-dub" } },
  };
}

/** Hindi version of /hindi-dub: the same checked list and sections, in Hindi. */
export default async function HindiDubHubHi() {
  const dubbed = hindiDubbed();
  const platforms = byPlatform();
  const free = dubbed.filter((d) => d.platforms.some((p) => platformKind(p.name) === "free"));
  const freePlatforms = platforms.filter((p) => p.kind === "free").map((p) => p.name);
  const none = notDubbed();
  const arrivals = hindiArrivals(), coming = hindiComing(), casts = castShows();
  const kitsu = await animeBySlugs([...dubbed.map((d) => d.s), ...[...arrivals, ...coming].flatMap((e) => (e.slug ? [e.slug] : []))], true);
  const poster = (slug: string, size: "small" | "medium" = "small") => { const a = kitsu.get(slug); return a ? posterUrl(a, size) : null; };
  const st = dubStats();
  const genres = genreCounts(dubbed.flatMap((d) => { const a = kitsu.get(d.s); return a ? [a.categories.map((c) => c.title)] : []; }));
  const eras = eraCounts(dubbed.map((d) => yearOf(kitsu.get(d.s))));
  const cards: DubCard[] = dubbed.map((d) => ({
    s: d.s, t: d.t, href: dubHref(d), poster: poster(d.s), year: yearOf(kitsu.get(d.s)), cheapest: cheapestKind(d),
    platforms: d.platforms.map((p) => ({ name: p.name, scope: p.scope, url: p.url, kind: platformKind(p.name) })),
  }));
  const platformPage = (name: string) => { const page = HINDI_PLATFORMS.find((x) => x.match.test(name)); return page ? `/hindi-dub/${page.slug}` : null; };

  const faq = [
    { q: "किन एनीमे का आधिकारिक हिंदी डब है?", a: `हमारी लिस्ट में ${dubbed.length} पॉपुलर एनीमे का हिंदी डब है, जैसे ${dubbed.slice(0, 8).map((d) => d.t).join(", ")}।` },
    ...(free.length ? [{ q: "एनीमे हिंदी में मुफ़्त कहाँ देखें?", a: `${freePlatforms.join(", ")} पर हिंदी डब मुफ़्त है, जैसे ${free.slice(0, 6).map((d) => d.t).join(", ")}।` }] : []),
    { q: "सबसे ज़्यादा हिंदी डब एनीमे किस प्लेटफ़ॉर्म पर हैं?", a: `${platforms[0].name} पर, इस लिस्ट के ${platforms[0].titles.length} एनीमे के साथ।` },
    ...(arrivals.length ? [{ q: "हाल में किन एनीमे का हिंदी डब आया?", a: `${arrivals.slice(0, 6).map((e) => `${e.t} (${e.service}, ${fmtDay(e.premiere)})`).join(", ")}।` }] : []),
    ...(coming.length ? [{ q: "कौन-से हिंदी डब जल्द आने वाले हैं?", a: `${coming.map((e) => `${e.t}, ${e.service}${e.premiere ? ` पर ${fmtDay(e.premiere)} से` : " पर (तारीख़ अभी तय नहीं)"}`).join("; ")}।` }] : []),
    { q: "क्या हिंदी डब एनीमे डाउनलोड करना कानूनी है?", a: "सिर्फ़ आधिकारिक जगहों से: Crunchyroll और Netflix अपने ऐप में ऑफ़लाइन डाउनलोड की सुविधा देते हैं, और YouTube चैनल मुफ़्त में देखे जा सकते हैं। जो साइटें हिंदी डब एनीमे की फ़ाइलें डाउनलोड के लिए देती हैं, वे बिना लाइसेंस के ऐसा करती हैं, जो भारत में कॉपीराइट का उल्लंघन है, और उन पर अक्सर नुकसानदेह विज्ञापन होते हैं।" },
    { q: "यह लिस्ट कैसे जाँची गई?", a: `${dubDate("hi")} को हर प्लेटफ़ॉर्म के अपने पेज (Crunchyroll का Audio, Netflix India की ऑडियो भाषाएँ) और भारतीय एनीमे न्यूज़ से। सिर्फ़ फ़ैन लिस्ट के भरोसे कोई एनीमे नहीं जोड़ा गया।` },
  ];
  const posterCard = (key: string, href: string, title: string, img: string | null, badge: string, sub: string, freeBadge = false) => (
    <li key={key} className="min-w-0">
      <Link href={href} className="group block" hrefLang="en">
        <span className={`relative block aspect-[5/7] overflow-hidden rounded-xl border bg-bg-2 ${freeBadge ? "border-emerald-500/30" : "border-line"}`}>
          {img && <Image src={img} alt={`${title} पोस्टर`} fill sizes="(max-width:640px) 30vw, 160px" className="object-cover transition duration-500 group-hover:scale-105" />}
          <span className={`absolute left-1.5 top-1.5 rounded-full px-1.5 py-0.5 text-[10px] font-bold text-white ${freeBadge ? "bg-emerald-600/90" : "bg-black/70"}`}>{badge}</span>
        </span>
        <span className="mt-1.5 line-clamp-2 text-sm font-semibold leading-snug text-ink group-hover:text-violet-2" lang="en">{title}</span>
      </Link>
      <span className="block truncate text-xs text-muted" lang="en">{sub}</span>
    </li>
  );

  return (
    <div className="container-x pb-8" lang="hi">
      <JsonLd data={{ ...itemList("हिंदी डब एनीमे", dubbed.map((d) => ({ url: dubHref(d), name: `${d.t} (हिंदी डब)` }))), inLanguage: "hi" }} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/hi", label: "हिंदी गाइड" }, { href: "/hi/hindi-dub", label: "हिंदी डब एनीमे" }]}
        eyebrow="🇮🇳 हिंदी डब"
        title={<>एनीमे जो <span className="text-gradient">हिंदी में</span> देख सकते हैं</>}
        subtitle="कौन-से पॉपुलर एनीमे का आधिकारिक हिंदी डब है, किस प्लेटफ़ॉर्म पर और कौन-से सीज़न। हर एनीमे के साथ उसका स्रोत भी है।"
        facts={[
          { value: String(dubbed.length), label: "हिंदी डब एनीमे" },
          { value: String(free.length), label: "मुफ़्त में" },
          { value: String(platforms.length), label: "प्लेटफ़ॉर्म" },
          { value: `${st.share}%`, label: "पॉपुलर एनीमे में" },
        ]}
        hue={25}
        posters={dubbed.slice(0, 3).map((d) => poster(d.s, "medium"))}
      >
        <p className="flex flex-wrap gap-2 text-sm">
          <Link href="/hindi-dub" className="chip" hrefLang="en">English</Link>
          <Link href="/hi" className="chip">हिंदी गाइड</Link>
          <Link href="/hindi-voice-artists" className="chip" hrefLang="en">हिंदी आवाज़ कलाकार</Link>
        </p>
      </PageHero>
      <SectionNav sections={[
        ...(free.length ? [{ id: "free", label: `मुफ़्त (${free.length})` }] : []),
        ...(arrivals.length ? [{ id: "new", label: "नए डब" }] : []),
        ...(coming.length ? [{ id: "coming", label: "जल्द आ रहे" }] : []),
        { id: "numbers", label: "आँकड़े" },
        { id: "list", label: `सभी ${dubbed.length}` },
        { id: "by-platform", label: "प्लेटफ़ॉर्म" },
        ...(casts.length ? [{ id: "cast", label: "आवाज़ कलाकार" }] : []),
        { id: "legal", label: "कानूनी या पाइरेटेड?" },
        { id: "no-dub", label: "डब नहीं" },
        { id: "faq", label: "सवाल" },
      ]} />

      {free.length > 0 && (
        <section id="free" data-section className="reveal pt-10" aria-labelledby="free-h">
          <h2 id="free-h" className="h-section mb-1">एनीमे हिंदी में मुफ़्त और कानूनी तरीके से देखें</h2>
          <p className="mb-4 max-w-3xl text-sm text-muted">ये {free.length} आधिकारिक हिंदी डब मुफ़्त हैं: ये लाइसेंस वाली कंपनियों के अपने YouTube चैनल या विज्ञापन वाले MX Player पर हैं। इनके अलावा &ldquo;फ़्री हिंदी एनीमे&rdquo; देने वाली साइटें बिना लाइसेंस की हैं।</p>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-8">
            {free.map((d) => posterCard(d.s, dubHref(d), d.t, poster(d.s), "मुफ़्त", d.platforms.filter((p) => platformKind(p.name) === "free").map((p) => p.name.replace(/ \(YouTube\)$/, "")).join(", "), true))}
          </ul>
        </section>
      )}

      {arrivals.length > 0 && (
        <section id="new" data-section className="reveal pt-10" aria-labelledby="new-h">
          <h2 id="new-h" className="h-section mb-1">नए हिंदी डब एनीमे</h2>
          <p className="mb-4 max-w-3xl text-sm text-muted">{fmtDay(arrivals[arrivals.length - 1].premiere)} से {fmtDay(arrivals[0].premiere)} के बीच {arrivals.length} हिंदी डब शुरू हुए, सबसे नए पहले। हर हफ़्ते के एपिसोड का समय <Link href="/dub-schedule#hindi" className="text-violet hover:underline" hrefLang="en">डब शेड्यूल</Link> पर है।</p>
          <ul className="grid grid-cols-3 gap-3 sm:grid-cols-5 lg:grid-cols-8">
            {arrivals.slice(0, 16).map((e) => posterCard(`${e.t}-${e.service}`, e.slug ? animePath({ slug: e.slug }) : "/dub-schedule#hindi", e.t, e.slug && kitsu.get(e.slug) ? posterUrl(kitsu.get(e.slug)!, "small") : null, fmtDay(e.premiere), e.service.replace(/ \(YouTube\)$/, "")))}
          </ul>
        </section>
      )}

      {coming.length > 0 && (
        <section id="coming" data-section className="reveal pt-10" aria-labelledby="coming-h">
          <h2 id="coming-h" className="h-section mb-1">जल्द आने वाले हिंदी डब</h2>
          <p className="mb-4 max-w-3xl text-sm text-muted">प्लेटफ़ॉर्म या लाइसेंस वाली कंपनी ने घोषणा की है, पर अभी स्ट्रीम नहीं हो रहे। तारीख़ बदलने पर हम लिस्ट अपडेट करते हैं।</p>
          <ul className="grid gap-3 sm:grid-cols-2">
            {coming.map((e) => {
              const pic = e.slug ? kitsu.get(e.slug) : undefined;
              return (
                <li key={`${e.t}-${e.service}`} className="card flex gap-3 p-3">
                  <span className="relative h-[90px] w-16 shrink-0 overflow-hidden rounded-lg border border-line bg-bg-2">{pic && posterUrl(pic, "small") && <Image src={posterUrl(pic, "small")!} alt="" fill sizes="64px" className="object-cover" />}</span>
                  <div className="min-w-0">
                    <p className="font-semibold text-ink" lang="en">{e.slug ? <Link href={animePath({ slug: e.slug })} className="hover:text-violet-2">{e.t}</Link> : e.t}</p>
                    <p className="text-sm text-ink/85"><span lang="en">{e.service}</span> · <span className="font-medium text-accent-2">{Number.isFinite(premiereAt(e)) ? `${fmtDay(e.premiere)} से` : "तारीख़ अभी तय नहीं"}</span></p>
                    <a href={e.url} target="_blank" rel="noopener nofollow" className="mt-1 inline-block text-xs text-violet hover:underline">घोषणा ↗</a>
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      )}

      <section id="numbers" data-section className="reveal pt-10" aria-labelledby="num-h">
        <h2 id="num-h" className="h-section mb-1">हिंदी डब एनीमे आँकड़ों में</h2>
        <p className="mb-4 max-w-3xl text-sm text-muted">हमने जिन {st.checked} सबसे ज़्यादा देखे जाने वाले एनीमे को जाँचा, उनमें से {st.dubbed} ({st.share}%) का आधिकारिक हिंदी डब है। इनमें से {st.multi} एक से ज़्यादा जगह पर हैं, इसलिए अक्सर सस्ता विकल्प चुना जा सकता है।</p>
        <StatTiles stats={[
          { label: "हिंदी डब वाले एनीमे", value: String(st.dubbed), sub: `${st.checked} में से` },
          { label: "मुफ़्त में", value: String(st.access.free), sub: "YouTube या MX Player" },
          { label: "प्लेटफ़ॉर्म", value: String(st.platformCount), sub: "स्ट्रीमिंग और टीवी" },
          { label: "2+ प्लेटफ़ॉर्म पर", value: String(st.multi), sub: `${Math.round((st.multi / Math.max(1, st.dubbed)) * 100)}% डब` },
        ]} />
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <StackedBar title="इन्हें कैसे देख सकते हैं" subtitle="हर डब एक बार गिना गया, उसके सबसे सस्ते विकल्प से" unit="एनीमे" segments={[
            { key: "free", label: "कहीं मुफ़्त", value: st.access.free },
            { key: "sub", label: "सिर्फ़ सब्सक्रिप्शन", value: st.access.subscription },
            { key: "tv", label: "सिर्फ़ टीवी चैनल", value: st.access.tv },
          ]} />
          <StackedBar title="हिंदी डब वाले और बिना डब वाले पॉपुलर एनीमे" subtitle={`हमने जो ${st.checked} एनीमे जाँचे`} unit="एनीमे" segments={[
            { key: "yes", label: "हिंदी डब है", value: st.dubbed },
            { key: "no", label: "हिंदी डब अभी नहीं", value: st.none },
          ]} />
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <BarChart orientation="bar" integer title="किस प्लेटफ़ॉर्म पर सबसे ज़्यादा हिंदी डब हैं?" subtitle={`हर प्लेटफ़ॉर्म पर एनीमे${st.other ? `। अन्य: ${st.other.names.join(", ")}` : ""}`} valueHeading="एनीमे"
            data={[...st.platforms.map((p) => ({ key: p.name, label: p.name, value: p.count, display: `${p.count} एनीमे`, href: platformPage(p.name) ?? undefined })), ...(st.other ? [{ key: "other", label: "अन्य", value: st.other.count, display: `${st.other.count} एनीमे` }] : [])]}
            highlightKey={st.platforms[0]?.name} />
          {genres.length > 0 && <BarChart orientation="bar" integer title="जॉनर के हिसाब से हिंदी डब" subtitle="एक एनीमे के कई जॉनर हो सकते हैं" valueHeading="एनीमे"
            data={genres.map((g) => ({ key: g.label, label: GENRE_HI[g.label] ?? g.label, value: g.value, display: `${g.value} एनीमे` }))} highlightKey={genres[0]?.label} />}
        </div>
        <div className="mt-4 grid gap-4 lg:grid-cols-2">
          <BarChart integer title="डब वाले एनीमे पहली बार कब आए" subtitle="ज़्यादातर नए हिट्स हैं, पर 1990 और 2000 के दशक के क्लासिक भी हैं" valueHeading="एनीमे"
            data={eras.map((e) => ({ key: e.label, label: ERA_HI[e.label] ?? e.label, value: e.value, display: `${e.value} एनीमे` }))} labelKeys={eras.map((e) => e.label)} height={170} />
          <BarChart integer title="हर डब कितने प्लेटफ़ॉर्म पर है?" subtitle="ज़्यादा प्लेटफ़ॉर्म का मतलब देखने के ज़्यादा तरीके, अक्सर एक मुफ़्त भी" valueHeading="एनीमे"
            data={st.spread.map((x) => ({ key: x.label, label: `${x.label} प्लेटफ़ॉर्म`, value: x.value, display: `${x.value} एनीमे` }))} labelKeys={st.spread.map((x) => x.label)} height={170} />
        </div>
      </section>

      <section id="list" data-section className="reveal pt-10" aria-labelledby="list-h">
        <h2 id="list-h" className="h-section mb-1">सभी {dubbed.length} हिंदी डब एनीमे की लिस्ट</h2>
        <p className="mb-4 text-sm text-muted">{dubDate("hi")} को जाँचा गया। सबसे ज़्यादा देखे जाने वाले पहले; हर लाइन उस पेज से जुड़ी है जहाँ इसकी पुष्टि हुई।</p>
        <HindiDubList items={cards} platforms={platforms.map((p) => p.name)} lang="hi" />
      </section>

      <section id="by-platform" data-section className="reveal pt-10" aria-labelledby="plat-h">
        <h2 id="plat-h" className="h-section mb-4">प्लेटफ़ॉर्म के हिसाब से हिंदी डब</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {platforms.map((p) => (
            <div key={p.name} className="card p-4">
              <h3 className="font-semibold text-ink" lang="en">{platformPage(p.name) ? <Link href={platformPage(p.name)!} className="hover:text-violet-2 hover:underline">{p.name}</Link> : p.name}</h3>
              <p className="text-xs text-muted">{p.titles.length} एनीमे</p>
              <span className="mt-2 block h-1.5 rounded-full bg-white/10"><span className="block h-1.5 rounded-full bg-violet" style={{ width: `${(p.titles.length / platforms[0].titles.length) * 100}%` }} /></span>
              <ul className="mt-3 flex flex-wrap gap-1.5">
                {p.titles.slice(0, 8).map(({ d }) => <li key={d.s}><Link href={dubHref(d)} className="chip text-xs" hrefLang="en">{d.t}</Link></li>)}
              </ul>
              {p.titles.length > 8 && (platformPage(p.name)
                ? <Link href={platformPage(p.name)!} className="mt-2 inline-block text-xs font-medium text-violet hover:underline" hrefLang="en">{p.name} पर सभी {p.titles.length} →</Link>
                : <details className="mt-2 text-xs"><summary className="cursor-pointer text-violet">+{p.titles.length - 8} और</summary><ul className="mt-2 flex flex-wrap gap-1.5">{p.titles.slice(8).map(({ d }) => <li key={d.s}><Link href={dubHref(d)} className="chip text-xs" hrefLang="en">{d.t}</Link></li>)}</ul></details>)}
            </div>
          ))}
        </div>
      </section>

      {casts.length > 0 && (
        <section id="cast" data-section className="reveal pt-10" aria-labelledby="cast-h">
          <div className="mb-1 flex items-end justify-between gap-3">
            <h2 id="cast-h" className="h-section">पॉपुलर हिंदी डब के आवाज़ कलाकार</h2>
            <Link href="/hindi-voice-artists" className="shrink-0 text-sm font-medium text-violet hover:text-violet-2" hrefLang="en">सभी कलाकार →</Link>
          </div>
          <p className="mb-4 max-w-3xl text-sm text-muted">मुख्य किरदारों को हिंदी में कौन आवाज़ देता है: आधिकारिक क्रेडिट, स्टूडियो और कलाकारों की अपनी पोस्ट से।</p>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {casts.map(({ d, cast }) => (
              <div key={d.s} className="card p-3.5" lang="en">
                <h3 className="font-semibold text-ink"><Link href={dubHref(d)} className="hover:text-violet-2">{d.t}</Link></h3>
                <ul className="mt-2 space-y-1 text-sm">
                  {cast.slice(0, 5).map((c) => (
                    <li key={c.character + c.artist} className="flex justify-between gap-2">
                      <span className="truncate text-muted">{c.characterHref ? <Link href={c.characterHref} className="hover:text-violet-2">{c.character}</Link> : c.character}</span>
                      <Link href={c.artistHref} className="shrink-0 font-medium text-ink hover:text-violet-2">{c.artist}</Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      )}

      <section id="legal" data-section className="reveal pt-10" aria-labelledby="legal-h">
        <h2 id="legal-h" className="h-section mb-3">कानूनी या पाइरेटेड हिंदी एनीमे साइटें: कौन-सी सुरक्षित हैं?</h2>
        <div className="grid gap-3 md:grid-cols-2">
          <div className="card border-emerald-500/30 p-4">
            <h3 className="font-semibold text-emerald-300">✓ आधिकारिक और सुरक्षित</h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-ink/90">
              <li><strong>{free.length} डब मुफ़्त हैं</strong>: लाइसेंस वाली कंपनियों के अपने YouTube चैनल (Muse India, Ani-One India) और MX Player पर। <a href="#free" className="text-violet hover:underline">देखें</a>।</li>
              <li>बाकी Crunchyroll, Netflix, Prime Video और JioHotstar पर हैं, जो अपने ऐप में ऑफ़लाइन देखने के लिए डाउनलोड की सुविधा देते हैं।</li>
              <li>आधिकारिक अपलोड लाइसेंस वाली कंपनी के वेरिफ़ाइड चैनल से आते हैं और उसकी साइट या सोशल अकाउंट पर घोषित होते हैं।</li>
            </ul>
          </div>
          <div className="card border-accent/30 p-4">
            <h3 className="font-semibold text-accent-2">✗ अनौपचारिक डाउनलोड साइटें</h3>
            <ul className="mt-2 list-disc space-y-1.5 pl-5 text-sm leading-6 text-ink/90">
              <li>जो साइटें हिंदी डब एनीमे डाउनलोड के लिए देती हैं, वे बिना लाइसेंस के कॉपी करती हैं, जो भारत के कॉपीराइट कानून का उल्लंघन है।</li>
              <li>वे पॉप-अप और रीडायरेक्ट विज्ञापनों से चलती हैं, जो फ़ोन पर मैलवेयर और धोखाधड़ी का आम रास्ता है।</li>
              <li>वहाँ के कई &ldquo;हिंदी डब&rdquo; फ़ैन-मेड या कम क्वालिटी के होते हैं, और साइटें अक्सर बंद होकर पता बदल लेती हैं।</li>
            </ul>
          </div>
        </div>
      </section>

      <section id="no-dub" data-section className="reveal pt-10" aria-labelledby="none-h">
        <h2 id="none-h" className="h-section mb-1">इनका हिंदी डब अभी नहीं है</h2>
        <p className="mb-4 text-sm text-muted">भारत में इन्हें स्ट्रीम करने वाले प्लेटफ़ॉर्म पर {dubDate("hi")} को हिंदी ऑडियो नहीं मिला।</p>
        <ul className="flex flex-wrap gap-2">
          {none.slice(0, 40).map((d) => <li key={d.s}><Link href={dubHref(d)} className="chip text-xs" hrefLang="en">{d.t}</Link></li>)}
        </ul>
        {none.length > 40 && (
          <details className="mt-3">
            <summary className="cursor-pointer text-sm font-medium text-violet">सभी {none.length} देखें</summary>
            <ul className="mt-3 flex flex-wrap gap-2">{none.slice(40).map((d) => <li key={d.s}><Link href={dubHref(d)} className="chip text-xs" hrefLang="en">{d.t}</Link></li>)}</ul>
          </details>
        )}
      </section>

      <div id="faq" data-section className="pt-2"><Faq title="हिंदी डब: अक्सर पूछे जाने वाले सवाल" items={faq} /></div>
    </div>
  );
}
