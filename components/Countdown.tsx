"use client";
import { useEffect, useState } from "react";

function parts(ms: number) {
  const s = Math.max(0, Math.floor(ms / 1000));
  return { d: Math.floor(s / 86400), h: Math.floor((s % 86400) / 3600), m: Math.floor((s % 3600) / 60), s: s % 60 };
}

/** Live countdown to an ISO timestamp. Renders nothing until hydrated so server HTML stays stable. */
export default function Countdown({ iso, label = "Airs in", big = false }: { iso: string; label?: string; big?: boolean }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  if (now === null) return null;
  const target = new Date(iso.length === 10 ? `${iso}T00:00:00+09:00` : iso).getTime();
  if (isNaN(target)) return null;
  const diff = target - now;
  if (diff <= 0) return <span className={big ? "text-lg font-bold text-accent-2" : "text-xs font-semibold text-accent-2"}>Out now</span>;
  const p = parts(diff);
  const cells: [number, string][] = [[p.d, "d"], [p.h, "h"], [p.m, "m"], [p.s, "s"]];
  if (big) {
    return (
      <div className="flex items-end gap-3" aria-live="polite">
        <span className="pb-1 text-xs font-semibold uppercase tracking-wider text-muted">{label}</span>
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
      {label} {p.d > 0 ? `${p.d}d ` : ""}{p.h}h {String(p.m).padStart(2, "0")}m
    </span>
  );
}
