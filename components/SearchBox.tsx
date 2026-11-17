"use client";
import { useEffect, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { track } from "@/lib/track";

/** An anime, or a character / voice actor (person: true, with its own href; year holds "From X" detail). */
type Hit = { id: string; slug: string; title: string; poster: string | null; type: string; year: string | null; score: number | null; status: string; href?: string; person?: boolean; icon?: string };

const cache = new Map<string, Hit[]>(); // per tab: retyping a query is instant

/**
 * Shown on focus, before typing: what people search most (Bing and Google India keyword data, Nov 2026, plus the
 * site's top pages). No counts in the labels, so they never go stale.
 */
const POPULAR: Hit[] = ([
  ["🇮🇳", "Hindi dubbed anime", "/hindi-dub", "Every official dub, and the free ones"],
  ["📅", "New Hindi episodes this week", "/hindi-dub/this-week", "Day by day, times in IST"],
  ["🏴‍☠️", "One Piece in Hindi", "/anime/one-piece/hindi-dub", "Where to watch"],
  ["🍥", "Naruto in Hindi", "/anime/naruto/hindi-dub", "Where to watch"],
  ["🗡️", "Demon Slayer in Hindi", "/anime/kimetsu-no-yaiba/hindi-dub", "Where to watch"],
  ["🌀", "Jujutsu Kaisen in Hindi", "/anime/jujutsu-kaisen/hindi-dub", "Where to watch"],
  ["⚔️", "Solo Leveling season 2", "/anime/solo-leveling/next-season", "Release status"],
  ["📺", "Anime airing this week", "/schedule", "Countdown to every episode"],
  ["🏆", "Best anime of all time", "/best-anime", "Top 50, with where to watch in India"],
  ["▶️", "Anime streaming sites in India", "/anime-streaming-sites", "Free and paid, compared"],
] as const).map(([icon, title, href, sub]) => ({ id: `pop:${href}`, slug: "", title, poster: null, type: sub, year: null, score: null, status: "", href, person: true, icon }));

/**
 * Search with suggestions. Typing shows matching anime, characters and voice actors; pick one (click, or ↑/↓ then
 * Enter) to open its page. Enter without a pick submits the form to /search as before, so it also works without JavaScript.
 */
export default function SearchBox({ defaultValue = "", label = "Site search" }: { defaultValue?: string; label?: string }) {
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

  const typing = q.trim().length >= 2;
  // Before typing, the popular searches; while typing, live results.
  const list = typing ? hits : q.trim() ? [] : POPULAR;
  const show = open && (typing || !q.trim());

  // Right-aligned to the box; as wide as fits on screen (16px margin), at most 26rem.
  useEffect(() => {
    if (!show) return;
    const fit = () => { const r = boxRef.current?.getBoundingClientRect(); if (r) setDropW(Math.min(416, Math.max(r.width, r.right - 16))); };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [show]);
  const total = list.length + (typing ? 1 : 0); // results + "see all"
  const go = (h: Hit) => { track("search_suggestion", { search_term: q.trim(), ...(h.icon ? { popular: h.href } : h.person ? { person: h.href } : { anime: h.slug }) }); setOpen(false); router.push(h.href ?? `/anime/${h.slug}`); };
  const searchAll = () => { track("search", { search_term: q.trim() }); setOpen(false); router.push(`/search?q=${encodeURIComponent(q.trim())}`); };

  const onKey = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setOpen(true); setActive((a) => (a + 1) % total); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setOpen(true); setActive((a) => (a <= 0 ? total - 1 : a - 1)); }
    // First Esc closes the list and keeps the text (search inputs clear themselves on Esc by default).
    else if (e.key === "Escape" && show) { e.preventDefault(); setOpen(false); setActive(-1); }
    else if (e.key === "Enter" && open && active >= 0) {
      e.preventDefault();
      if (active < list.length) go(list[active]);
      else searchAll();
    }
    // Plain Enter (nothing highlighted) submits the form → /search?q=
  };

  return (
    <form ref={boxRef} action="/search" role="search" aria-label={label} className="relative" onSubmit={() => { track("search", { search_term: q.trim() }); setOpen(false); }}>
      <input
        name="q"
        type="search"
        value={q}
        onChange={(e) => { setQ(e.target.value); setOpen(true); setActive(-1); }}
        onFocus={() => setOpen(true)}
        onKeyDown={onKey}
        placeholder="Search anime, characters…"
        aria-label="Search anime, characters and voice actors"
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
          <ul id={listId} role="listbox" aria-label={typing ? "Suggestions" : "Popular searches"} className="max-h-[70vh] overflow-y-auto py-1">
            {!typing && <li role="presentation" className="px-3 pb-1 pt-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted">Popular searches</li>}
            {list.map((h, i) => (
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
                {h.icon ? <span aria-hidden className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/[.06] text-lg">{h.icon}</span> : <span className={`shrink-0 overflow-hidden bg-bg ${h.person ? "h-10 w-10 rounded-full" : "h-12 w-9 rounded"}`}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  {h.poster && <img src={h.poster} alt="" width={h.person ? 40 : 36} height={h.person ? 40 : 48} loading="lazy" className="h-full w-full object-cover object-top" />}
                  {!h.poster && h.person && <span aria-hidden className="grid h-full w-full place-items-center text-sm text-muted">🎙️</span>}
                </span>}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-semibold text-ink">{h.title}</span>
                  <span className="block truncate text-xs text-muted">
                    {h.icon ? h.type : h.person ? [h.type, h.year].filter(Boolean).join(" · ") : [h.type, h.year, h.status === "current" ? "Airing" : h.status === "upcoming" ? "Upcoming" : null].filter(Boolean).join(" · ")}
                  </span>
                </span>
                {h.score && <span className="shrink-0 text-xs font-semibold text-ink/80">★ {h.score.toFixed(1)}</span>}
              </li>
            ))}
            {typing && busy && !hits.length && <li className="px-3 py-3 text-sm text-muted">Searching…</li>}
            {typing && !busy && !hits.length && <li className="px-3 py-3 text-sm text-muted">No quick matches. Press Enter to search everything.</li>}
            {typing && <li
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
            </li>}
          </ul>
        </div>
      )}
    </form>
  );
}
