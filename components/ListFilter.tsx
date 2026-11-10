"use client";
import { useState } from "react";

/** A search box that hides items of a server-rendered list (by id) whose data-filter text doesn't match. */
export default function ListFilter({ target, placeholder }: { target: string; placeholder: string }) {
  const [q, setQ] = useState("");
  const [shown, setShown] = useState<number | null>(null);
  const run = (v: string) => {
    setQ(v);
    const want = v.trim().toLowerCase();
    let n = 0;
    for (const el of document.querySelectorAll<HTMLElement>(`#${CSS.escape(target)} > [data-filter]`)) {
      const ok = !want || (el.dataset.filter ?? "").includes(want);
      el.hidden = !ok;
      if (ok) n++;
    }
    setShown(want ? n : null);
  };
  return (
    <div className="mb-3 flex flex-wrap items-center gap-3">
      <input type="search" value={q} onChange={(e) => run(e.target.value)} placeholder={placeholder} aria-label={placeholder}
        className="w-full max-w-sm rounded-xl border border-line bg-white/[.04] px-3 py-2 text-sm text-ink placeholder:text-muted focus:border-violet focus:outline-none" />
      {shown !== null && <span className="text-xs text-muted" role="status">{shown} found</span>}
    </div>
  );
}
