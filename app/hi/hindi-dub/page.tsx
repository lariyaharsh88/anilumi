import { fitDescription } from "@/lib/titles";
import type { Metadata } from "next";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import { KIND_CLASS } from "@/components/HindiDub";
import { itemList } from "@/lib/ld";
import { byPlatform, dubDate, dubHref, hindiDubbed, notDubbed, platformKind, type PlatformKind } from "@/lib/hindidub";

export const revalidate = 86400;
const KIND: Record<PlatformKind, string> = { free: "मुफ़्त", subscription: "सब्सक्रिप्शन", tv: "टीवी चैनल" };

export function generateMetadata(): Metadata {
  const n = hindiDubbed().length;
  return {
    title: `Hindi Dubbed Anime List – हिंदी डब एनीमे की लिस्ट और कहाँ देखें (${n} एनीमे)`,
    description: fitDescription(`${n} पॉपुलर एनीमे जिनका आधिकारिक हिंदी डब है, और हर एक कहाँ देखें: Crunchyroll, Netflix, Prime Video, JioHotstar, मुफ़्त YouTube चैनल और टीवी। ${dubDate("hi")} को जाँचा गया।`),
    alternates: { canonical: "/hi/hindi-dub", languages: { en: "/hindi-dub", hi: "/hi/hindi-dub", "x-default": "/hindi-dub" } },
  };
}

/** Hindi version of /hindi-dub: the same checked list, in Hindi. */
export default function HindiDubHubHi() {
  const dubbed = hindiDubbed();
  const platforms = byPlatform();
  const free = dubbed.filter((d) => d.platforms.some((p) => platformKind(p.name) === "free"));
  const freePlatforms = platforms.filter((p) => p.kind === "free").map((p) => p.name);
  const faq = [
    { q: "किन एनीमे का आधिकारिक हिंदी डब है?", a: `हमारी लिस्ट में ${dubbed.length} पॉपुलर एनीमे का हिंदी डब है, जैसे ${dubbed.slice(0, 8).map((d) => d.t).join(", ")}।` },
    ...(free.length ? [{ q: "एनीमे हिंदी में मुफ़्त कहाँ देखें?", a: `${freePlatforms.join(", ")} पर हिंदी डब मुफ़्त है, जैसे ${free.slice(0, 6).map((d) => d.t).join(", ")}।` }] : []),
    { q: "सबसे ज़्यादा हिंदी डब एनीमे किस प्लेटफ़ॉर्म पर हैं?", a: `${platforms[0].name} पर, इस लिस्ट के ${platforms[0].titles.length} एनीमे के साथ।` },
    { q: "यह लिस्ट कैसे जाँची गई?", a: `${dubDate("hi")} को हर प्लेटफ़ॉर्म के अपने पेज (Crunchyroll का Audio, Netflix India की ऑडियो भाषाएँ) और भारतीय एनीमे न्यूज़ से। सिर्फ़ फ़ैन लिस्ट के भरोसे कोई एनीमे नहीं जोड़ा गया।` },
  ];
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
        ]}
        hue={25}
      >
        <p className="flex flex-wrap gap-2 text-sm">
          <Link href="/hindi-dub" className="chip" hrefLang="en">English</Link>
          <Link href="/hi" className="chip">हिंदी गाइड</Link>
        </p>
      </PageHero>

      <section className="reveal mt-10" aria-labelledby="list-h">
        <h2 id="list-h" className="h-section mb-1">हिंदी डब एनीमे की लिस्ट</h2>
        <p className="mb-4 text-sm text-muted">{dubDate("hi")} को जाँचा गया। सबसे ज़्यादा देखे जाने वाले पहले।</p>
        <ul className="grid gap-3 md:grid-cols-2">
          {dubbed.map((d) => (
            <li key={d.s} className="card p-4">
              <Link href={dubHref(d)} className="font-semibold text-ink hover:text-violet-2" hrefLang="en">{d.t}</Link>
              <ul className="mt-2 space-y-1.5">
                {d.platforms.map((p) => (
                  <li key={p.name + p.scope} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                    <span className="font-medium text-ink/90">{p.name}</span>
                    <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${KIND_CLASS[platformKind(p.name)]}`}>{KIND[platformKind(p.name)]}</span>
                    {p.scope && <span className="text-muted" lang="en">· {p.scope}</span>}
                    <a href={p.url} target="_blank" rel="noopener nofollow" className="text-xs text-violet hover:underline">स्रोत ↗</a>
                  </li>
                ))}
              </ul>
            </li>
          ))}
        </ul>
      </section>

      <section className="reveal mt-12" aria-labelledby="plat-h">
        <h2 id="plat-h" className="h-section mb-4">प्लेटफ़ॉर्म के हिसाब से</h2>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {platforms.map((p) => (
            <div key={p.name} className="card p-4">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-semibold text-ink">{p.name}</h3>
                <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${KIND_CLASS[p.kind]}`}>{KIND[p.kind]}</span>
              </div>
              <p className="text-xs text-muted">{p.titles.length} एनीमे</p>
              <ul className="mt-2 flex flex-wrap gap-1.5">
                {p.titles.map(({ d }) => <li key={d.s}><Link href={dubHref(d)} className="chip text-xs" hrefLang="en">{d.t}</Link></li>)}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="reveal mt-12" aria-labelledby="none-h">
        <h2 id="none-h" className="h-section mb-1">इनका हिंदी डब अभी नहीं है</h2>
        <p className="mb-4 text-sm text-muted">भारत में इन्हें स्ट्रीम करने वाले प्लेटफ़ॉर्म पर {dubDate("hi")} को हिंदी ऑडियो नहीं मिला।</p>
        <ul className="flex flex-wrap gap-2">
          {notDubbed().map((d) => <li key={d.s}><Link href={dubHref(d)} className="chip text-xs" hrefLang="en">{d.t}</Link></li>)}
        </ul>
      </section>

      <Faq title="हिंदी डब: अक्सर पूछे जाने वाले सवाल" items={faq} />
    </div>
  );
}
