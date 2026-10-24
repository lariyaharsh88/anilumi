"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { TIERS, encodeTiers, type Tier, type TierState } from "@/lib/tierlist";
import { loadImg, drawCover, downloadCanvas, fit } from "@/lib/canvas";

export type TierItem = { id: string; slug: string; title: string; poster: string | null };
const COLORS: Record<Tier, string> = { S: "#ff7f7f", A: "#ffbf7f", B: "#ffdf7f", C: "#fdfd7f", D: "#bfff7f", F: "#7fdfff" };
type Where = Tier | "pool";

/** Tap-to-place (works on phones and with a keyboard) plus drag and drop on desktop. State lives in the URL. */
export default function TierMaker({ items, initialTiers, initialTitle }: { items: TierItem[]; initialTiers: TierState; initialTitle: string }) {
  const [known, setKnown] = useState<Record<string, TierItem>>(() => Object.fromEntries(items.map((i) => [i.id, i])));
  const [tiers, setTiers] = useState<TierState>(initialTiers);
  const [pool, setPool] = useState<string[]>(() => { const placed = new Set(Object.values(initialTiers).flat()); return items.map((i) => i.id).filter((id) => !placed.has(id)); });
  const [sel, setSel] = useState<string | null>(null);
  const [title, setTitle] = useState(initialTitle);
  const [q, setQ] = useState("");
  const [results, setResults] = useState<TierItem[]>([]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);

  const shareUrl = useMemo(() => {
    const p = new URLSearchParams();
    const s = encodeTiers(tiers);
    if (s) p.set("s", s);
    if (title.trim()) p.set("title", title.trim().slice(0, 60));
    return `/tier-list${p.size ? `?${p}` : ""}`;
  }, [tiers, title]);
  useEffect(() => { window.history.replaceState(null, "", shareUrl); }, [shareUrl]);

  useEffect(() => {
    if (q.trim().length < 2) { setResults([]); return; }
    const t = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(q.trim())}`).then((r) => r.json()).then((d: { items: TierItem[] }) => setResults(d.items)).catch(() => setResults([]));
    }, 300);
    return () => clearTimeout(t);
  }, [q]);

  const move = (id: string, to: Where) => {
    setTiers((cur) => { const n = { ...cur }; for (const k of TIERS) n[k] = cur[k].filter((x) => x !== id); if (to !== "pool") n[to] = [...n[to], id]; return n; });
    setPool((cur) => { const n = cur.filter((x) => x !== id); return to === "pool" ? [...n, id] : n; });
    setSel(null);
  };
  const add = (it: TierItem) => {
    setKnown((k) => ({ ...k, [it.id]: it }));
    if (!pool.includes(it.id) && !Object.values(tiers).flat().includes(it.id)) setPool((p) => [it.id, ...p]);
    setSel(it.id);
  };
  const onDrop = (to: Where) => (e: React.DragEvent) => { e.preventDefault(); const id = e.dataTransfer.getData("text/plain"); if (id) move(id, to); };

  const tile = (id: string) => {
    const it = known[id];
    if (!it) return null;
    return (
      <button key={id} type="button" draggable onDragStart={(e) => e.dataTransfer.setData("text/plain", id)} onClick={(e) => { e.stopPropagation(); setSel(sel === id ? null : id); }}
        aria-pressed={sel === id} title={it.title}
        className={`relative h-[84px] w-[60px] shrink-0 overflow-hidden rounded-md bg-bg-2 ring-offset-2 ring-offset-bg transition sm:h-[98px] sm:w-[70px] ${sel === id ? "scale-105 ring-2 ring-accent" : "hover:ring-2 hover:ring-white/40"}`}>
        {it.poster ? <Image src={it.poster} alt={it.title} fill sizes="70px" className="pointer-events-none object-cover" /> : <span className="p-1 text-[10px]">{it.title}</span>}
      </button>
    );
  };

  const exportPng = async () => {
    setBusy(true);
    const W = 1200, label = 110, pw = 80, ph = 112, gap = 8, perRow = Math.floor((W - label - gap) / (pw + gap));
    const rows = TIERS.map((k) => ({ k, ids: tiers[k], h: Math.max(1, Math.ceil(tiers[k].length / perRow)) * (ph + gap) + gap }));
    const H = 90 + rows.reduce((n, r) => n + r.h + 4, 0) + 44;
    const c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d")!;
    ctx.fillStyle = "#0b0d13"; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = "#e8ecf5"; ctx.font = "800 38px system-ui, sans-serif"; ctx.textBaseline = "middle";
    ctx.fillText(fit(ctx, title.trim() || "My anime tier list", W - 40), 20, 46);
    const imgs = new Map(await Promise.all(Object.values(tiers).flat().map(async (id) => [id, await loadImg(known[id]?.poster)] as const)));
    let y = 90;
    for (const r of rows) {
      ctx.fillStyle = COLORS[r.k]; ctx.fillRect(0, y, label, r.h);
      ctx.fillStyle = "#161b28"; ctx.fillRect(label, y, W - label, r.h);
      ctx.fillStyle = "#111"; ctx.font = "900 46px system-ui, sans-serif"; ctx.textAlign = "center"; ctx.fillText(r.k, label / 2, y + r.h / 2); ctx.textAlign = "left";
      r.ids.forEach((id, i) => drawCover(ctx, imgs.get(id) || null, label + gap + (i % perRow) * (pw + gap), y + gap + Math.floor(i / perRow) * (ph + gap), pw, ph, 6));
      y += r.h + 4;
    }
    ctx.fillStyle = "#8f9ab3"; ctx.font = "600 18px system-ui, sans-serif"; ctx.fillText("Made on anilumi.in/tier-list", 20, H - 22);
    downloadCanvas(c, `${(title.trim() || "anime-tier-list").toLowerCase().replace(/[^a-z0-9]+/g, "-")}.png`);
    setBusy(false);
  };

  const copy = async () => {
    try { await navigator.clipboard.writeText(`${location.origin}${shareUrl}`); setNote("Link copied"); } catch { setNote("Copy the address bar to share"); }
    setTimeout(() => setNote(""), 2000);
  };

  return (
    <div className="mt-8">
      <div className="flex flex-wrap items-center gap-2">
        <label className="sr-only" htmlFor="tl-title">Tier list title</label>
        <input id="tl-title" value={title} maxLength={60} onChange={(e) => setTitle(e.target.value)} placeholder="My anime tier list" className="input min-w-0 flex-1 text-lg font-bold sm:max-w-md" />
        <button type="button" onClick={exportPng} disabled={busy} className="btn-primary">{busy ? "Rendering…" : "Download image"}</button>
        <button type="button" onClick={copy} className="btn-outline">{note || "Copy share link"}</button>
        <button type="button" onClick={() => { setPool((p) => [...Object.values(tiers).flat(), ...p]); setTiers({ S: [], A: [], B: [], C: [], D: [], F: [] }); }} className="btn-outline">Reset</button>
      </div>
      <p className="mt-2 text-xs text-muted">{sel ? `Selected “${known[sel]?.title}”. Tap a tier letter or row to place it, or tap it again to cancel.` : "Tap a poster, then tap a tier. On desktop you can also drag."}</p>

      <div className="mt-3 overflow-hidden rounded-2xl border border-line">
        {TIERS.map((k) => (
          <div key={k} onClick={() => sel && move(sel, k)} onDragOver={(e) => e.preventDefault()} onDrop={onDrop(k)} className={`flex min-h-[100px] border-b border-line last:border-0 sm:min-h-[114px] ${sel ? "cursor-pointer" : ""}`}>
            <button type="button" onClick={(e) => { e.stopPropagation(); if (sel) move(sel, k); }} aria-label={`Place in tier ${k}`} className="grid w-14 shrink-0 place-items-center text-3xl font-black text-neutral-900 sm:w-20" style={{ background: COLORS[k] }}>{k}</button>
            <div className="flex flex-1 flex-wrap content-start gap-2 bg-bg-2/60 p-2">{tiers[k].map(tile)}</div>
          </div>
        ))}
      </div>

      <section className="mt-6" aria-labelledby="pool-h" onDragOver={(e) => e.preventDefault()} onDrop={onDrop("pool")}>
        <div className="flex flex-wrap items-end justify-between gap-2">
          <h2 id="pool-h" className="h-section">Unranked ({pool.length})</h2>
          <div className="relative w-full sm:w-72">
            <label className="sr-only" htmlFor="tl-search">Add an anime</label>
            <input id="tl-search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Add any anime…" className="input w-full" autoComplete="off" />
            {results.length > 0 && (
              <ul className="absolute right-0 z-20 mt-1 max-h-72 w-full overflow-auto rounded-xl border border-line bg-bg-2 p-1 shadow-2xl">
                {results.map((r) => <li key={r.id}><button type="button" onClick={() => { add(r); setQ(""); }} className="w-full truncate rounded-lg px-3 py-2 text-left text-sm hover:bg-white/5">{r.title}</button></li>)}
              </ul>
            )}
          </div>
        </div>
        <div onClick={() => sel && move(sel, "pool")} className="card mt-3 flex min-h-[110px] flex-wrap content-start gap-2 p-3">{pool.map(tile)}</div>
      </section>
    </div>
  );
}
