"use client";
import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "@/components/Link";
import { track } from "@/lib/track";
import { applyBrowse, facet, isFiltered, NO_FILTER, type BrowseItem, type BrowseQuery, type BrowseSort } from "@/lib/browse";

const FORMAT_LABEL: Record<string, string> = { TV: "TV", movie: "Movie", ONA: "ONA (web)", OVA: "OVA", special: "Special", music: "Music" };
const SORTS: [BrowseSort, string][] = [["popular", "Most popular"], ["score", "Highest score"], ["newest", "Newest"]];

/**
 * "Filter & sort" for a season chart or top list. The server-rendered grid (children) stays as is until a filter
 * or sort is chosen; then every title of the season (or the list's top 100) loads from /api/browse once and the
 * filtered grid replaces it. Filters live in the page, not the URL, so they add no crawlable pages.
 */
export default function BrowseFilter({ source, label, children }: { source: string; label: string; children: ReactNode }) {
  const [q, setQ] = useState<BrowseQuery>(NO_FILTER);
  const [items, setItems] = useState<BrowseItem[] | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  // Load on first touch of the bar, so the menus have their options by the time one opens.
  const [wanted, setWanted] = useState(false);
  const active = isFiltered(q);

  useEffect(() => {
    if (!(active || wanted) || items || state !== "idle") return;
    setState("loading");
    fetch(`/api/browse?${source}`)
      .then((r) => (r.ok ? r.json() : Promise.reject(r.status)))
      .then((d: { items: BrowseItem[] }) => { setItems(d.items); setState("idle"); })
      .catch(() => setState("error"));
  }, [active, wanted, items, state, source]);

  const shown = useMemo(() => (items ? applyBrowse(items, q) : []), [items, q]);
  const set = (patch: Partial<BrowseQuery>) => {
    const next = { ...q, ...patch };
    setQ(next);
    track("browse_filter", { source, ...next });
  };
  const opts = (key: "genres" | "services" | "subtype", min: number) => (items ? facet(items, key, min) : []);

  const select = (id: string, value: string, onChange: (v: string) => void, all: string, options: { value: string; n: number }[], fmt = (v: string) => v) => (
    <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-muted" htmlFor={id}>
      {all.replace("All ", "")}
      <select id={id} value={value} onChange={(e) => onChange(e.target.value)} className="input py-2 text-sm normal-case tracking-normal">
        <option value="">{all}</option>
        {options.map((o) => <option key={o.value} value={o.value}>{fmt(o.value)} ({o.n})</option>)}
      </select>
    </label>
  );

  return (
    <div>
      <section className="card mt-6 p-4" aria-label={`Filter and sort ${label}`} onPointerDown={() => setWanted(true)} onFocus={() => setWanted(true)}>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
          <label className="flex min-w-0 flex-col gap-1 text-xs font-semibold uppercase tracking-wider text-muted" htmlFor="bf-sort">
            Sort
            <select id="bf-sort" value={q.sort} onChange={(e) => set({ sort: e.target.value as BrowseSort })} className="input py-2 text-sm normal-case tracking-normal">
              {SORTS.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </label>
          {select("bf-format", q.format, (v) => set({ format: v }), "All formats", opts("subtype", 1), (v) => FORMAT_LABEL[v] || v)}
          {select("bf-genre", q.genre, (v) => set({ genre: v }), "All genres", opts("genres", 2))}
          {select("bf-service", q.service, (v) => set({ service: v }), "All services", opts("services", 1))}
        </div>
        {!active && <p className="mt-3 text-xs text-muted">{state === "loading" ? "Loading every title…" : state === "error" ? "Couldn't load the filters. Try again in a moment." : `Filter all of ${label} by genre, format and streaming service, or re-sort it.`}</p>}
        {active && (
          <p className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm" aria-live="polite">
            {state === "loading" && <span className="text-muted">Loading every title…</span>}
            {state === "error" && <span className="text-accent-2">Couldn&apos;t load the filters. Try again in a moment.</span>}
            {items && <span className="text-ink/90"><strong>{shown.length}</strong> of {items.length} titles</span>}
            <button type="button" className="text-xs font-semibold text-violet hover:text-violet-2" onClick={() => setQ(NO_FILTER)}>Clear filters</button>
          </p>
        )}
      </section>

      {active && items ? (
        shown.length ? (
          <div className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
            {shown.map((a) => (
              <Link key={a.id} href={`/anime/${encodeURIComponent(a.slug)}`} className="group block min-w-0" title={a.title}>
                <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-line bg-bg-2 shadow-card transition-colors duration-300 group-hover:border-violet/60">
                  {a.poster ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={a.poster} alt={`${a.title} poster`} loading="lazy" decoding="async" className="pc-img" />
                  ) : <div className="grid h-full place-items-center p-3 text-center text-xs text-muted">No image</div>}
                  <div className="pc-shade" />
                  {a.rating && <span className="pc-score">★ {(a.rating / 10).toFixed(1)}</span>}
                  {a.status === "current" && <span className="pc-live"><span className="live-dot" aria-hidden />Airing</span>}
                </div>
                <p className="pc-title">{a.title}</p>
                <p className="pc-meta">{[FORMAT_LABEL[a.subtype || ""] || a.subtype, a.year, a.eps ? `${a.eps} ep` : null, a.services[0]].filter(Boolean).join(" · ")}</p>
              </Link>
            ))}
          </div>
        ) : <p className="card mt-6 p-8 text-center text-sm text-muted">Nothing matches those filters. <button type="button" className="font-semibold text-violet" onClick={() => setQ(NO_FILTER)}>Clear filters</button></p>
      ) : (
        children
      )}
    </div>
  );
}
