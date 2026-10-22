"use client";
import { useEffect, useMemo, useState } from "react";
import type { Broadcast } from "@/lib/kitsu";

// Sequential blue, validated as an ordinal ramp on the #161b28 card (monotone L, single hue, >= 2:1 at the faint end).
const RAMP = ["#184f95", "#256abf", "#3987e5", "#6da7ec", "#9ec5f4"];
const EMPTY = "#1d2333";
const DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const LONG = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

/** Weekday × hour grid of broadcasts, bucketed in the viewer's own time zone after mount. */
export default function AiringHeatmap({ broadcasts }: { broadcasts: Broadcast[] }) {
  const [tz, setTz] = useState<string | null>(null);
  const [active, setActive] = useState<{ d: number; h: number } | null>(null);
  useEffect(() => setTz(Intl.DateTimeFormat().resolvedOptions().timeZone), []);

  const grid = useMemo(() => {
    const cells: Broadcast[][][] = Array.from({ length: 7 }, () => Array.from({ length: 24 }, () => []));
    if (!tz) return cells;
    for (const b of broadcasts) {
      const d = new Date(b.at * 1000);
      cells[(d.getDay() + 6) % 7][d.getHours()].push(b);
    }
    for (const row of cells) for (const c of row) c.sort((x, y) => y.popularity - x.popularity);
    return cells;
  }, [broadcasts, tz]);

  if (!broadcasts.length) return null;
  const max = Math.max(1, ...grid.flat().map((c) => c.length));
  const bin = (n: number) => (n === 0 ? -1 : Math.min(RAMP.length - 1, Math.floor(((n - 1) / max) * RAMP.length)));
  const ranges = RAMP.map((_, i) => {
    const lo = Math.floor((i * max) / RAMP.length) + 1, hi = Math.floor(((i + 1) * max) / RAMP.length);
    return lo >= hi ? `${hi}` : `${lo}–${hi}`;
  });
  const hourFmt = (h: number) => new Date(2026, 0, 5, h).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" });
  const tick = (h: number) => new Date(2026, 0, 5, h).toLocaleTimeString(undefined, { hour: "numeric" }).replace(/\s?([AP])M/i, (_, x: string) => x.toLowerCase());
  let peak = { d: 0, h: 0, n: 0 };
  grid.forEach((row, d) => row.forEach((c, h) => { if (c.length > peak.n) peak = { d, h, n: c.length }; }));
  const night = grid.reduce((n, row) => n + [21, 22, 23, 0, 1, 2].reduce((m, h) => m + row[h].length, 0), 0);
  const total = broadcasts.length;
  const cell = active ? grid[active.d][active.h] : null;

  const move = (e: React.KeyboardEvent) => {
    const a = active ?? { d: peak.d, h: peak.h };
    const k = e.key;
    if (!["ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(k)) return;
    e.preventDefault();
    setActive({ d: k === "ArrowUp" ? Math.max(0, a.d - 1) : k === "ArrowDown" ? Math.min(6, a.d + 1) : a.d, h: k === "ArrowLeft" ? Math.max(0, a.h - 1) : k === "ArrowRight" ? Math.min(23, a.h + 1) : a.h });
  };

  return (
    <figure className="card p-4">
      <figcaption>
        <h3 className="font-semibold text-ink">When anime airs, in your time zone</h3>
        <p className="mt-0.5 text-xs text-muted">
          {tz ? <>{total} Japanese TV broadcasts in the next 7 days, shown in {tz.replace(/_/g, " ")}. Busiest slot: {LONG[peak.d]} {hourFmt(peak.h)} ({peak.n}). {Math.round((night / total) * 100)}% air between 9 pm and 3 am your time.</> : "Loading your time zone…"}
        </p>
      </figcaption>
      {tz && (
        <>
          <div className="relative mt-4 overflow-x-auto">
            <div
              role="grid"
              aria-label="Broadcasts per weekday and hour; use arrow keys to move between cells"
              tabIndex={0}
              onKeyDown={move}
              onFocus={() => setActive((a) => a ?? { d: peak.d, h: peak.h })}
              onBlur={() => setActive(null)}
              onPointerLeave={() => setActive(null)}
              className="min-w-[340px] rounded outline-none focus-visible:ring-2 focus-visible:ring-ink/60"
            >
              <div className="grid grid-cols-[2.25rem_repeat(24,minmax(0,1fr))] gap-[2px] text-[9px] text-muted">
                <span />
                {Array.from({ length: 24 }, (_, h) => <span key={h} className="text-center">{h % 3 === 0 ? tick(h) : ""}</span>)}
                {grid.map((row, d) => (
                  <div key={d} role="row" className="contents">
                    <span className="self-center pr-1 text-right text-[10px]">{DAYS[d]}</span>
                    {row.map((c, h) => {
                      const b = bin(c.length);
                      const on = active?.d === d && active.h === h;
                      return (
                        <span
                          key={h}
                          role="gridcell"
                          aria-label={`${LONG[d]} ${hourFmt(h)}: ${c.length} broadcast${c.length === 1 ? "" : "s"}`}
                          onPointerEnter={() => setActive({ d, h })}
                          className={`aspect-square rounded-[3px] ${on ? "ring-2 ring-ink" : ""}`}
                          style={{ background: b < 0 ? EMPTY : RAMP[b] }}
                        />
                      );
                    })}
                  </div>
                ))}
              </div>
            </div>
            {active && cell && (
              <div className="pointer-events-none absolute z-10 w-max max-w-[260px] rounded-md border border-line bg-bg px-2 py-1 text-xs shadow-card" style={{ left: `clamp(0px, calc(2.25rem + ${(active.h + 0.5) / 24} * (100% - 2.25rem) - 110px), calc(100% - 230px))`, top: `${(active.d + 1) * 16 + 18}px` }}>
                <strong className="block text-ink">{cell.length} broadcast{cell.length === 1 ? "" : "s"}</strong>
                <span className="text-muted">{LONG[active.d]}, {hourFmt(active.h)}–{hourFmt((active.h + 1) % 24)}</span>
                {cell.slice(0, 3).map((b) => <span key={`${b.title}-${b.episode}`} className="block truncate text-ink/80">{b.title} · ep {b.episode}</span>)}
                {cell.length > 3 && <span className="block text-muted">+{cell.length - 3} more</span>}
              </div>
            )}
          </div>
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[11px] text-muted">
            <span>Broadcasts per hour:</span>
            <span className="flex items-center gap-1"><span className="h-3 w-3 rounded-[3px]" style={{ background: EMPTY }} />0</span>
            {RAMP.map((c, i) => <span key={c} className="flex items-center gap-1"><span className="h-3 w-3 rounded-[3px]" style={{ background: c }} />{ranges[i]}</span>)}
          </div>
          <details className="mt-3 text-xs text-muted">
            <summary className="cursor-pointer select-none hover:text-ink">Show as table</summary>
            <table className="mt-2 w-full border-collapse">
              <thead><tr><th className="border-b border-line py-1 text-left font-medium">Day</th><th className="border-b border-line py-1 text-right font-medium">Broadcasts</th><th className="border-b border-line py-1 pl-4 text-left font-medium">Busiest hours</th></tr></thead>
              <tbody>
                {grid.map((row, d) => {
                  const top = row.map((c, h) => ({ h, n: c.length })).filter((x) => x.n).sort((x, y) => y.n - x.n).slice(0, 3);
                  return (
                    <tr key={d}>
                      <td className="border-b border-line/50 py-1 text-ink/90">{LONG[d]}</td>
                      <td className="border-b border-line/50 py-1 text-right tabular-nums text-ink/90">{row.reduce((n, c) => n + c.length, 0)}</td>
                      <td className="border-b border-line/50 py-1 pl-4 text-ink/90">{top.map((t) => `${hourFmt(t.h)} (${t.n})`).join(", ") || "–"}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </details>
        </>
      )}
    </figure>
  );
}
