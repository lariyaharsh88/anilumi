import type { Metadata } from "next";
import Link from "@/components/Link";
import { WATCH_ORDER_OVERRIDES } from "@/data/watch-orders";
import { HINDI_SLUGS, hindiPath } from "@/lib/hindi";
import PageHero from "@/components/PageHero";
import { itemList } from "@/lib/ld";
import JsonLd from "@/components/JsonLd";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Anime Guides in Hindi – एनीमे देखने का सही क्रम, कुल समय और नए सीज़न",
  description: `${HINDI_SLUGS.length} पॉपुलर एनीमे की हिंदी गाइड: Naruto, One Piece, Demon Slayer, Attack on Titan और बाकी को किस क्रम में देखें, कितना समय लगेगा, फ़िलर और अगला सीज़न कब आएगा।`,
  alternates: { canonical: "/hi", languages: { en: "/watch-order", hi: "/hi", "x-default": "/watch-order" } },
};

/** Hub for the Hindi guides, alphabetical by the name people search. */
export default function HindiHub() {
  const guides = HINDI_SLUGS.map((slug) => ({ slug, name: WATCH_ORDER_OVERRIDES[slug].label! })).sort((x, y) => x.name.localeCompare(y.name));
  return (
    <div className="container-x pb-8" lang="hi">
      <JsonLd data={{ ...itemList("Anime watch order guides in Hindi", guides.map((g) => ({ url: hindiPath(g.slug), name: `${g.name} watch order in Hindi` }))), inLanguage: "hi" }} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/hi", label: "हिंदी गाइड" }]}
        eyebrow="🇮🇳 हिंदी गाइड"
        title={<>एनीमे <span className="text-gradient">हिंदी में</span>: देखने का सही क्रम</>}
        subtitle="हर गाइड में: किस क्रम में देखें, मूवीज़ कहाँ फ़िट होती हैं, कुल कितना समय लगेगा, फ़िलर एपिसोड और अगला सीज़न कब आएगा।"
        facts={[{ value: String(guides.length), label: "एनीमे गाइड" }]}
        hue={20}
      >
        <p className="flex flex-wrap gap-2 text-sm"><Link href="/hi/hindi-dub" className="chip">🇮🇳 हिंदी डब एनीमे की लिस्ट</Link><Link href="/watch-order" className="chip" hrefLang="en">All watch orders (English)</Link></p>
      </PageHero>
      <ul className="reveal mt-10 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
        {guides.map((g) => (
          <li key={g.slug}>
            <Link href={hindiPath(g.slug)} className="card group flex items-center justify-between gap-3 px-4 py-3 transition hover:border-violet/60">
              <span className="min-w-0">
                <span className="block truncate font-semibold text-ink group-hover:text-violet-2">{g.name}</span>
                <span className="block text-xs text-muted">किस क्रम में देखें · कुल समय · अगला सीज़न</span>
              </span>
              <span aria-hidden className="text-muted group-hover:text-violet-2">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
