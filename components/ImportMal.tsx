"use client";
import { useState } from "react";
import { useWatchlist, type WatchItem } from "@/lib/watchlist";
import { parseMalXml } from "@/lib/mal";

/** Read a MyAnimeList export (.xml or .xml.gz) in the browser and merge it into My list. */
export default function ImportMal({ compact = false }: { compact?: boolean }) {
  const { importItems } = useWatchlist();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const onFile = async (file: File | undefined) => {
    if (!file) return;
    setBusy(true); setMsg(null);
    try {
      let text: string;
      if (/\.gz$/i.test(file.name) && "DecompressionStream" in window) text = await new Response(file.stream().pipeThrough(new DecompressionStream("gzip"))).text();
      else text = await file.text();
      const all = parseMalXml(text);
      if (!all.length) { setMsg({ ok: false, text: "That doesn't look like a MyAnimeList anime export." }); return; }
      const keep = all.filter((e) => e.status === "watching" || e.status === "planning" || e.status === "paused");
      const r = await fetch("/api/import/mal", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ entries: keep.map(({ malId, status, progress }) => ({ malId, status, progress })) }) });
      const d = (await r.json()) as { ok: boolean; message?: string; items?: Omit<WatchItem, "addedAt">[]; unmatched?: number };
      if (!d.ok || !d.items) { setMsg({ ok: false, text: d.message || "Import failed." }); return; }
      const added = importItems(d.items);
      const skipped = all.length - keep.length;
      setMsg({ ok: true, text: `Imported ${d.items.length} shows: ${added} new, ${d.items.length - added} updated.${d.unmatched ? ` ${d.unmatched} couldn't be matched.` : ""}${skipped ? ` ${skipped} completed or dropped titles were left out.` : ""}` });
    } catch {
      setMsg({ ok: false, text: "Couldn't read that file." });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className={compact ? "" : "card p-4"}>
      {!compact && (
        <>
          <h2 className="font-semibold">Import from MyAnimeList</h2>
          <p className="mt-1 text-sm text-muted">On MAL, open <a href="https://myanimelist.net/panel.php?go=export" target="_blank" rel="noopener" className="text-violet hover:underline">Export</a>, download your anime list, then pick the file here. It&apos;s read in your browser; only titles and progress are matched, and nothing is stored on our side.</p>
        </>
      )}
      <label className={`btn-outline mt-3 inline-flex cursor-pointer ${busy ? "pointer-events-none opacity-60" : ""}`}>
        {busy ? "Importing…" : "Choose MAL export file"}
        <input type="file" accept=".xml,.gz,application/xml,text/xml,application/gzip" className="sr-only" onChange={(e) => onFile(e.target.files?.[0])} />
      </label>
      {msg && <p className={`mt-2 text-sm ${msg.ok ? "text-ink/90" : "text-accent-2"}`} role="status">{msg.text}</p>}
    </div>
  );
}
