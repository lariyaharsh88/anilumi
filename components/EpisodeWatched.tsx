"use client";
import { useWatchlist, type WatchItem } from "@/lib/watchlist";
import { toast } from "./Toaster";

/**
 * "Mark episode N watched" on an aired episode page: sets My list progress to N (adding the show first if it isn't
 * saved), which feeds the spoiler shield and the "to catch up" count on the home page. Pressed again, it steps
 * back to N - 1 (not when progress is already past N). Nothing renders until hydration: the list is in this browser.
 */
export default function EpisodeWatched({ item, ep, className = "" }: { item: Omit<WatchItem, "addedAt">; ep: number; className?: string }) {
  const { items, ready, importItems, setProgress } = useWatchlist();
  if (!ready) return null;
  const saved = items.find((i) => i.id === item.id);
  const progress = saved?.progress ?? 0;
  const watched = progress >= ep;
  const click = () => {
    if (progress > ep) return; // further along: undoing from an earlier episode would lose that progress
    if (watched) {
      setProgress(item.id, ep - 1);
      toast({ text: `Episode ${ep} marked unwatched` });
    } else if (saved) {
      setProgress(item.id, ep);
      toast({ text: `Up to episode ${ep} of ${item.title}`, href: "/my", cta: "My list" });
    } else {
      importItems([{ ...item, progress: ep, listStatus: "watching" }]);
      toast({ text: `Added ${item.title}, up to episode ${ep}`, href: "/my", cta: "My list" });
    }
  };
  return (
    <div className={`flex flex-wrap items-center gap-x-3 gap-y-1 ${className}`}>
      <button type="button" onClick={click} aria-pressed={watched} className={watched ? "btn bg-emerald-600 text-snow hover:bg-emerald-700" : "btn-outline"}>
        {watched ? `✓ Watched episode ${ep}` : `Mark episode ${ep} watched`}
      </button>
      <span className="text-xs text-muted">
        {progress > ep ? `You're on episode ${progress}.` : watched ? "Tap again to undo." : saved ? `Saved progress: episode ${progress}.` : "Adds it to My list in this browser."}
      </span>
    </div>
  );
}
