"use client";
import { useEffect, useState } from "react";
import { AIRING_URL, upcomingOf, type AiringShow } from "@/lib/airing";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

const toTime = (iso: string) => new Date(iso.length === 10 ? `${iso}T00:00:00+09:00` : iso).getTime();

/**
 * Live countdown to an ISO timestamp. Renders nothing until hydrated so server HTML stays stable.
 * With `kitsuId`, a time that has already passed (the page can be a day or more old: it is cached that long) rolls
 * on to the show's next episode from the public airing snapshot, fetched by the browser, not the Worker.
 */
export default function Countdown({ iso, label = "Airs in", big = false, kitsuId }: { iso: string; label?: string; big?: boolean; kitsuId?: string }) {
  const [now, setNow] = useState<number | null>(null);
  const [next, setNext] = useState<{ episode: number; at: string } | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const passed = now !== null && toTime(iso) <= now;
  useEffect(() => {
    if (!kitsuId || !passed) return;
    let live = true;
    fetch(AIRING_URL)
      .then((r) => (r.ok ? (r.json() as Promise<{ shows?: AiringShow[] }>) : null))
      .then((snap) => { const up = upcomingOf(snap?.shows?.find((x) => x.k === kitsuId))[0]; if (live && up) setNext(up); })
      .catch(() => {});
    return () => { live = false; };
  }, [kitsuId, passed]);
  if (now === null) return null;
  const shown = next ? `Ep ${next.episode} ${label}` : label;
  const target = toTime(next?.at ?? iso);
  if (isNaN(target)) return null;
  const diff = target - now;
  if (diff <= 0) return <span className={big ? "text-lg font-bold text-accent-2" : "text-xs font-semibold text-accent-2"}>Out now</span>;
  const p = parts(diff);
  const cells: [number, string][] = [[p.d, "d"], [p.h, "h"], [p.m, "m"], [p.s, "s"]];
  if (big) {
    return (
      <div className="flex items-end gap-3" aria-live="polite">
        <span className="pb-1 text-xs font-semibold uppercase tracking-wider text-muted">{shown}</span>
        {cells.map(([v, u]) => (
          <span key={u} className="rounded-lg bg-bg-2 px-3 py-2 text-center">
            <span className="block text-2xl font-extrabold tabular-nums text-ink">{String(v).padStart(2, "0")}</span>
            <span className="text-[10px] uppercase text-muted">{u}</span>
          </span>
        ))}
      </div>
    );
  }
  return (
    <span className="text-xs font-semibold tabular-nums text-accent-2">
      {shown} {p.d > 0 ? `${p.d}d ` : ""}{p.h}h {String(p.m).padStart(2, "0")}m
    </span>
  );
}
