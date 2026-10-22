"use client";
import { useWatchlist, type WatchItem } from "@/lib/watchlist";

/** "I've watched up to here": sets progress to this episode (adding the show to My list if needed). */
export default function WatchedUpTo({ item, ep }: { item: Omit<WatchItem, "addedAt" | "progress">; ep: number }) {
  const { items, ready, importItems, setProgress } = useWatchlist();
  if (!ready) return null;
  const saved = items.find((i) => i.id === item.id);
  const at = saved?.progress;
  if (typeof at === "number" && at >= ep) {
    return <p className="mt-3 text-sm text-muted">✓ You&apos;ve watched up to episode {at}. <button type="button" onClick={() => setProgress(item.id, ep - 1)} className="text-violet hover:underline">Undo this episode</button></p>;
  }
  return (
    <button
      type="button"
      onClick={() => (saved ? setProgress(item.id, ep) : importItems([{ ...item, progress: ep, listStatus: "watching" }]))}
      className="btn-outline mt-3"
    >
      ✓ I&apos;ve watched up to episode {ep}
    </button>
  );
}
