"use client";
import { useEffect, useState, useCallback } from "react";

export type WatchItem = {
  id: string; slug: string; title: string; poster: string | null; status: string; nextRelease: string | null; addedAt: number;
  /** Filled in by the /api/anime refresh on the My list page. */
  runtime?: number; episodeCount?: number | null; episodeLength?: number | null; genres?: string[]; subtype?: string; rating?: number | null;
  /** Episodes watched, and where it sits in the user's list (from an AniList import or set by hand). */
  progress?: number; listStatus?: "watching" | "planning" | "paused" | "rewatching";
};
const KEY = "anilumi:watchlist:v1";
const EVT = "anilumi:watchlist";

export function readWatchlist(): WatchItem[] {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as WatchItem[]) : [];
  } catch {
    return [];
  }
}

function write(items: WatchItem[]) {
  try {
    localStorage.setItem(KEY, JSON.stringify(items));
  } catch {
    /* private mode / quota: keep in-memory state only */
  }
  window.dispatchEvent(new Event(EVT));
}

/** Reactive watchlist backed by localStorage. `ready` is false until hydration so server HTML matches. */
export function useWatchlist() {
  const [items, setItems] = useState<WatchItem[]>([]);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const sync = () => setItems(readWatchlist());
    sync();
    setReady(true);
    window.addEventListener(EVT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);
  const has = useCallback((id: string) => items.some((i) => i.id === id), [items]);
  const toggle = useCallback((item: Omit<WatchItem, "addedAt">) => {
    const cur = readWatchlist();
    write(cur.some((i) => i.id === item.id) ? cur.filter((i) => i.id !== item.id) : [...cur, { ...item, addedAt: Date.now() }]);
  }, []);
  const remove = useCallback((id: string) => write(readWatchlist().filter((i) => i.id !== id)), []);
  const update = useCallback((patch: Partial<WatchItem>[]) => {
    const cur = readWatchlist();
    write(cur.map((i) => ({ ...i, ...(patch.find((p) => p.id === i.id) || {}) })));
  }, []);
  /** Add new items and refresh progress/status on existing ones; returns how many were new. */
  const importItems = useCallback((incoming: Omit<WatchItem, "addedAt">[]) => {
    const cur = readWatchlist();
    const byId = new Map(cur.map((i) => [i.id, i]));
    let added = 0;
    for (const it of incoming) {
      const prev = byId.get(it.id);
      if (prev) byId.set(it.id, { ...prev, ...it, addedAt: prev.addedAt });
      else { byId.set(it.id, { ...it, addedAt: Date.now() }); added++; }
    }
    write([...byId.values()]);
    return added;
  }, []);
  const setProgress = useCallback((id: string, progress: number) => {
    write(readWatchlist().map((i) => (i.id === id ? { ...i, progress: Math.max(0, i.episodeCount ? Math.min(progress, i.episodeCount) : progress) } : i)));
  }, []);
  return { items, ready, has, toggle, remove, update, importItems, setProgress };
}
