"use client";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";

type Hit = { id: string; slug: string; title: string; poster: string | null; type: string; year: string | null; score: number | null; status: string };

const cache = new Map<string, Hit[]>(); // per tab: retyping a query is instant

/**
 * Search with suggestions. Typing shows matching anime; pick one (click, or ↑/↓ then Enter) to open its
 * page. Enter without a pick submits the form to /search as before, so it also works without JavaScript.
 */
export default function SearchBox({ defaultValue = "" }: { defaultValue?: string }) {
  const router = useRouter();
  const [q, setQ] = useState(defaultValue);
  const [hits, setHits] = useState<Hit[]>([]);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [active, setActive] = useState(-1); // -1 = nothing highlighted; hits.length = "see all results"
  const [dropW, setDropW] = useState<number | undefined>(undefined);
  const listId = useId();
  const boxRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) { setHits([]); setBusy(false); return; }
    const key = term.toLowerCase();
    if (cache.has(key)) { setHits(cache.get(key)!); setBusy(false); return; }
    setBusy(true);
    const ctrl = new AbortController();
    const t = setTimeout(() => {
      fetch(`/api/search?limit=6&q=${encodeURIComponent(term)}`, { signal: ctrl.signal })
        .then((r) => r.json())
        .then((d: { items: Hit[] }) => { cache.set(key, d.items); setHits(d.items); setActive(-1); })
        .catch(() => {})
        .finally(() => setBusy(false));
    }, 220);
    return () => { clearTimeout(t); ctrl.abort(); };
  }, [q]);

  // Close when clicking anywhere else.
  useEffect(() => {
    const onDown = (e: MouseEvent) => { if (!boxRef.current?.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("mousedown", onDown);
    return () => document.removeEventListener("mousedown", onDown);
  }, []);

  const show = open && q.trim().length >= 2;

  // Right-aligned to the box; as wide as fits on screen (16px margin), at most 26rem.
  useEffect(() => {
    if (!show) return;
    const fit = () => { const r = boxRef.current?.getBoundingClientRect(); if (r) setDropW(Math.min(416, Math.max(r.width, r.right - 16))); };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [show]);
  const total = hits.length + 1; // results + "see all"
  const go = (h: Hit) => { setOpen(false); router.push(`/anime/${h.slug}`); };
  const searchAll = () => { setOpen(false); router.push(`/search?q=${encodeURIComponent(q.trim())}`); };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => (a + 1) % total); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setOpen(true); setActive((a) => (a <= 0 ? total - 1 : a - 1)); }
    // First Esc closes the list and keeps the text (search inputs clear themselves on Esc by default).
    else if (e.key === "Escape" && show) { e.preventDefault(); setOpen(false); setActive(-1); }
    else if (e.key === "Enter" && open && active >= 0) {
      e.preventDefault();
      if (active < hits.length) go(hits[active]);
      else searchAll();
    }
    // Plain Enter (nothing highlighted) submits the form → /search?q=
  };

  return (
    <form ref={boxRef} action="/search" role="search" className="relative" onSubmit={() => setOpen(false)}>
      <input
        name="q"
        type="search"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(-1); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
        placeholder="Search anime…"
        aria-label="Search anime"
        role="combobox"
        aria-expanded={show}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={show && active >= 0 ? `${listId}-${active}` : undefined}
        className="input"
        style={{ paddingLeft: "2.25rem" }}
        autoComplete="off"
        enterKeyHint="search"
      />
      <svg aria-hidden className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
      </svg>

      {show && (
        <div style={{ width: dropW }} className="absolute right-0 top-full z-50 mt-2 w-full overflow-hidden rounded-xl border border-line bg-bg-2 shadow-[0_24px_60px_-20px_rgba(0,0,0,.9)]">
          <ul id={listId} role="listbox" aria-label="Suggestions" className="max-h-[70vh] overflow-y-auto py-1">
            {hits.map((h, i) => (
              <li
                key={h.id}
                id={`${listId}-${i}`}
                role="option"
                aria-selected={active === i}
                onMouseEnter={() => setActive(i)}
                onMouseDown={(e) => e.preventDefault() /* keep focus so the click lands */}
                onClick={() => go(h)}
                className={`flex cursor-pointer items-center gap-3 px-3 py-2 ${active === i ? "bg-white/[.07]" : ""}`}
              >
                <span className="h-12 w-9 shrink-0 overflow-hidden rounded bg-bg">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {h.poster && <img src={h.poster} alt="" width={36} height={48} loading="lazy" className="h-full w-full object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">{h.title}</span>
                  <span className="block truncate text-xs text-muted">
                    {[h.type, h.year, h.status === "current" ? "Airing" : h.status === "upcoming" ? "Upcoming" : null].filter(Boolean).join(" · ")}
                  </span>
                </span>
                {h.score && <span className="shrink-0 text-xs font-semibold text-ink/80">★ {h.score.toFixed(1)}</span>}
              </li>
            ))}
            {busy && !hits.length && <li className="px-3 py-3 text-sm text-muted">Searching…</li>}
            {!busy && !hits.length && <li className="px-3 py-3 text-sm text-muted">No quick matches. Press Enter to search everything.</li>}
            <li
              id={`${listId}-${hits.length}`}
              role="option"
              aria-selected={active === hits.length}
              onMouseEnter={() => setActive(hits.length)}
              onMouseDown={(e) => e.preventDefault()}
              onClick={searchAll}
              className={`flex cursor-pointer items-center justify-between gap-3 border-t border-line px-3 py-2.5 text-sm ${active === hits.length ? "bg-white/[.07]" : ""}`}
            >
              <span className="truncate text-violet-2">See all results for “{q.trim()}”</span>
              <kbd className="shrink-0 rounded bg-white/10 px-1.5 py-0.5 text-[10px] text-muted">Enter</kbd>
            </li>
          </ul>
        </div>
      )}
    </form>
  );
}
