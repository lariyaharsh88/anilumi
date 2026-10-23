"use client";
import { useEffect, useRef, useState } from "react";

/** Long text clamped to N lines with a Read more toggle. Full text is always in the HTML for search engines. */
export default function ClampText({ text, lines = 5 }: { text: string; lines?: number }) {
  const ref = useRef<HTMLParagraphElement>(null);
  const [open, setOpen] = useState(false);
  const [overflows, setOverflows] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const check = () => setOverflows(el.scrollHeight > el.clientHeight + 4);
    check();
    const ro = new ResizeObserver(check);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return (
    <div>
      <p ref={ref} className="prose-anime whitespace-pre-line" style={open ? undefined : { display: "-webkit-box", WebkitLineClamp: lines, WebkitBoxOrient: "vertical", overflow: "hidden" }}>{text}</p>
      {(overflows || open) && (
        <button type="button" onClick={() => setOpen((v) => !v)} className="mt-2 text-sm font-semibold text-violet hover:text-violet-2" aria-expanded={open}>
          {open ? "Show less" : "Read more"}
        </button>
      )}
    </div>
  );
}
