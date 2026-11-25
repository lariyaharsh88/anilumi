"use client";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import PageSkeleton from "@/components/PageSkeleton";

/** Pages that get the skeleton: an anime or a character page itself (not its subpages). */
const TARGET = /^\/(anime|character)\/[^/]+\/?$/;
const DELAY_MS = 350; // a cached page usually arrives first: no flash
const GIVE_UP_MS = 15_000;

/**
 * The loading screen for in-site clicks to anime and character pages. An uncached page takes 3-4 s to render, and
 * until now the old page sat still under the progress bar. Client-side only: it covers the area below the header
 * while the click is pending, so the HTML that crawlers, link previews and the edge cache get is unchanged (a
 * loading.tsx boundary put the skeleton and a streaming placeholder into every full page load, Nov 2026).
 */
export default function NavSkeleton() {
  const pathname = usePathname();
  const [kind, setKind] = useState<"anime" | "character" | null>(null);
  const [top, setTop] = useState(0);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const clear = () => { timers.current.forEach(clearTimeout); timers.current = []; };

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as Element | null)?.closest?.("a");
      if (!a || a.target === "_blank" || a.hasAttribute("download")) return;
      const url = new URL(a.href, location.href);
      if (url.origin !== location.origin || url.pathname === location.pathname || !TARGET.test(url.pathname)) return;
      const next = url.pathname.startsWith("/anime/") ? "anime" : "character";
      clear();
      timers.current.push(setTimeout(() => {
        setTop(document.querySelector("header[data-chrome]")?.getBoundingClientRect().bottom ?? 0);
        setKind(next);
      }, DELAY_MS));
      timers.current.push(setTimeout(() => setKind(null), GIVE_UP_MS));
    };
    const cancel = () => { clear(); setKind(null); };
    document.addEventListener("click", onClick, true);
    window.addEventListener("popstate", cancel);
    return () => { document.removeEventListener("click", onClick, true); window.removeEventListener("popstate", cancel); clear(); };
  }, []);

  // The new page rendered (or the route changed some other way).
  useEffect(() => { clear(); setKind(null); }, [pathname]);

  if (!kind) return null;
  return (
    <div className="fixed inset-x-0 bottom-0 z-30 overflow-hidden bg-bg" style={{ top: Math.max(0, top) }}>
      <PageSkeleton kind={kind} />
    </div>
  );
}
