"use client";
import { useEffect, useState } from "react";
import { useSync } from "@/lib/sync";

const ago = (t: number) => {
  const s = Math.round((Date.now() - t) / 1000);
  return s < 60 ? "just now" : s < 3600 ? `${Math.round(s / 60)} min ago` : s < 86400 ? `${Math.round(s / 3600)} h ago` : `${Math.round(s / 86400)} days ago`;
};

/** "Use My list on your other devices": private sync code, no account. Rendered only when the database is on. */
export default function SyncPanel() {
  const [ready, setReady] = useState(false);
  useEffect(() => setReady(true), []);
  const { saved, busy, error, start, link, stop, erase, syncNow } = useSync(ready);
  const [mode, setMode] = useState<"idle" | "enter">("idle");
  const [code, setCode] = useState("");
  const [show, setShow] = useState(false);
  const [copied, setCopied] = useState(false);
  const [confirm, setConfirm] = useState(false);
  if (!ready) return null;

  if (saved) {
    const masked = show ? saved.code : `${saved.code.slice(0, 4)}-••••-••••-${saved.code.slice(-4)}`;
    return (
      <section className="card p-4" aria-labelledby="sync-h">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <h2 id="sync-h" className="font-semibold text-ink">🔄 Sync is on</h2>
          <p className="text-xs text-muted" role="status">{busy ? "Syncing…" : `Synced ${ago(saved.last)}`}</p>
        </div>
        <p className="mt-1 text-sm text-muted">Enter this code on another phone or computer (My list → “I have a sync code”) to use the same list there.</p>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <code className="rounded-lg border border-line bg-bg-2 px-3 py-2 font-mono text-base tracking-wider text-ink" aria-label="Your sync code">{masked}</code>
          <button type="button" className="btn-outline" onClick={() => setShow((v) => !v)}>{show ? "Hide" : "Show"}</button>
          <button type="button" className="btn-outline" onClick={async () => { try { await navigator.clipboard.writeText(saved.code); setCopied(true); setTimeout(() => setCopied(false), 1500); } catch { setShow(true); } }}>{copied ? "Copied" : "Copy"}</button>
          <button type="button" className="btn-outline" disabled={busy} onClick={() => syncNow()}>Sync now</button>
        </div>
        <p className="mt-2 text-xs text-muted">Keep it private: anyone with the code can see and change this list.</p>
        {error && <p className="mt-2 text-sm text-accent-2" role="alert">{error}</p>}
        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm">
          <button type="button" className="text-muted underline-offset-2 hover:text-ink hover:underline" onClick={stop}>Stop syncing on this device</button>
          {!confirm ? (
            <button type="button" className="text-muted underline-offset-2 hover:text-accent-2 hover:underline" onClick={() => setConfirm(true)}>Delete the synced copy</button>
          ) : (
            <span className="flex flex-wrap items-center gap-2 text-ink">Delete it for every device? Each keeps its own list. <button type="button" className="font-semibold text-accent-2 hover:underline" onClick={() => { setConfirm(false); erase(); }}>Delete</button><button type="button" className="text-muted hover:underline" onClick={() => setConfirm(false)}>Cancel</button></span>
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="card p-4" aria-labelledby="sync-h">
      <h2 id="sync-h" className="font-semibold text-ink">🔄 Use My list on your other devices</h2>
      <p className="mt-1 text-sm text-muted">No account needed. Turn on sync to get a private code, then enter it on your phone or laptop. Changes on any device show up on the others.</p>
      {mode === "idle" ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <button type="button" className="btn-primary" disabled={busy} onClick={start}>{busy ? "Setting up…" : "Turn on sync"}</button>
          <button type="button" className="btn-outline" onClick={() => setMode("enter")}>I have a sync code</button>
        </div>
      ) : (
        <form className="mt-3 flex flex-col gap-2 sm:flex-row" onSubmit={(e) => { e.preventDefault(); link(code); }}>
          <label htmlFor="sync-code" className="sr-only">Sync code</label>
          <input id="sync-code" className="input font-mono uppercase tracking-wider sm:max-w-xs" placeholder="XXXX-XXXX-XXXX-XXXX" autoComplete="off" spellCheck={false} value={code} onChange={(e) => setCode(e.target.value)} />
          <button type="submit" className="btn-primary" disabled={busy || code.replace(/[\s-]/g, "").length < 16}>{busy ? "Linking…" : "Link this device"}</button>
          <button type="button" className="btn-outline" onClick={() => setMode("idle")}>Cancel</button>
        </form>
      )}
      {mode === "enter" && <p className="mt-2 text-xs text-muted">Shows already on this device are kept and added to the synced list.</p>}
      {error && <p className="mt-2 text-sm text-accent-2" role="alert">{error}</p>}
    </section>
  );
}
