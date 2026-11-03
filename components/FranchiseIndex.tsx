"use client";
import { useMemo, useState } from "react";
import Link from "@/components/Link";

export type FranchiseRow = { s: string; t: string; n: number; ed: boolean };

const PER_LETTER = 12;
const LETTERS = ["#", ..."ABCDEFGHIJKLMNOPQRSTUVWXYZ"];
const letterOf = (t: string) => (/^[a-z]/i.test(t) ? t[0].toUpperCase() : "#");

/**
 * Every franchise watch order, A–Z: a filter box, a sticky letter bar, and one card per letter showing the
 * first dozen with a "Show all" toggle. Rows past the dozen stay in the HTML (just hidden), so every link is
 * still crawlable; typing in the filter shows every match.
 */
export default function FranchiseIndex({ rows }: { rows: FranchiseRow[] }) {
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<Set<string>>(new Set());
  const needle = q.trim().toLowerCase();

  const groups = useMemo(() => {
    const m = new Map<string, FranchiseRow[]>();
    for (const r of rows) m.set(letterOf(r.t), [...(m.get(letterOf(r.t)) || []), r]);
    return m;
  }, [rows]);
  const matches = (r: FranchiseRow) => !needle || r.t.toLowerCase().includes(needle);
  const shownCount = needle ? rows.filter(matches).length : rows.length;

  return (
    <div>
      <div className="sticky top-[6.1rem] z-30 -mx-4 border-y border-line/60 bg-bg/85 px-4 py-2.5 backdrop-blur-xl lg:top-14">
        <div className="flex flex-col gap-2.5 md:flex-row md:items-center">
          <label className="relative block md:w-64 md:shrink-0">
            <span className="sr-only">Filter franchises</span>
            <svg aria-hidden viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
            <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder={`Filter ${rows.length} franchises…`} className="input w-full" style={{ paddingLeft: "2.25rem" }} />
          </label>
          <nav aria-label="Jump to letter" className="edge-fade fade-phone-only flex gap-1 overflow-x-auto [scrollbar-width:none] sm:flex-wrap sm:overflow-visible [&::-webkit-scrollbar]:hidden">
            {LETTERS.map((l) => {
              const has = (groups.get(l) || []).some(matches);
              return has
                ? <a key={l} href={`#az-${l === "#" ? "0" : l}`} className="grid h-7 min-w-[1.65rem] shrink-0 place-items-center rounded-md border border-line bg-bg-2 px-1 text-xs font-bold text-ink transition hover:border-violet hover:text-violet-2">{l}</a>
                : <span key={l} aria-hidden className="grid h-7 min-w-[1.65rem] shrink-0 place-items-center rounded-md px-1 text-xs font-bold text-muted/40">{l}</span>;
            })}
          </nav>
        </div>
        {needle && <p className="mt-2 text-xs text-muted" aria-live="polite">{shownCount ? `${shownCount} match${shownCount === 1 ? "" : "es"}` : "No franchise matches that. Try a shorter name."}</p>}
      </div>

      <div className="mt-5 space-y-4">
        {LETTERS.map((l) => {
          const list = groups.get(l) || [];
          const hits = list.filter(matches);
          if (!hits.length) return null;
          const expanded = needle !== "" || open.has(l);
          return (
            <section key={l} id={`az-${l === "#" ? "0" : l}`} aria-label={`Franchises starting with ${l}`} className="card scroll-mt-48 p-3 sm:p-4 lg:scroll-mt-32">
              <div className="mb-2 flex items-center gap-3">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-accent to-violet text-base font-black text-snow">{l}</span>
                <span className="text-sm text-muted">{hits.length} {hits.length === 1 ? "franchise" : "franchises"}</span>
              </div>
              <ul className="grid gap-x-3 sm:grid-cols-2 lg:grid-cols-3">
                {hits.map((f, i) => (
                  <li key={f.s} className={!expanded && i >= PER_LETTER ? "hidden" : undefined}>
                    <Link href={`/watch-order/${f.s}`} className="group flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-white/[0.05]">
                      <span className="min-w-0 flex-1 truncate text-sm text-ink/90 group-hover:text-violet-2" title={f.t}>{f.t}</span>
                      {f.ed && <span className="shrink-0 rounded-full bg-violet/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-violet-2">Guide</span>}
                      <span className="shrink-0 rounded-full border border-line px-1.5 py-0.5 text-[11px] tabular-nums text-muted">{f.n} parts</span>
                    </Link>
                  </li>
                ))}
              </ul>
              {!needle && hits.length > PER_LETTER && (
                <button type="button" onClick={() => setOpen((s) => { const n = new Set(s); if (n.has(l)) n.delete(l); else n.add(l); return n; })} aria-expanded={expanded} className="mt-2 rounded-lg px-2 py-1 text-sm font-medium text-violet hover:text-violet-2">
                  {expanded ? "Show fewer" : `Show all ${hits.length} in ${l}`}
                </button>
              )}
            </section>
          );
        })}
      </div>
    </div>
  );
}
