"use client";
import { useEffect, useRef, useState } from "react";
import { m } from "motion/react";

export type NavSection = { id: string; label: string };

/** Sticky in-page tabs with scroll-spy; the active pill glides between tabs and stays scrolled into view. */
export default function SectionNav({ sections }: { sections: NavSection[] }) {
  const [active, setActive] = useState(sections[0]?.id);
  const bar = useRef<HTMLDivElement>(null);
  const lock = useRef(0);

  useEffect(() => {
    const els = sections.map((s) => document.getElementById(s.id)).filter((x): x is HTMLElement => Boolean(x));
    const io = new IntersectionObserver(
      (entries) => {
        if (Date.now() < lock.current) return; // ignore while a tab click is smooth-scrolling
        const vis = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top);
        if (vis[0]) setActive(vis[0].target.id);
      },
      { rootMargin: "-140px 0px -55% 0px", threshold: 0 },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections]);

  useEffect(() => {
    // Scroll only the tab strip sideways; scrollIntoView would also nudge the page vertically.
    const el = bar.current;
    const tab = el?.querySelector<HTMLElement>(`[data-id="${active}"]`);
    if (el && tab) el.scrollTo({ left: tab.offsetLeft - el.clientWidth / 2 + tab.offsetWidth / 2, behavior: "smooth" });
  }, [active]);

  if (sections.length < 2) return null;
  return (
    <nav aria-label="On this page" className="sticky top-[98px] z-30 -mx-4 mt-2 border-y border-white/5 bg-bg/95 backdrop-blur-xl sm:mx-0 sm:rounded-2xl sm:border md:top-[60px]">
      <div ref={bar} className="flex gap-1 overflow-x-auto px-3 py-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {sections.map((s) => {
          const on = s.id === active;
          return (
            <a
              key={s.id}
              data-id={s.id}
              href={`#${s.id}`}
              aria-current={on ? "location" : undefined}
              onClick={() => { setActive(s.id); lock.current = Date.now() + 900; }}
              className={`relative whitespace-nowrap rounded-full px-3.5 py-1.5 text-sm font-medium transition-colors ${on ? "text-ink" : "text-muted hover:text-ink"}`}
            >
              {on && <m.span layoutId="section-pill" className="absolute inset-0 -z-10 rounded-full bg-gradient-to-r from-accent/25 to-violet/25 ring-1 ring-white/10" transition={{ type: "spring", stiffness: 480, damping: 36 }} />}
              {s.label}
            </a>
          );
        })}
      </div>
    </nav>
  );
}
