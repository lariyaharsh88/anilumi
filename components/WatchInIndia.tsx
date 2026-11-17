import Link from "@/components/Link";
import JoinChannels from "@/components/JoinChannels";
import { hindiDubPath, platformKind, topHindiDub, type Dub } from "@/lib/hindidub";
import { LANG, regionalFor } from "@/lib/regionaldub";

type Row = { lang: string; href: string; platforms: { name: string; url: string }[] };

/**
 * "Watch in India" in the anime page's watch panel: which Indian-language dubs exist (Hindi from data/hindi-dubs.json,
 * Tamil and Telugu from data/regional-dubs.json) and where, free ones flagged. Nothing when there's no Indian dub.
 */
export default function WatchInIndia({ anime, hindi, className = "" }: { anime: { id: string; slug: string }; hindi: Dub | null; className?: string }) {
  const rows: Row[] = [
    ...(hindi?.status === "available" ? [{ lang: "Hindi", href: topHindiDub(hindi.s) ? hindiDubPath(hindi.s) : "/hindi-dub", platforms: hindi.platforms }] : []),
    ...(["ta", "te"] as const).flatMap((l) => { const d = regionalFor(anime, l); return d ? [{ lang: LANG[l].name, href: LANG[l].path, platforms: d.platforms }] : []; }),
  ];
  if (!rows.length) return null;
  return (
    <div className={`rounded-xl border border-orange-400/30 bg-orange-400/[.06] p-3 text-sm ${className}`}>
      <p className="font-semibold text-ink"><span aria-hidden>🇮🇳</span> Watch in India: {rows.map((r) => r.lang).join(", ")} dub</p>
      <ul className="mt-1.5 space-y-1">
        {rows.map((r) => (
          <li key={r.lang} className="text-ink/85">
            <Link href={r.href} className="font-medium text-violet hover:underline">{r.lang}</Link>
            {": "}
            {[...new Map(r.platforms.map((p) => [p.name, p])).values()].map((p, i) => (
              <span key={p.name}>{i ? ", " : ""}{p.name}{platformKind(p.name) === "free" && <span className="ml-1 rounded-full bg-emerald-500/15 px-1.5 text-[10px] font-semibold text-emerald-300">FREE</span>}</span>
            ))}
          </li>
        ))}
      </ul>
      <JoinChannels compact source="anime-india" lang="Indian" className="mt-2" />
    </div>
  );
}
