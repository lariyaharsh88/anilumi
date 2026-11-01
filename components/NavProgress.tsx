"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

/**
 * Thin bar at the top that starts the moment a same-site link is clicked and finishes when the new page
 * renders. Uncached pages can take seconds on the free origin; without this a click looked like nothing
 * happened.
 */
export default function NavProgress() {
  const pathname = usePathname();
  const [w, setW] = useState(0); // 0 = hidden
  const timer = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || (url.pathname === location.pathname && url.search === location.search)) return;
      if (timer.current) clearInterval(timer.current);
      setW(12);
      // Ease towards 90% while waiting; the route change completes it.
      timer.current = setInterval(() => setW((x) => (x < 90 ? x + (90 - x) * 0.08 : x)), 200);
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, []);

  useEffect(() => {
    if (timer.current) { clearInterval(timer.current); timer.current = null; }
    setW((x) => (x ? 100 : 0));
    const t = setTimeout(() => setW(0), 250);
    return () => clearTimeout(t);
  }, [pathname]);

  return (
    <div aria-hidden className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5">
      <div
        className="h-full bg-gradient-to-r from-accent via-violet to-accent-2 shadow-[0_0_8px_var(--color-accent)]"
        style={{ width: `${w}%`, opacity: w ? 1 : 0, transition: w === 0 ? "opacity .2s" : "width .2s ease-out, opacity .2s" }}
      />
    </div>
  );
}
