"use client";
import { useWatchlist, WatchItem } from "@/lib/watchlist";

export default function WatchButton({ item, compact = false }: { item: Omit<WatchItem, "addedAt">; compact?: boolean }) {
  const { has, toggle, ready } = useWatchlist();
  const saved = ready && has(item.id);
  return (
    <button
      type="button"
      onClick={() => toggle(item)}
      aria-pressed={saved}
      className={compact ? `rounded-md px-2 py-1 text-xs font-semibold transition ${saved ? "bg-violet text-white" : "bg-bg-2 text-ink hover:bg-line"}` : saved ? "btn bg-violet text-white hover:opacity-90" : "btn-outline"}
      title={saved ? "Remove from my list" : "Add to my list (saved in this browser)"}
    >
      {saved ? "✓ In my list" : "+ My list"}
    </button>
  );
}
