"use client";
import { useEffect, useState } from "react";
import { THEME_KEY, THEME_COLOR, type Theme } from "@/lib/prepaint";
import { track } from "@/lib/track";

/** Sun/moon button in the header. The pre-paint script in app/layout.tsx applies the saved theme. */
export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("dark");
  useEffect(() => { setTheme(document.documentElement.dataset.theme === "light" ? "light" : "dark"); }, []);
  const flip = () => {
    const next: Theme = theme === "light" ? "dark" : "light";
    setTheme(next);
    if (next === "light") document.documentElement.dataset.theme = "light";
    else delete document.documentElement.dataset.theme;
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLOR[next]);
    try { localStorage.setItem(THEME_KEY, next); } catch {}
    track("theme_change", { theme: next });
  };
  const label = theme === "light" ? "Switch to dark mode" : "Switch to light mode";
  return (
    <button type="button" onClick={flip} aria-label={label} title={label} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-bg-2 text-muted transition hover:border-violet hover:text-ink">
      {theme === "light" ? (
        <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" /></svg>
      ) : (
        <svg aria-hidden width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
      )}
    </button>
  );
}
