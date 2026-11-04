"use client";
import { useWatchlist, readWatchlist, WatchItem } from "@/lib/watchlist";
import { syncOn } from "@/lib/sync";
import { toast } from "./Toaster";

const NUDGE_KEY = "anilumi:sync-nudge:v1";

/** Once per browser, when the third show is saved: suggest syncing the list to another device. */
function syncNudge(title: string): boolean {
  try {
    if (readWatchlist().length < 3 || syncOn() || localStorage.getItem(NUDGE_KEY)) return false;
    localStorage.setItem(NUDGE_KEY, String(Date.now()));
  } catch {
    return false;
  }
  toast({ text: `Added ${title}. Want this list on your phone too?`, href: "/my#sync", cta: "Turn on sync", ms: 9000 });
  return true;
}

export default function WatchButton({ item, compact = false }: { item: Omit<WatchItem, "addedAt">; compact?: boolean }) {
  const { has, toggle, ready } = useWatchlist();
  const saved = ready && has(item.id);
  return (
    <button
      type="button"
      onClick={() => {
        toggle(item);
        if (saved) toast({ text: `Removed ${item.title} from My list` });
        else if (!syncNudge(item.title)) toast({ text: `Added ${item.title} to My list`, href: "/my", cta: "View list" });
      }}
      aria-pressed={saved}
      className={compact ? `rounded-md px-2 py-1 text-xs font-semibold transition ${saved ? "bg-violet-strong text-snow" : "bg-bg-2 text-ink hover:bg-line"}` : saved ? "btn bg-violet-strong text-snow hover:opacity-90" : "btn-outline"}
      title={saved ? "Remove from my list" : "Add to my list (saved in this browser)"}
    >
      {saved ? "✓ In my list" : "+ My list"}
    </button>
  );
}
