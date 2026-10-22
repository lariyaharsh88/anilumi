"use client";
import { useState } from "react";

/** `display` is used in tooltips and the table; `mark` (optional, shorter) is printed on the bar itself. */
export type Datum = { key: string; label: string; value: number; display: string; mark?: string; href?: string };

type Props = {
  title: string;
  subtitle?: string;
  data: Datum[];
  /** "column" = vertical bars over an ordered x axis; "bar" = horizontal bars with long labels. */
  orientation?: "column" | "bar";
  /** Emphasis: this key in the accent hue, the rest in the de-emphasis gray. */
  highlightKey?: string;
  /** Keys whose value is printed on the mark (selective labelling). Defaults to the max. */
  labelKeys?: string[];
  valueHeading?: string;
  height?: number;
  /** Counts: keep axis ticks on whole numbers. */
  integer?: boolean;
};

function niceMax(v: number) {
  if (v <= 0) return 1;
  const p = 10 ** Math.floor(Math.log10(v));
  const n = v / p;
  // Finer steps keep the tallest mark near the top while ticks stay round (max, max/2).
  const step = [1, 1.2, 1.6, 2, 2.4, 3, 4, 5, 6, 8, 10].find((x) => n <= x) ?? 10;
  return step * p;
}
const compact = (n: number) => (n >= 1e6 ? `${+(n / 1e6).toFixed(1)}M` : n >= 1e4 ? `${Math.round(n / 1e3)}K` : n >= 1e3 ? `${+(n / 1e3).toFixed(1)}K` : `${+n.toFixed(1)}`);

export default function BarChart({ title, subtitle, data, orientation = "column", highlightKey, labelKeys, valueHeading = "Value", height = 180, integer = false }: Props) {
  const [active, setActive] = useState<number | null>(null);
  if (!data.length) return null;
  const raw = Math.max(...data.map((d) => d.value));
  const max = integer ? Math.max(2, Math.ceil(raw / 2) * 2 > raw ? Math.ceil(raw / 2) * 2 : raw) : niceMax(raw);
  const ticks = [0, max / 2, max].filter((t) => !integer || Number.isInteger(t));
  const maxKey = data.reduce((a, b) => (b.value > a.value ? b : a)).key;
  const labelled = new Set(labelKeys ?? [maxKey]);
  const color = (d: Datum) => (highlightKey ? (d.key === highlightKey ? "bg-viz-1" : "bg-viz-muted") : "bg-viz-1");
  const tip = active !== null ? data[active] : null;
  const markProps = (i: number, d: Datum) => ({
    tabIndex: 0,
    role: "img",
    "aria-label": `${d.label}: ${d.display}`,
    onPointerEnter: () => setActive(i),
    onPointerLeave: () => setActive(null),
    onFocus: () => setActive(i),
    onBlur: () => setActive(null),
  });

  return (
    <figure className="card p-4">
      <figcaption>
        <p className="font-semibold text-ink">{title}</p>
        {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      </figcaption>

      {orientation === "column" ? (
        <div className="mt-7 flex gap-2">
          {/* y-axis ticks; mt-7 leaves headroom for the label on the tallest column */}
          <div className="relative w-9 shrink-0 text-right text-[10px] tabular-nums text-muted" style={{ height }}>
            {ticks.map((t) => (
              <span key={t} className="absolute right-0 -translate-y-1/2" style={{ bottom: `${(t / max) * 100}%`, transform: "translateY(50%)" }}>{compact(t)}</span>
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <div className="relative" style={{ height }}>
              {ticks.map((t) => (
                <div key={t} className={`absolute inset-x-0 h-px ${t === 0 ? "bg-line" : "bg-viz-grid"}`} style={{ bottom: `${(t / max) * 100}%` }} />
              ))}
              <div className="absolute inset-0 flex items-end gap-[2px]">
                {data.map((d, i) => (
                  <div key={d.key} className="group relative flex h-full flex-1 cursor-default items-end justify-center outline-none" {...markProps(i, d)}>
                    {labelled.has(d.key) && d.value > 0 && (
                      <span className="pointer-events-none absolute left-1/2 -translate-x-1/2 whitespace-nowrap text-[10px] font-semibold text-ink" style={{ bottom: `calc(${(d.value / max) * 100}% + 4px)` }}>{d.mark ?? d.display}</span>
                    )}
                    <div className={`grow-y w-full max-w-6 rounded-t-[4px] transition group-hover:brightness-125 group-focus-visible:brightness-125 group-focus-visible:ring-2 group-focus-visible:ring-ink/60 ${color(d)}`} style={{ height: `${(d.value / max) * 100}%`, minHeight: d.value > 0 ? 2 : 0 }} />
                  </div>
                ))}
              </div>
              {tip && active !== null && (
                <div className="pointer-events-none absolute z-10 -translate-x-1/2 rounded-md border border-line bg-bg px-2 py-1 text-xs shadow-card" style={{ left: `${((active + 0.5) / data.length) * 100}%`, bottom: `calc(${Math.min((tip.value / max) * 100, 85)}% + 22px)` }}>
                  <strong className="block text-ink">{tip.display}</strong>
                  <span className="text-muted">{tip.label}</span>
                </div>
              )}
            </div>
            <div className="mt-1 flex gap-[2px] text-[10px] text-muted">
              {data.map((d) => <span key={d.key} className="flex-1 truncate text-center">{d.label}</span>)}
            </div>
          </div>
        </div>
      ) : (
        <ul className="mt-4 space-y-1.5">
          {data.map((d, i) => {
            const inner = (
              <>
                <span className="w-32 shrink-0 truncate text-xs text-ink/90 sm:w-48" title={d.label}>{d.label}</span>
                <span className="relative flex h-5 flex-1 items-center">
                  <span className="absolute inset-y-0 left-0 w-px bg-line" />
                  <span className={`grow-x h-3.5 rounded-r-[4px] transition group-hover:brightness-125 ${color(d)}`} style={{ width: `${(d.value / max) * 100}%`, minWidth: d.value > 0 ? 2 : 0 }} />
                  <span className="ml-1.5 whitespace-nowrap text-[11px] tabular-nums text-muted">{d.display}</span>
                </span>
              </>
            );
            return (
              <li key={d.key} className="group flex items-center gap-2 rounded outline-none focus-visible:ring-2 focus-visible:ring-ink/60" {...markProps(i, d)} role={undefined}>
                {d.href ? <a href={d.href} className="flex flex-1 items-center gap-2" tabIndex={-1}>{inner}</a> : inner}
              </li>
            );
          })}
        </ul>
      )}

      <details className="mt-3 text-xs text-muted">
        <summary className="cursor-pointer select-none hover:text-ink">Show as table</summary>
        <table className="mt-2 w-full border-collapse">
          <thead><tr><th className="border-b border-line py-1 text-left font-medium">Item</th><th className="border-b border-line py-1 text-right font-medium">{valueHeading}</th></tr></thead>
          <tbody>
            {data.map((d) => <tr key={d.key}><td className="border-b border-line/50 py-1 text-ink/90">{d.label}</td><td className="border-b border-line/50 py-1 text-right tabular-nums text-ink/90">{d.display}</td></tr>)}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
