import Image from "next/image";
import Link from "@/components/Link";
import { animePath, posterUrl, subtypeLabel, type Anime } from "@/lib/kitsu";
import { streamsFor, streamsPath, servicesIn } from "@/lib/streams";
import { dubFor } from "@/lib/hindidub";
import { editorWatched } from "@/lib/editor";

export type Pick = { anime: Anime; why: string; votes?: number; score?: number };

const fmt = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : String(n));

/**
 * A ranked list where every entry says why it's there: the reason line, its length and score, and where to watch it
 * (US streaming services from the researched data, and whether it has a Hindi dub), so the list answers more than a
 * poster grid does.
 */
export default function PickList({ picks, start = 1, compact = false }: { picks: Pick[]; start?: number; compact?: boolean }) {
  return (
    <ol className="grid gap-3 md:grid-cols-2">
      {picks.map(({ anime: a, why, votes, score }, i) => {
        const streams = streamsFor(a);
        const us = streams ? [...new Set(servicesIn(streams, "US").filter((x) => x.kind !== "buy").map((x) => x.service))].slice(0, 3) : [];
        const hindi = dubFor(a)?.status === "available";
        const poster = posterUrl(a, "small");
        const eps = a.subtype === "movie" ? "Movie" : a.episodeCount ? `${a.episodeCount} episodes` : subtypeLabel(a.subtype);
        return (
          <li key={a.id} className="card flex gap-3 p-3">
            <span className="w-6 shrink-0 pt-0.5 text-right text-sm font-bold text-muted tabular-nums">{start + i}</span>
            {!compact && poster && (
              <Link href={animePath(a)} className="relative block h-24 w-16 shrink-0 overflow-hidden rounded-lg border border-line bg-bg-2" tabIndex={-1} aria-hidden>
                <Image src={poster} alt={`${a.title} poster`} fill sizes="64px" className="object-cover" />
              </Link>
            )}
            <div className="min-w-0 flex-1">
              <Link href={animePath(a)} className="font-semibold text-ink hover:text-violet-2">{a.titleEn && a.titleEn.length <= 50 ? a.titleEn : a.title}</Link>
              <p className="text-xs text-muted">{[eps, a.startDate?.slice(0, 4), score ? `${score.toFixed(1)}/10 on AniList` : null, votes ? `👍 ${fmt(votes)} fans recommend` : null].filter(Boolean).join(" · ")}</p>
              <p className="mt-1 text-sm text-ink/85">{why}</p>
              <p className="mt-1 flex flex-wrap gap-x-3 text-xs">
                {us.length > 0 && <Link href={streamsPath(streams!.s)} className="text-violet hover:underline">▶ {us.join(", ")} (US)</Link>}
                {!us.length && streams && <Link href={streamsPath(streams.s)} className="text-violet hover:underline">▶ Where to watch</Link>}
                {hindi && <Link href="/hindi-dub" className="text-[#fbbf24] hover:underline">🇮🇳 Hindi dub</Link>}
                {editorWatched(a) && <Link href="/author/harsh-lariya" rel="author" className="text-emerald-300 hover:underline">✓ Harsh has watched it</Link>}
              </p>
            </div>
          </li>
        );
      })}
    </ol>
  );
}
