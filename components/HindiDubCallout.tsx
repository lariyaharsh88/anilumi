import Link from "@/components/Link";
import { dubFor, hindiDubPath, platformKind } from "@/lib/hindidub";
import { hindiDubIndexed } from "@/lib/indexing";

/**
 * One line for pages about a show that aren't about watching it (filler list, next season, how long to watch,
 * episode list): its official Hindi dub, if any, and a link to the show's own Hindi page (else the Hindi dub list).
 * Hindi dub pages bring most of the site's visits (ChatGPT and Bing, Nov 2026), so related pages point at them.
 */
export default function HindiDubCallout({ anime, title, className = "" }: { anime: { id: string; slug: string }; title: string; className?: string }) {
  const dub = dubFor(anime);
  if (dub?.status !== "available") return null;
  const where = [...new Set(dub.platforms.map((p) => p.name.replace(/ \(.*\)$/, "")))].slice(0, 3).join(", ");
  const free = dub.platforms.some((p) => platformKind(p.name) === "free");
  const href = hindiDubIndexed(dub.s) ? hindiDubPath(dub.s) : "/hindi-dub";
  return (
    <p className={`card flex flex-wrap items-center gap-x-2 gap-y-1 border-orange-400/30 p-3 text-sm ${className}`}>
      <span aria-hidden>🇮🇳</span>
      <span className="text-ink/90"><strong className="text-ink">{title} is dubbed in Hindi</strong> on {where}{free ? ", with a free legal option" : ""}.</span>
      <Link href={href} className="font-semibold text-violet hover:text-violet-2">Watch {title} in Hindi →</Link>
    </p>
  );
}
