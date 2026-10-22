"use client";
import { useState } from "react";
import { useWatchlist, type WatchItem } from "@/lib/watchlist";

const KEY = "anilumi:anilist-user";
const read = () => { try { return localStorage.getItem(KEY) || ""; } catch { return ""; } };

/** Pulls a public AniList list into My list (merge, never deletes). Nothing is stored server-side. */
export default function ImportAniList({ compact = false }: { compact?: boolean }) {
  const { importItems } = useWatchlist();
  const [user, setUser] = useState(read);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const run = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!user.trim()) return;
    setBusy(true); setMsg(null);
    try {
      const r = await fetch(`/api/import/anilist?user=${encodeURIComponent(user.trim())}`, { cache: "no-store" });
      const d = (await r.json()) as { ok: boolean; message?: string; user?: string; items?: Omit<WatchItem, "addedAt">[]; unmatched?: number; truncated?: boolean };
      if (!d.ok || !d.items) { setMsg({ ok: false, text: d.message || "Import failed." }); return; }
      const added = importItems(d.items);
      try { localStorage.setItem(KEY, d.user || user.trim()); } catch { /* storage blocked */ }
      const watching = d.items.filter((i) => i.listStatus === "watching" || i.listStatus === "rewatching").length;
      setMsg({ ok: true, text: `Imported ${d.items.length} shows from ${d.user} (${watching} watching): ${added} new, ${d.items.length - added} updated.${d.unmatched ? ` ${d.unmatched} couldn't be matched.` : ""}${d.truncated ? " Only the first 200 were imported." : ""}` });
    } catch {
      setMsg({ ok: false, text: "Couldn't reach the import service." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={compact ? "" : "card p-4"}>
      {!compact && (
        <>
          <h2 className="font-semibold">Import from AniList</h2>
          <p className="mt-1 text-sm text-muted">Brings in what you&apos;re watching, planning, paused on or rewatching, with your episode progress. The list must be public. It&apos;s read once and saved only in this browser.</p>
        </>
      )}
      <form onSubmit={run} className="mt-3 flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="anilist-user">AniList username</label>
        <input id="anilist-user" value={user} onChange={(e) => setUser(e.target.value)} placeholder="AniList username" autoComplete="off" className="input w-56" />
        <button type="submit" disabled={busy || !user.trim()} className="btn-primary">{busy ? "Importing…" : read() && read() === user.trim() ? "Sync again" : "Import"}</button>
      </form>
      {msg && <p className={`mt-2 text-sm ${msg.ok ? "text-ink/90" : "text-accent-2"}`} role="status">{msg.text}</p>}
    </div>
  );
}
