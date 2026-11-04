import Link from "@/components/Link";
import { dubDate, platformKind, type Dub, type PlatformKind } from "@/lib/hindidub";

const T = {
  en: {
    q: (t: string) => `Is ${t} dubbed in Hindi?`,
    yes: "Yes. The official Hindi dub streams here:",
    no: "No official Hindi dub found yet.",
    kind: { free: "Free", subscription: "Subscription", tv: "TV channel" } as Record<PlatformKind, string>,
    source: "source",
    checked: (d: string) => `Checked against the platforms' own pages on ${d}. Streaming deals change, so confirm the audio menu before you start.`,
    all: "All Hindi-dubbed anime", allHref: "/hindi-dub",
  },
  hi: {
    q: (t: string) => `क्या ${t} हिंदी डब में है?`,
    yes: "हाँ, आधिकारिक हिंदी डब यहाँ देख सकते हैं:",
    no: "अभी तक कोई आधिकारिक हिंदी डब नहीं मिला।",
    kind: { free: "मुफ़्त", subscription: "सब्सक्रिप्शन", tv: "टीवी चैनल" } as Record<PlatformKind, string>,
    source: "स्रोत",
    checked: (d: string) => `${d} को प्लेटफ़ॉर्म के अपने पेज से जाँचा गया। स्ट्रीमिंग बदलती रहती है, इसलिए देखने से पहले ऑडियो मेनू में हिंदी देख लें।`,
    all: "सभी हिंदी डब एनीमे", allHref: "/hi/hindi-dub",
  },
} as const;

export const KIND_CLASS: Record<PlatformKind, string> = {
  free: "border-emerald-500/40 text-emerald-300",
  subscription: "border-line text-muted",
  tv: "border-amber-400/40 text-amber-200",
};

/**
 * "Is X dubbed in Hindi?" answered from data/hindi-dubs.json: each platform with its seasons, how you watch it
 * and the page that confirms it, or a clear "no" when the check found none. English or Hindi; server component.
 */
export default function HindiDub({ dub, title, lang = "en", className = "" }: { dub: Dub | null; title: string; lang?: "en" | "hi"; className?: string }) {
  if (!dub) return null;
  const t = T[lang];
  const yes = dub.status === "available";
  return (
    <section className={`card reveal p-4 sm:p-5 ${yes ? "border-orange-400/30" : ""} ${className}`} aria-labelledby="hindi-dub-h">
      <h2 id="hindi-dub-h" className="flex items-center gap-2 font-semibold text-ink"><span aria-hidden>🇮🇳</span> {t.q(title)}</h2>
      <p className="mt-1 text-sm text-ink/90">{yes ? t.yes : t.no}</p>
      {yes && (
        <ul className="mt-3 space-y-2">
          {dub.platforms.map((p) => (
            <li key={p.name + p.scope} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
              <span className="font-semibold text-ink">{p.name}</span>
              <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${KIND_CLASS[platformKind(p.name)]}`}>{t.kind[platformKind(p.name)]}</span>
              {p.scope && <span className="text-muted">· {p.scope}</span>}
              <a href={p.url} target="_blank" rel="noopener nofollow" className="text-xs text-violet hover:underline">{t.source} ↗</a>
            </li>
          ))}
        </ul>
      )}
      {lang === "en" && dub.note && <p className="mt-3 text-sm leading-6 text-ink/80">{dub.note}</p>}
      <p className="mt-3 text-xs text-muted">{t.checked(dubDate(lang))} <Link href={t.allHref} className="font-medium text-violet hover:text-violet-2">{t.all} →</Link></p>
    </section>
  );
}
