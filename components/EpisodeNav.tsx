"use client";
import { useRouter } from "next/navigation";
import Link from "@/components/Link";
import { useWatchlist, type WatchItem } from "@/lib/watchlist";

/**
 * Compact episode bar near the top of an episode page: ← previous · next →, ticked when My list progress covers
 * them; "Continue at episode N" when the visitor's progress is elsewhere; and on an aired episode not yet
 * watched, "Watched · next episode" saves progress (adding the show if needed) and goes straight on. The plain
 * prev/next links at the bottom of the page stay server-rendered for crawlers.
 */
export default function EpisodeNav({ item, n, base, hasPrev, hasNext, aired }: { item: Omit<WatchItem, "addedAt">; n: number; base: string; hasPrev: boolean; hasNext: boolean; aired: boolean }) {
  const router = useRouter();
  const { items, ready, importItems, setProgress } = useWatchlist();
  const saved = ready ? items.find((i) => i.id === item.id) : undefined;
  const progress = saved?.progress ?? 0;
  const tick = (k: number) => (saved && progress >= k ? " ✓" : "");
  const resume = saved && progress > 0 && progress + 1 !== n && (!saved.episodeCount || progress < saved.episodeCount) ? progress + 1 : null;
  const watchAndNext = () => {
    if (saved) setProgress(item.id, n);
    else importItems([{ ...item, progress: n, listStatus: "watching" }]);
    router.push(`${base}${n + 1}`);
  };
  return (
    <nav aria-label="Episodes" className="mt-4 flex flex-wrap items-center gap-2 text-sm">
      {hasPrev && <Link href={`${base}${n - 1}`} className="btn-outline px-3 py-1.5">← Ep {n - 1}{tick(n - 1)}</Link>}
      {hasNext && <Link href={`${base}${n + 1}`} className="btn-outline px-3 py-1.5">Ep {n + 1}{tick(n + 1)} →</Link>}
      {ready && aired && hasNext && progress < n && (
        <button type="button" onClick={watchAndNext} className="btn-primary px-3 py-1.5">✓ Watched · next episode →</button>
      )}
      {resume && <Link href={`${base}${resume}`} className="text-xs font-semibold text-violet hover:text-violet-2">Continue at episode {resume} →</Link>}
    </nav>
  );
}
