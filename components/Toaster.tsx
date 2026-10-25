"use client";
import { useEffect, useState } from "react";
import Link from "@/components/Link";
import { AnimatePresence, m } from "motion/react";

export type Toast = { id: number; text: string; href?: string; cta?: string };

/** Fire from anywhere: window.dispatchEvent(new CustomEvent("anilumi:toast", { detail: { text, href, cta } })) */
export function toast(t: Omit<Toast, "id">) {
  window.dispatchEvent(new CustomEvent("anilumi:toast", { detail: t }));
}

export default function Toaster() {
  const [items, setItems] = useState<Toast[]>([]);
  useEffect(() => {
    const on = (e: Event) => {
      const t = { ...(e as CustomEvent<Omit<Toast, "id">>).detail, id: Date.now() + Math.random() };
      setItems((xs) => [...xs.slice(-2), t]);
      setTimeout(() => setItems((xs) => xs.filter((x) => x.id !== t.id)), 3200);
    };
    window.addEventListener("anilumi:toast", on);
    return () => window.removeEventListener("anilumi:toast", on);
  }, []);
  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-4 z-50 flex flex-col items-center gap-2 px-4" role="status" aria-live="polite">
      <AnimatePresence>
        {items.map((t) => (
          <m.div
            key={t.id}
            layout
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.98 }}
            transition={{ type: "spring", stiffness: 420, damping: 30 }}
            className="pointer-events-auto flex items-center gap-3 rounded-xl border border-line bg-card/95 px-4 py-2.5 text-sm shadow-card backdrop-blur"
          >
            <span className="text-ink">{t.text}</span>
            {t.href && <Link href={t.href} className="font-semibold text-violet-2 hover:underline">{t.cta || "View"}</Link>}
          </m.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
