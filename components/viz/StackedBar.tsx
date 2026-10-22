"use client";
import { useState } from "react";

export type Segment = { key: string; label: string; value: number };
// Fixed categorical order; a segment keeps its slot by entity (caller passes stable keys).
const SLOTS = ["bg-viz-1", "bg-viz-2", "bg-viz-3", "bg-viz-4", "bg-viz-5", "bg-viz-6"];

/** Part-to-whole in one horizontal bar, <= 6 segments, legend always present. */
export default function StackedBar({ title, subtitle, segments, unit = "titles" }: { title: string; subtitle?: string; segments: Segment[]; unit?: string }) {
  const [active, setActive] = useState<number | null>(null);
  const parts = segments.slice(0, 6);
  const total = parts.reduce((n, s) => n + s.value, 0);
  if (!total) return null;
  const pct = (v: number) => `${Math.round((v / total) * 100)}%`;
  return (
    <figure className="card p-4">
      <figcaption>
        <h3 className="font-semibold text-ink">{title}</h3>
        {subtitle && <p className="mt-0.5 text-xs text-muted">{subtitle}</p>}
      </figcaption>
      <div className="relative mt-4">
        <div className="flex h-4 gap-[2px] overflow-hidden rounded-[4px]">
          {parts.map((s, i) =>
            s.value > 0 ? (
              <div
                key={s.key}
                tabIndex={0}
                aria-label={`${s.label}: ${s.value.toLocaleString()} ${unit}, ${pct(s.value)}`}
                onPointerEnter={() => setActive(i)}
                onPointerLeave={() => setActive(null)}
                onFocus={() => setActive(i)}
                onBlur={() => setActive(null)}
                className={`h-full outline-none transition hover:brightness-125 focus-visible:brightness-125 ${SLOTS[i]}`}
                style={{ flexGrow: s.value, flexBasis: 0, minWidth: 3 }}
              />
            ) : null,
          )}
        </div>
        {active !== null && (
          <div className="pointer-events-none absolute -top-12 left-1/2 z-10 -translate-x-1/2 rounded-md border border-line bg-bg px-2 py-1 text-xs shadow-card">
            <strong className="block text-ink">{parts[active].value.toLocaleString()} {unit} · {pct(parts[active].value)}</strong>
            <span className="text-muted">{parts[active].label}</span>
          </div>
        )}
      </div>
      <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 text-xs">
        {parts.map((s, i) => s.value > 0 && (
          <li key={s.key} className="flex items-center gap-1.5">
            <span className={`h-2.5 w-3.5 rounded-[2px] ${SLOTS[i]}`} aria-hidden />
            <span className="text-ink/90">{s.label}</span>
            <span className="tabular-nums text-muted">{s.value.toLocaleString()} · {pct(s.value)}</span>
          </li>
        ))}
      </ul>
    </figure>
  );
}
