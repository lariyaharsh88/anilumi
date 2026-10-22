"use client";
import { useEffect, useRef, useState } from "react";

export type Point = { key: string; label: string; fullLabel: string; value: number; display: string; href?: string };

type Props = {
  title: string;
  subtitle?: string;
  points: Point[];
  /** Keys that get a direct value label (selective: e.g. first, last, best). */
  labelKeys?: string[];
  valueHeading?: string;
  height?: number;
};

const M = { top: 26, right: 18, bottom: 8, left: 34 };
const SURFACE = "#161b28"; // card surface, used for marker rings

/** Single-series line over an ordered sequence, with crosshair tooltip, keyboard stepping and a table view. */
export default function LineChart({ title, subtitle, points, labelKeys = [], valueHeading = "Value", height = 190 }: Props) {
  const wrap = useRef<HTMLDivElement>(null);
  const [w, setW] = useState(0);
  const [active, setActive] = useState<number | null>(null);

  useEffect(() => {
    const el = wrap.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setW(Math.round(e.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const vals = points.map((p) => p.value);
  let lo = Math.max(0, Math.floor((Math.min(...vals) - 0.4) * 2) / 2);
  let hi = Math.min(10, Math.ceil((Math.max(...vals) + 0.4) * 2) / 2);
  if (hi - lo < 1) { lo = Math.max(0, hi - 1); hi = lo + 1; }
  const stepT = hi - lo <= 2 ? 0.5 : 1; // ticks land on clean values that match their labels
  const ticks = Array.from({ length: Math.floor((hi - lo) / stepT + 1e-9) + 1 }, (_, i) => lo + i * stepT);
  const plotW = Math.max(0, w - M.left - M.right);
  const plotH = height - M.top - M.bottom;
  const PAD = 22; // keep end points and their labels clear of the y-axis ticks
  const x = (i: number) => M.left + PAD + (points.length === 1 ? (plotW - 2 * PAD) / 2 : (i / (points.length - 1)) * (plotW - 2 * PAD));
  const y = (v: number) => M.top + (1 - (v - lo) / (hi - lo)) * plotH;
  const path = points.map((p, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const showNames = points.length <= 6;
  const maxChars = Math.max(4, Math.floor(plotW / Math.max(points.length, 1) / 6.2));
  const short = (s: string) => (s.length > maxChars ? `${s.slice(0, maxChars - 1)}…` : s);
  const labelled = new Set(labelKeys);

  const nearest = (clientX: number) => {
    const r = wrap.current?.getBoundingClientRect();
    if (!r || points.length < 2) return 0;
    const t = (clientX - r.left - M.left - PAD) / Math.max(1, plotW - 2 * PAD);
    return Math.min(points.length - 1, Math.max(0, Math.round(t * (points.length - 1))));
  };
  const tip = active !== null ? points[active] : null;

  return (
    <figure className="card p-4">
      <figcaption>
        <h3 className="font-semibold text-ink">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      </figcaption>
      <div ref={wrap} className="relative mt-3" style={{ height: height + 22 }}>
        {w > 0 && (
          <svg
            width={w}
            height={height + 22}
            role="img"
            aria-label={`${title}: ${points.map((p) => `${p.fullLabel} ${p.display}`).join(", ")}`}
            tabIndex={0}
            className="outline-none focus-visible:ring-2 focus-visible:ring-ink/60 rounded"
            onPointerMove={(e) => setActive(nearest(e.clientX))}
            onPointerLeave={() => setActive(null)}
            onFocus={() => setActive((a) => a ?? points.length - 1)}
            onBlur={() => setActive(null)}
            onKeyDown={(e) => {
              if (e.key === "ArrowRight") { e.preventDefault(); setActive((a) => Math.min(points.length - 1, (a ?? -1) + 1)); }
              if (e.key === "ArrowLeft") { e.preventDefault(); setActive((a) => Math.max(0, (a ?? points.length) - 1)); }
            }}
          >
            {ticks.map((t, i) => (
              <g key={t}>
                <line x1={M.left} x2={M.left + plotW} y1={y(t)} y2={y(t)} stroke={i === 0 ? "#2f3749" : "#242b3b"} strokeWidth={1} />
                <text x={M.left - 6} y={y(t)} textAnchor="end" dominantBaseline="middle" fontSize={10} fill="#8f9ab3" style={{ fontVariantNumeric: "tabular-nums" }}>{t.toFixed(1)}</text>
              </g>
            ))}
            {active !== null && <line x1={x(active)} x2={x(active)} y1={M.top - 6} y2={M.top + plotH} stroke="#8f9ab3" strokeWidth={1} />}
            <path d={path} fill="none" stroke="var(--color-viz-1)" strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {points.map((p, i) => (
              <g key={p.key}>
                <circle cx={x(i)} cy={y(p.value)} r={active === i ? 6 : 4} fill="var(--color-viz-1)" stroke={SURFACE} strokeWidth={2} />
                {labelled.has(p.key) && (
                  <text x={x(i)} y={y(p.value) - 11} textAnchor="middle" fontSize={11} fontWeight={600} fill="#e8ecf5">{p.display}</text>
                )}
                <text x={x(i)} y={height + 14} textAnchor="middle" fontSize={10} fill="#8f9ab3">{showNames ? short(p.label) : i + 1}</text>
              </g>
            ))}
          </svg>
        )}
        {tip && active !== null && (
          <div
            className="pointer-events-none absolute z-10 w-max max-w-[220px] -translate-x-1/2 rounded-md border border-line bg-bg px-2 py-1 text-xs shadow-card"
            style={{ left: Math.min(Math.max(x(active), 90), w - 90), top: Math.max(0, y(tip.value) - 58) }}
          >
            <strong className="block text-ink">{tip.display}</strong>
            <span className="text-muted">{tip.fullLabel}</span>
          </div>
        )}
      </div>
      {!showNames && <p className="mt-1 text-[11px] text-muted">Numbers follow the watch order; hover a point or use the table for names.</p>}
      <details className="mt-3 text-xs text-muted">
        <summary className="cursor-pointer select-none hover:text-ink">Show as table</summary>
        <table className="mt-2 w-full border-collapse">
          <thead><tr><th className="border-b border-line py-1 text-left font-medium">#</th><th className="border-b border-line py-1 text-left font-medium">Entry</th><th className="border-b border-line py-1 text-right font-medium">{valueHeading}</th></tr></thead>
          <tbody>
            {points.map((p, i) => (
              <tr key={p.key}>
                <td className="border-b border-line/50 py-1 tabular-nums">{i + 1}</td>
                <td className="border-b border-line/50 py-1 text-ink/90">{p.href ? <a href={p.href} className="hover:text-violet">{p.fullLabel}</a> : p.fullLabel}</td>
                <td className="border-b border-line/50 py-1 text-right tabular-nums text-ink/90">{p.display}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </details>
    </figure>
  );
}
