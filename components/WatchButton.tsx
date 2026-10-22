"use client";
import { useWatchlist, WatchItem } from "@/lib/watchlist";
import { toast } from "./Toaster";

export default function WatchButton({ item, compact = false }: { item: Omit<WatchItem, "addedAt">; compact?: boolean }) {
  const { has, toggle, ready } = useWatchlist();
  const saved = ready && has(item.id);
  return (
    <button
      type="button"
      onClick={() => { toggle(item); toast(saved ? { text: `Removed ${item.title} from My list` } : { text: `Added ${item.title} to My list`, href: "/my", cta: "View list" }); }}
      aria-pressed={saved}
      className={compact ? `rounded-md px-2 py-1 text-xs font-semibold transition ${saved ? "bg-violet-strong text-white" : "bg-bg-2 text-ink hover:bg-line"}` : saved ? "btn bg-violet-strong text-white hover:opacity-90" : "btn-outline"}
      title={saved ? "Remove from my list" : "Add to my list (saved in this browser)"}
    >
      {saved ? "✓ In my list" : "+ My list"}
    </button>
  );
}
