"use client";
import { useEffect, useState } from "react";

type Item = { id: string; title: string; label: string; meta: string; optional: boolean };

const read = (key: string): string[] => {
  try { return JSON.parse(localStorage.getItem(key) || "[]"); } catch { return []; }
};

/**
 * Tick-off list of a franchise's watch order, remembered in this browser, plus a print button that prints only
 * this list (body.print-checklist in globals.css). Server-rendered unticked, so it reads fine without JS.
 */
export default function WatchChecklist({ slug, name, items }: { slug: string; name: string; items: Item[] }) {
  const key = `anilumi:checklist:${slug}`;
  const [done, setDone] = useState<string[]>([]);
  useEffect(() => setDone(read(key)), [key]);
  const toggle = (id: string) => {
    const next = done.includes(id) ? done.filter((x) => x !== id) : [...done, id];
    setDone(next);
    try { localStorage.setItem(key, JSON.stringify(next)); } catch { /* storage blocked */ }
  };
  const print = () => {
    document.body.classList.add("print-checklist");
    const off = () => { document.body.classList.remove("print-checklist"); window.removeEventListener("afterprint", off); };
    window.addEventListener("afterprint", off);
    window.print();
  };
  return (
    <section id="checklist" className="mt-10" aria-labelledby="checklist-h">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h2 id="checklist-h" className="h-section">{name} watch order checklist</h2>
          <p className="mt-1 text-sm text-muted">{done.length ? `${done.filter((d) => items.some((i) => i.id === d)).length} of ${items.length} watched` : "Tick off each one as you go. Saved in this browser."}</p>
        </div>
        <button type="button" onClick={print} className="btn-outline px-3 py-2 text-sm" data-chrome>🖨️ Print checklist</button>
      </div>
      <ol className="card divide-y divide-line">
        {items.map((x, i) => (
          <li key={x.id}>
            <label className="flex cursor-pointer items-center gap-3 p-3 text-sm">
              <input type="checkbox" checked={done.includes(x.id)} onChange={() => toggle(x.id)} className="h-4 w-4 shrink-0 accent-[var(--color-violet)]" />
              <span className="w-6 shrink-0 text-right font-bold tabular-nums text-muted">{i + 1}</span>
              <span className={`min-w-0 flex-1 ${done.includes(x.id) ? "text-muted line-through" : "text-ink"}`}>
                <span className="font-medium">{x.title}</span>
                <span className="block text-xs text-muted">{x.label}{x.optional ? " · optional" : ""}{x.meta ? ` · ${x.meta}` : ""}</span>
              </span>
            </label>
          </li>
        ))}
      </ol>
    </section>
  );
}
