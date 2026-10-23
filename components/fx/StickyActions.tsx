"use client";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { AnimatePresence, m } from "motion/react";
import WatchButton from "../WatchButton";
import type { WatchItem } from "@/lib/watchlist";

/**
 * Phone-only bottom bar that slides in once the hero (#hero) scrolls out of view. Portalled to <body>:
 * the page wrapper keeps a transform from its enter animation, which would otherwise make `fixed`
 * relative to the wrapper instead of the screen.
 */
export default function StickyActions({ item, watchHref = "#watch" }: { item: Omit<WatchItem, "addedAt">; watchHref?: string }) {
  const [show, setShow] = useState(false);
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
    const hero = document.getElementById("hero");
    if (!hero) return;
    const io = new IntersectionObserver(([e]) => setShow(!e.isIntersecting), { threshold: 0 });
    io.observe(hero);
    return () => io.disconnect();
  }, []);
  if (!mounted) return null;
  return createPortal(
    <AnimatePresence>
      {show && (
        <m.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
          className="fixed inset-x-0 bottom-0 z-40 border-t border-white/10 bg-bg/90 px-4 pb-[max(.75rem,env(safe-area-inset-bottom))] pt-3 backdrop-blur-xl md:hidden"
        >
          <div className="flex items-center gap-2">
            <p className="min-w-0 flex-1 truncate text-sm font-semibold text-ink">{item.title}</p>
            <a href={watchHref} className="btn-primary px-3 py-2">▶ Watch</a>
            <WatchButton item={item} />
          </div>
        </m.div>
      )}
    </AnimatePresence>,
    document.body,
  );
}
