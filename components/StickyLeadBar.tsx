"use client";
import { useEffect, useState } from "react";
import { usePathname } from "next/navigation";
import LeadForm from "./LeadForm";

const VIEWS = "anilumi:views", SHOWN = "anilumi:leadbar-shown", HIDE = "anilumi:leadbar-hide";
const SKIP = /^\/(admin|advertise|privacy|offline|embed)/;

/**
 * Slim digest signup at the bottom of the screen: only from the visitor's 2nd page view, at most once per
 * visit, and dismissing it hides it for 30 days. Never covers content on load and never blocks the page.
 */
export default function StickyLeadBar() {
  const path = usePathname() || "/";
  const [show, setShow] = useState(false);
  useEffect(() => {
    try {
      const views = Number(sessionStorage.getItem(VIEWS) || 0) + 1;
      sessionStorage.setItem(VIEWS, String(views));
      if (SKIP.test(path) || views < 2 || sessionStorage.getItem(SHOWN) || Number(localStorage.getItem(HIDE) || 0) > Date.now()) return;
      sessionStorage.setItem(SHOWN, "1");
      const t = setTimeout(() => setShow(true), 4000);
      return () => clearTimeout(t);
    } catch { /* storage blocked: never show */ }
  }, [path]);
  if (!show) return null;
  const close = () => { setShow(false); try { localStorage.setItem(HIDE, String(Date.now() + 30 * 86400000)); } catch {} };
  return (
    <div data-chrome className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-bg-2/95 backdrop-blur" role="region" aria-label="Weekly anime digest signup">
      <div className="container-x relative py-3 pr-10">
        <LeadForm compact kind="digest" source="sticky-bar" title="📰 This week in anime, every Friday" blurb="New episodes, premieres and news in one short email." button="Subscribe" />
        <button type="button" onClick={close} aria-label="Close" className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full text-muted hover:bg-white/5 hover:text-ink">✕</button>
      </div>
    </div>
  );
}
