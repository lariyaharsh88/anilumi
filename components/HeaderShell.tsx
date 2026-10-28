"use client";
import { useState } from "react";
import { useMotionValueEvent, useScroll } from "motion/react";

/** Sticky glass header that tightens and gains a shadow once the page scrolls. */
export default function HeaderShell({ children }: { children: React.ReactNode }) {
  const { scrollY } = useScroll();
  const [scrolled, setScrolled] = useState(false);
  useMotionValueEvent(scrollY, "change", (v) => setScrolled(v > 12));
  return (
    <header data-chrome className={`sticky top-0 z-40 border-b transition-[background-color,box-shadow,border-color] duration-300 ${scrolled ? "border-line/80 bg-bg/80 shadow-[0_8px_30px_-12px_rgba(0,0,0,.7)] backdrop-blur-xl" : "border-transparent bg-bg/40 backdrop-blur-md"}`}>
      {children}
    </header>
  );
}
