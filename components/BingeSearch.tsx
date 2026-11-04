"use client";
import { useId, useMemo, useState } from "react";
import Link from "@/components/Link";
import type { FranchisePick } from "@/lib/franchiselist";

/**
 * Home page "Plan your binge": type a franchise and jump to its watch-order guide (order, binge time, filler,
 * where the manga continues). Filters the franchise list in the browser; popular franchises show as chips. The
 * full list comes from /api/franchises on first focus, so it isn't part of every home page load.
 */
export default function BingeSearch({ popular }: { popular: FranchisePick[] }) {
  const [q, setQ] = useState("");
  const [franchises, setFranchises] = useState<FranchisePick[] | null>(null);
  const load = () => {
    if (franchises) return;
    setFranchises([]);
    fetch("/api/franchises").then((r) => r.json()).then((d: { franchises: FranchisePick[] }) => setFranchises(d.franchises)).catch(() => setFranchises(null));
  };
  const id = useId();
  const needle = q.trim().toLowerCase();
  const hits = useMemo(() => {
    if (needle.length < 2 || !franchises) return [];
    const starts = franchises.filter((f) => f.t.toLowerCase().startsWith(needle));
    const has = franchises.filter((f) => !f.t.toLowerCase().startsWith(needle) && (f.t.toLowerCase().includes(needle) || f.s.includes(needle.replace(/\s+/g, "-"))));
    return [...starts, ...has].slice(0, 6);
  }, [needle, franchises]);

  return (
    <section className="reveal mt-6" aria-labelledby={`${id}-h`}>
      <div className="card relative overflow-hidden p-4 sm:p-5">
        <div aria-hidden className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-violet/20 blur-3xl" />
        <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-accent-2">Plan your binge</p>
        <h2 id={`${id}-h`} className="mt-1 text-xl font-bold text-ink sm:text-2xl">What are you starting next?</h2>
        <p className="mt-1 text-sm text-muted">Get the watch order, how long it takes, which filler to skip and where the manga picks up.</p>
        <div className="relative mt-4 max-w-xl">
          <label htmlFor={`${id}-q`} className="sr-only">Search a franchise</label>
          <svg aria-hidden viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></svg>
          <input id={`${id}-q`} type="search" value={q} onFocus={load} onChange={(e) => { load(); setQ(e.target.value); }} placeholder="Naruto, One Piece, Demon Slayer…" autoComplete="off" className="input w-full" style={{ paddingLeft: "2.25rem" }} />
          {hits.length > 0 && (
            <ul className="absolute inset-x-0 top-full z-20 mt-1.5 overflow-hidden rounded-xl border border-line bg-bg-2 shadow-xl">
              {hits.map((f) => (
                <li key={f.s}>
                  <Link href={`/watch-order/${f.s}`} className="flex items-center justify-between gap-3 px-3 py-2.5 text-sm hover:bg-white/[0.05]">
                    <span className="min-w-0 truncate font-medium text-ink">{f.t}</span>
                    <span className="shrink-0 text-xs text-muted">{f.n} parts →</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {needle.length >= 2 && hits.length === 0 && franchises && franchises.length > 0 && <p className="mt-2 text-xs text-muted" aria-live="polite">No franchise matches that. Try the main title, e.g. &ldquo;Naruto&rdquo;.</p>}
        </div>
        <ul className="mt-4 flex flex-wrap gap-2">
          {popular.map((f) => <li key={f.s}><Link href={`/watch-order/${f.s}`} className="chip">{f.t}</Link></li>)}
        </ul>
      </div>
    </section>
  );
}
