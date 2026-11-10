"use client";
import { useEffect, useRef, useState } from "react";

const KEY = "anilumi:country"; // shared with WhereToWatch
const read = (k: string) => { try { return localStorage.getItem(k); } catch { return null; } };
const save = (c: string) => { try { localStorage.setItem(KEY, c); } catch { /* storage blocked */ } };

/**
 * Country tabs over server-rendered sections marked data-region="US" etc. Without JavaScript every country shows;
 * with it, the visitor's country opens first (their earlier pick, else the consent check's cached country, else
 * /api/geo), and the others hide until picked.
 */
export default function RegionTabs({ regions, labels, children }: { regions: string[]; labels: Record<string, string>; children: React.ReactNode }) {
  const box = useRef<HTMLDivElement>(null);
  const [active, setActive] = useState<string | null>(null);

  useEffect(() => {
    const pick = (c: string | null | undefined) => (c && regions.includes(c) ? c : null);
    const cached = (() => { try { return (JSON.parse(read("al_region") || "null") as { c?: string } | null)?.c ?? null; } catch { return null; } })();
    const known = pick(read(KEY)) ?? pick(cached);
    if (known) { setActive(known); return; }
    let live = true;
    fetch("/api/geo", { cache: "no-store" }).then((r) => r.json()).then((j: { c: string | null }) => { if (live) setActive(pick(j.c) ?? regions[0]); }).catch(() => { if (live) setActive(regions[0]); });
    return () => { live = false; };
  }, [regions]);

  useEffect(() => {
    if (!active || !box.current) return;
    for (const el of box.current.querySelectorAll<HTMLElement>("[data-region]")) el.hidden = el.dataset.region !== active;
  }, [active]);

  return (
    <div ref={box}>
      <div role="group" aria-label="Country" className="mb-4 flex flex-wrap gap-2">
        {regions.map((r) => (
          <button key={r} type="button" aria-pressed={active === r} onClick={() => { setActive(r); save(r); }}
            className={`chip text-sm ${active === r ? "border-violet bg-violet-strong text-snow" : ""}`}>
            {labels[r] ?? r}
          </button>
        ))}
      </div>
      {children}
    </div>
  );
}
