"use client";
import { useEffect, useRef, useState } from "react";

/** Horizontal rail with prev/next buttons (desktop) and fades at the edges that still have content. */
export default function RailScroller({ children, label }: { children: React.ReactNode; label: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [atStart, setAtStart] = useState(true);
  const [atEnd, setAtEnd] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const sync = () => { setAtStart(el.scrollLeft < 8); setAtEnd(el.scrollLeft + el.clientWidth >= el.scrollWidth - 8); };
    sync();
    el.addEventListener("scroll", sync, { passive: true });
    const ro = new ResizeObserver(sync);
    ro.observe(el);
    return () => { el.removeEventListener("scroll", sync); ro.disconnect(); };
  }, []);

  const by = (d: number) => ref.current?.scrollBy({ left: d * ref.current.clientWidth * 0.85, behavior: "smooth" });
  const mask = atStart && atEnd ? undefined : `linear-gradient(90deg, ${atStart ? "#000" : "transparent"} 0, #000 ${atStart ? "0" : "40px"}, #000 calc(100% - ${atEnd ? "0px" : "56px"}), ${atEnd ? "#000" : "transparent"} 100%)`;
  const btn = "absolute top-[38%] z-10 hidden h-10 w-10 -translate-y-1/2 place-items-center rounded-full border border-white/15 bg-bg/80 text-lg text-ink shadow-card backdrop-blur transition hover:scale-110 hover:border-violet group-hover/rail:grid";

  return (
    <div className="group/rail relative">
      {!atStart && <button type="button" onClick={() => by(-1)} className={`${btn} -left-3`} aria-label={`Scroll ${label} left`}>‹</button>}
      <div ref={ref} className="scroll-x pt-2" style={mask ? { maskImage: mask, WebkitMaskImage: mask } : undefined}>{children}</div>
      {!atEnd && <button type="button" onClick={() => by(1)} className={`${btn} -right-3`} aria-label={`Scroll ${label} right`}>›</button>}
    </div>
  );
}
