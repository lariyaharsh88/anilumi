"use client";
import { useState } from "react";

type Series = { key: string; label: string };
type Props = {
  title: string;
  subtitle?: string;
  series: [Series, Series];
  categories: { key: string; label: string }[];
  /** values[s][c] */
  values: [number[], number[]];
  /** Formats a value for labels, tooltip and table (e.g. "41%"). */
  unit?: "%" | "";
  height?: number;
};

const FILL = ["bg-viz-1", "bg-viz-2"]; // validated pair on #161b28: adjacent CVD and contrast pass
const nice = (v: number) => { const step = [1, 2, 2.5, 5, 10, 20, 25, 50, 100].find((x) => v <= x * 4) ?? 100; return Math.ceil(v / step) * step || 1; };

/** Two-series grouped columns over ordered categories; legend always shown; tooltip lists both series. */
export default function GroupedColumns({ title, subtitle, series, categories, values, unit = "", height = 170 }: Props) {
  const [active, setActive] = useState<number | null>(null);
  const max = nice(Math.max(...values[0], ...values[1]));
  const fmt = (v: number) => `${unit === "%" ? Math.round(v) : v.toLocaleString()}${unit}`;
  const ticks = [0, max / 2, max];
  return (
    <figure className="card p-4">
      <figcaption>
        <h3 className="font-semibold text-ink">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      </figcaption>
      <ul className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs">
        {series.map((s, i) => (
          <li key={s.key} className="flex items-center gap-1.5"><span className={`h-2.5 w-3.5 rounded-[2px] ${FILL[i]}`} aria-hidden /><span className="text-ink/90">{s.label}</span></li>
        ))}
      </ul>
      <div className="mt-4 flex gap-2">
        <div className="relative w-9 shrink-0 text-right text-[10px] tabular-nums text-muted" style={{ height }}>
          {ticks.map((t) => <span key={t} className="absolute right-0" style={{ bottom: `${(t / max) * 100}%`, transform: "translateY(50%)" }}>{fmt(t)}</span>)}
        </div>
        <div className="min-w-0 flex-1">
          <div className="relative" style={{ height }}>
            {ticks.map((t) => <div key={t} className={`absolute inset-x-0 h-px ${t === 0 ? "bg-line" : "bg-viz-grid"}`} style={{ bottom: `${(t / max) * 100}%` }} />)}
            <div className="absolute inset-0 flex items-end gap-1.5">
              {categories.map((c, ci) => (
                <div
                  key={c.key}
                  tabIndex={0}
                  aria-label={`${c.label}: ${series[0].label} ${fmt(values[0][ci])}, ${series[1].label} ${fmt(values[1][ci])}`}
                  onPointerEnter={() => setActive(ci)}
                  onPointerLeave={() => setActive(null)}
                  onFocus={() => setActive(ci)}
                  onBlur={() => setActive(null)}
                  className={`flex h-full flex-1 items-end justify-center gap-[2px] rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ink/60 ${active === ci ? "bg-white/[0.03]" : ""}`}
                >
                  {[0, 1].map((si) => (
                    <div key={si} className={`w-full max-w-4 rounded-t-[4px] ${FILL[si]} ${active === ci ? "brightness-125" : ""}`} style={{ height: `${(values[si][ci] / max) * 100}%`, minHeight: values[si][ci] > 0 ? 2 : 0 }} />
                  ))}
                </div>
              ))}
            </div>
            {active !== null && (
              <div className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-md border border-line bg-bg px-2 py-1 text-xs shadow-card" style={{ left: `${Math.min(Math.max(((active + 0.5) / categories.length) * 100, 18), 82)}%`, top: 0 }}>
                <p className="mb-0.5 text-muted">{categories[active].label}</p>
                {series.map((s, si) => (
                  <p key={s.key} className="flex items-center gap-1.5 whitespace-nowrap">
                    <span className={`inline-block h-0.5 w-3 ${FILL[si]}`} aria-hidden /><strong className="text-ink">{fmt(values[si][active])}</strong> <span className="text-muted">{s.label}</span>
                  </p>
                ))}
              </div>
            )}
          </div>
          <div className="mt-1 flex gap-1.5 text-[10px] text-muted">{categories.map((c) => <span key={c.key} className="flex-1 text-center">{c.label}</span>)}</div>
        </div>
      </div>
      <details className="mt-3 text-xs text-muted">
        <summary className="cursor-pointer select-none hover:text-ink">Show as table</summary>
        <table className="mt-2 w-full border-collapse">
          <thead><tr><th className="border-b border-line py-1 text-left font-medium" />{series.map((s) => <th key={s.key} className="border-b border-line py-1 text-right font-medium">{s.label}</th>)}</tr></thead>
          <tbody>
            {categories.map((c, ci) => (
              <tr key={c.key}><td className="border-b border-line/50 py-1 text-ink/90">{c.label}</td>{[0, 1].map((si) => <td key={si} className="border-b border-line/50 py-1 text-right tabular-nums text-ink/90">{fmt(values[si][ci])}</td>)}</tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
