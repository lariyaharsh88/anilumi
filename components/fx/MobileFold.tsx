"use client";
import { useEffect, useRef, useState, type ReactNode } from "react";

/**
 * On phones, shows the first part of a long section with a "Show all" button; from md up it is always open. The
 * whole section is in the HTML either way (search engines index it). Opens itself when the page jumps to it or to
 * an anchor inside it (the section tabs link to #id).
 */
export default function MobileFold({ children, label, className = "" }: { children: ReactNode; label: string; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(true);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setOverflows(el.scrollHeight > el.clientHeight + 8);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    const onHash = () => {
      const id = decodeURIComponent(location.hash.slice(1));
      if (id && (el.querySelector(`[id="${CSS.escape(id)}"]`) || el.closest(`[id="${CSS.escape(id)}"]`))) setOpen(true);
    };
    onHash();
    window.addEventListener("hashchange", onHash);
    return () => { ro.disconnect(); window.removeEventListener("hashchange", onHash); };
  }, []);
  const folded = !open && overflows;
  return (
    <div className={className}>
      <div ref={ref} className={`relative ${open ? "" : "max-md:max-h-72 max-md:overflow-hidden"}`}>
        {children}
        {folded && <div aria-hidden className="pointer-events-none absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-bg to-transparent md:hidden" />}
      </div>
      {folded && (
        <button type="button" onClick={() => setOpen(true)} aria-expanded={false} className="mt-2 inline-flex min-h-10 w-full items-center justify-center gap-1.5 rounded-xl border border-line bg-bg-2/60 px-4 py-2 text-sm font-semibold text-violet hover:text-violet-2 md:hidden">
          Show all: {label} <span aria-hidden>↓</span>
        </button>
      )}
    </div>
  );
}
