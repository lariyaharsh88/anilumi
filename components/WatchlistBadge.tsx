"use client";
import Link from "@/components/Link";
import { useWatchlist } from "@/lib/watchlist";

export default function WatchlistBadge() {
  const { items, ready } = useWatchlist();
  return (
    <Link href="/my" className="relative whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-muted hover:bg-bg-2 hover:text-ink">
      My list
      {ready && items.length > 0 && <span className="ml-1 rounded-full bg-accent-strong px-1.5 text-[10px] font-bold text-white">{items.length}</span>}
    </Link>
  );
}
