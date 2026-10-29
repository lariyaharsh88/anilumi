"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { readWatchlist, readRemoved, applySynced, WATCHLIST_EVENT, type WatchItem } from "./watchlist";
import { listHash, type SyncDoc } from "./syncmerge";
import { send } from "./community-client";
import { track } from "./track";

const KEY = "anilumi:sync:v1";
type Saved = { code: string; last: number; hash: string };

const load = (): Saved | null => { try { return JSON.parse(localStorage.getItem(KEY) || "null"); } catch { return null; } };
const save = (s: Saved | null) => { try { if (s) localStorage.setItem(KEY, JSON.stringify(s)); else localStorage.removeItem(KEY); } catch { /* storage blocked */ } };
const local = (): SyncDoc => ({ items: readWatchlist(), removed: readRemoved() });

/** Write the merged copy back, keeping details only this device has fetched (runtime, genres…). */
function apply(merged: SyncDoc) {
  const mine = new Map(readWatchlist().map((i) => [i.id, i]));
  const items: WatchItem[] = merged.items.map((i) => ({ ...(mine.get(i.id) || {}), ...i }));
  applySynced(items, merged.removed);
  return listHash({ items, removed: merged.removed });
}

type Res = { code: string; items: WatchItem[]; removed: Record<string, number>; error?: string };

/**
 * My list sync by private code. Syncs when the page opens, a few seconds after any change to the list, and
 * when the tab comes back into view. Changes merge per show on the server; the newest edit wins.
 */
export function useSync(enabled: boolean) {
  const [saved, setSaved] = useState<Saved | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const running = useRef(false);

  const run = useCallback(async (s: Saved | null = load()) => {
    if (!s || running.current) return;
    const mine = local();
    running.current = true; setBusy(true);
    const res = await send<Res>("/api/sync", { action: "push", code: s.code, ...mine });
    running.current = false; setBusy(false);
    if (res.error) return setError(res.error);
    const hash = apply(res);
    const next = { code: s.code, last: Date.now(), hash };
    save(next); setSaved(next); setError("");
  }, []);

  // Load the saved code and sync once when the page opens.
  useEffect(() => {
    if (!enabled) return;
    const s = load();
    setSaved(s);
    if (s) run(s);
  }, [enabled, run]);

  // While a code is set (including one just created or linked), sync on list changes and on returning to the tab.
  const active = saved?.code;
  useEffect(() => {
    if (!enabled || !active) return;
    let t: ReturnType<typeof setTimeout> | undefined;
    const changed = () => {
      const cur = load();
      if (!cur || running.current || listHash(local()) === cur.hash) return; // our own write, or nothing new
      clearTimeout(t);
      t = setTimeout(() => run(), 2500);
    };
    const visible = () => { if (document.visibilityState === "visible") run(); };
    window.addEventListener(WATCHLIST_EVENT, changed);
    document.addEventListener("visibilitychange", visible);
    return () => { clearTimeout(t); window.removeEventListener(WATCHLIST_EVENT, changed); document.removeEventListener("visibilitychange", visible); };
  }, [enabled, active, run]);

  const start = useCallback(async () => {
    setBusy(true); setError("");
    const res = await send<Res>("/api/sync", { action: "create", ...local() });
    setBusy(false);
    if (res.error) return setError(res.error);
    const next = { code: res.code, last: Date.now(), hash: apply(res) };
    save(next); setSaved(next);
    track("sync_start", {});
  }, []);

  const link = useCallback(async (code: string) => {
    setBusy(true); setError("");
    const res = await send<Res>("/api/sync", { action: "push", code, ...local() });
    setBusy(false);
    if (res.error) return setError(res.error);
    const next = { code: res.code, last: Date.now(), hash: apply(res) };
    save(next); setSaved(next);
    track("sync_link", {});
  }, []);

  const stop = useCallback(() => { save(null); setSaved(null); setError(""); }, []);

  const erase = useCallback(async () => {
    const s = load();
    if (!s) return;
    setBusy(true);
    const res = await send("/api/sync", { action: "delete", code: s.code });
    setBusy(false);
    if (res.error) return setError(res.error);
    save(null); setSaved(null);
    track("sync_delete", {});
  }, []);

  return { saved, busy, error, start, link, stop, erase, syncNow: run };
}
