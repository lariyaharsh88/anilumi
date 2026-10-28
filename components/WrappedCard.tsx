"use client";
import { useEffect, useRef, useState } from "react";
import Link from "@/components/Link";
import Image from "next/image";
import { useWatchlist, type WatchItem } from "@/lib/watchlist";
import { computeWrapped } from "@/lib/wrapped";
import { loadImg, drawCover, downloadCanvas, fit } from "@/lib/canvas";
import ImportAniList from "./ImportAniList";
import ImportMal from "./ImportMal";
import { track } from "@/lib/track";

const hrs = (m: number) => (m >= 120 ? `${Math.round(m / 60).toLocaleString("en-US")} h` : `${m} min`);

/** Story-style summary of My list, exportable as a 1080×1350 image. Everything stays in the browser. */
export default function WrappedCard() {
  const { items, ready, update } = useWatchlist();
  const year = new Date().getFullYear();
  const [busy, setBusy] = useState(false);
  const refreshed = useRef(false);

  // Fill in genres/runtime for items added before the list page refreshed them.
  useEffect(() => {
    if (!ready || refreshed.current) return;
    const stale = items.filter((i) => !i.genres || i.runtime === undefined).slice(0, 60);
    refreshed.current = true;
    if (!stale.length) return;
    fetch(`/api/anime?ids=${stale.map((i) => i.id).join(",")}`).then((r) => r.json()).then((d: { items: Partial<WatchItem>[] }) => update(d.items)).catch(() => {});
  }, [ready, items, update]);

  if (!ready) return <p className="mt-8 text-sm text-muted">Loading your list…</p>;
  if (!items.length)
    return (
      <div className="card mx-auto mt-8 max-w-xl p-6 text-center">
        <p className="font-semibold">Your list is empty, so there&apos;s nothing to wrap yet.</p>
        <p className="mt-1 text-sm text-muted">Import your list or press “+ My list” on the shows you watch.</p>
        <div className="mt-4 flex flex-col items-center gap-3"><ImportAniList compact /><ImportMal compact /></div>
      </div>
    );

  const w = computeWrapped(items);
  const posters = [...items].sort((a, b) => (b.progress || 0) - (a.progress || 0)).slice(0, 4);

  const exportPng = async () => {
    setBusy(true);
    const W = 1080, H = 1350, c = document.createElement("canvas");
    c.width = W; c.height = H;
    const ctx = c.getContext("2d")!;
    const g = ctx.createLinearGradient(0, 0, W, H);
    g.addColorStop(0, "#2a0f2a"); g.addColorStop(0.55, "#120f2e"); g.addColorStop(1, "#0b0d13");
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    ctx.textBaseline = "top"; ctx.fillStyle = "#ff7a8f"; ctx.font = "700 34px system-ui, sans-serif";
    ctx.fillText(`MY ${year} ANIME WRAPPED`, 70, 70);
    ctx.fillStyle = "#ffffff"; ctx.font = "900 76px system-ui, sans-serif";
    ctx.fillText(fit(ctx, w.persona.title, W - 140), 70, 130);
    ctx.fillStyle = "#c9cfdd"; ctx.font = "500 34px system-ui, sans-serif";
    ctx.fillText(fit(ctx, w.persona.line, W - 140), 70, 230);
    const imgs = await Promise.all(posters.map((p) => loadImg(p.poster)));
    imgs.forEach((img, i) => drawCover(ctx, img, 70 + i * 240, 320, 215, 305, 18));
    const stats: [string, string][] = [[hrs(w.minutesWatched), "watched"], [w.episodesWatched.toLocaleString("en-US"), "episodes"], [String(w.total), "shows on my list"], [hrs(w.minutesPlanned), "still to watch"]];
    stats.forEach(([v, l], i) => {
      const x = 70 + (i % 2) * 480, y = 690 + Math.floor(i / 2) * 170;
      ctx.fillStyle = "#ffffff"; ctx.font = "900 72px system-ui, sans-serif"; ctx.fillText(v, x, y);
      ctx.fillStyle = "#8f9ab3"; ctx.font = "600 30px system-ui, sans-serif"; ctx.fillText(l, x, y + 86);
    });
    ctx.fillStyle = "#ffd88a"; ctx.font = "700 32px system-ui, sans-serif";
    ctx.fillText(fit(ctx, `Top genres: ${w.topGenres.slice(0, 3).map((x) => x.name).join(" · ") || "—"}`, W - 140), 70, 1050);
    if (w.mostWatched) { ctx.fillStyle = "#c9cfdd"; ctx.font = "500 30px system-ui, sans-serif"; ctx.fillText(fit(ctx, `Most watched: ${w.mostWatched.title}`, W - 140), 70, 1110); }
    ctx.fillStyle = "#8f9ab3"; ctx.font = "600 28px system-ui, sans-serif"; ctx.fillText("Make yours at anilumi.in/my/wrapped", 70, H - 90);
    downloadCanvas(c, `anime-wrapped-${year}.png`);
    track("wrapped_download", { shows: w.total });
    setBusy(false);
  };

  return (
    <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr] lg:items-start">
      <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-gradient-to-br from-[#2a0f2a] via-[#120f2e] to-bg p-6 shadow-[0_30px_80px_-40px_rgba(0,0,0,.9)]">
        <p className="text-xs font-bold uppercase tracking-[.2em] text-accent-2">My {year} anime wrapped</p>
        <p className="mt-2 text-3xl font-black leading-tight text-white">{w.persona.title}</p>
        <p className="mt-1 text-sm text-ink/75">{w.persona.line}</p>
        <div className="mt-5 grid grid-cols-4 gap-2">
          {posters.map((p) => <span key={p.id} className="relative aspect-[5/7] overflow-hidden rounded-lg bg-bg-2">{p.poster && <Image src={p.poster} alt="" fill sizes="100px" className="object-cover" />}</span>)}
        </div>
        <dl className="mt-6 grid grid-cols-2 gap-4">
          {[[hrs(w.minutesWatched), "watched"], [w.episodesWatched.toLocaleString("en-US"), "episodes"], [String(w.total), "shows on my list"], [hrs(w.minutesPlanned), "still to watch"]].map(([v, l]) => (
            <div key={l}><dd className="text-3xl font-black text-white">{v}</dd><dt className="text-xs text-muted">{l}</dt></div>
          ))}
        </dl>
        <p className="mt-5 text-sm font-semibold text-[#ffd88a]">Top genres: {w.topGenres.slice(0, 3).map((x) => x.name).join(" · ") || "—"}</p>
        {w.mostWatched && <p className="mt-1 text-sm text-ink/75">Most watched: {w.mostWatched.title}</p>}
      </div>
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportPng} disabled={busy} className="btn-primary">{busy ? "Rendering…" : "Download card (1080×1350)"}</button>
          <Link href="/my" className="btn-outline">Edit my list</Link>
        </div>
        {w.topGenres.length > 0 && (
          <div className="card p-4">
            <h2 className="font-semibold">Your genres</h2>
            <ul className="mt-3 space-y-2">
              {w.topGenres.map((x) => (
                <li key={x.name} className="grid grid-cols-[110px_1fr_auto] items-center gap-3 text-sm">
                  <span className="truncate text-ink/90">{x.name}</span>
                  <span className="h-2 overflow-hidden rounded-full bg-white/10"><span className="block h-full rounded-full bg-gradient-to-r from-accent to-violet" style={{ width: `${(x.count / w.topGenres[0].count) * 100}%` }} /></span>
                  <span className="tabular-nums text-muted">{x.count}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
        <div className="card p-4 text-sm text-muted">
          <p>{w.watching} watching · {w.planning} planned · {w.airing} airing now.{w.nextUp ? ` Next up: ${w.nextUp.title}.` : ""}</p>
          <p className="mt-1">Hours count the episodes you&apos;ve marked as watched. Import from AniList or MyAnimeList to bring your progress in.</p>
        </div>
      </div>
    </div>
  );
}
