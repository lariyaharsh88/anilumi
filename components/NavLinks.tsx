"use client";
import { useEffect, useId, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { m, AnimatePresence, useReducedMotion } from "motion/react";
import NavIcon from "./NavIcon";
import ThemeToggle from "./ThemeToggle";
import { useWatchlist } from "@/lib/watchlist";
import { PRIMARY, EXPLORE, isActive, type NavItem } from "./nav";

/** Closes a popover on Escape, a click outside `ref`, or a navigation. */
function useDismiss(open: boolean, close: () => void, ref: React.RefObject<HTMLElement | null>, also?: React.RefObject<HTMLElement | null>) {
  const path = usePathname();
  useEffect(() => { close(); }, [path]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (!open) return;
    const key = (e: KeyboardEvent) => { if (e.key === "Escape") close(); };
    const down = (e: PointerEvent) => { const t = e.target as Node; if (ref.current && !ref.current.contains(t) && !also?.current?.contains(t)) close(); };
    document.addEventListener("keydown", key);
    document.addEventListener("pointerdown", down);
    return () => { document.removeEventListener("keydown", key); document.removeEventListener("pointerdown", down); };
  }, [open, close, ref, also]);
}

/**
 * Desktop nav: icon links with a pill that glides to the current section (shared layoutId persists across
 * navigations), then an Explore menu. Labels show from xl; at lg the links are icons with tooltips.
 */
export default function NavLinks() {
  const path = usePathname() || "/";
  return (
    <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
      {PRIMARY.map((n) => {
        const on = isActive(path, n.href);
        return (
          <Link key={n.href} href={n.href} title={n.label} aria-label={n.label} aria-current={on ? "page" : undefined} className={`relative flex items-center gap-1.5 whitespace-nowrap rounded-full px-2.5 py-1.5 text-sm font-medium transition-colors xl:px-3 ${on ? "text-ink" : "text-muted hover:text-ink"}`}>
            {on && <m.span layoutId="nav-pill" className="absolute inset-0 -z-10 rounded-full border border-white/10 bg-white/[0.07]" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
            <NavIcon name={n.icon} className={`h-4 w-4 ${on ? "text-violet" : ""}`} />
            <span aria-hidden="true" className="hidden xl:inline">{n.label}</span>
          </Link>
        );
      })}
      <ExploreMenu path={path} />
    </nav>
  );
}

function ExploreMenu({ path }: { path: string }) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const id = useId();
  const reduce = useReducedMotion();
  useDismiss(open, () => setOpen(false), ref);
  const on = EXPLORE.some((n) => isActive(path, n.href));
  return (
    <div ref={ref} className="relative">
      <button type="button" aria-expanded={open} aria-controls={id} onClick={() => setOpen((o) => !o)} className={`flex items-center gap-1.5 rounded-full px-2.5 py-1.5 text-sm font-medium transition-colors xl:px-3 ${open || on ? "text-ink" : "text-muted hover:text-ink"} ${open ? "bg-white/[0.07]" : ""}`}>
        <NavIcon name="explore" className={`h-4 w-4 ${on ? "text-violet" : ""}`} />
        <span>Explore</span>
        <NavIcon name="chevron" className={`h-3.5 w-3.5 transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <AnimatePresence>
        {open && (
          <m.div id={id} initial={reduce ? false : { opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, y: -6 }} transition={{ duration: 0.16 }}
            className="absolute left-1/2 top-full z-50 mt-3 w-[34rem] max-w-[90vw] -translate-x-1/2 rounded-2xl border border-line bg-bg-2/95 p-2 shadow-[0_24px_60px_-20px_rgba(0,0,0,.7)] backdrop-blur-xl">
            <ul className="grid grid-cols-2 gap-0.5">
              {EXPLORE.map((n) => <li key={n.href}><MenuLink item={n} on={isActive(path, n.href)} /></li>)}
            </ul>
          </m.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function MenuLink({ item, on }: { item: NavItem; on: boolean }) {
  return (
    <Link href={item.href} aria-current={on ? "page" : undefined} className={`group flex items-start gap-3 rounded-xl p-2.5 transition-colors ${on ? "bg-accent/15" : "hover:bg-white/[0.05]"}`}>
      <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg border transition-colors ${on ? "border-accent/50 text-violet" : "border-line bg-bg text-muted group-hover:border-violet/60 group-hover:text-violet"}`}>
        <NavIcon name={item.icon} className="h-[18px] w-[18px]" />
      </span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-ink">{item.label}</span>
        {item.desc && <span className="block text-xs leading-5 text-muted">{item.desc}</span>}
      </span>
    </Link>
  );
}

/** My list with a bookmark icon and the saved count; the label shows from xl. */
export function WatchlistLink() {
  const { items, ready } = useWatchlist();
  const path = usePathname() || "/";
  const on = path === "/my" || path.startsWith("/my/");
  return (
    <Link href="/my" title="My list" aria-label={ready && items.length > 0 ? `My list, ${items.length} saved` : "My list"} aria-current={on ? "page" : undefined} className={`relative hidden h-9 items-center gap-1.5 rounded-lg border px-2.5 text-sm font-medium transition lg:flex ${on ? "border-accent/60 text-ink" : "border-line bg-bg-2 text-muted hover:border-violet hover:text-ink"}`}>
      <NavIcon name="bookmark" className="h-4 w-4" />
      <span aria-hidden="true" className="hidden whitespace-nowrap xl:inline">My list</span>
      {ready && items.length > 0 && <span className="rounded-full bg-accent-strong px-1.5 text-[10px] font-bold leading-4 text-snow">{items.length}</span>}
    </Link>
  );
}

/** Phones and tablets: a scrollable row of icon chips under the search bar. */
export function MobileNav() {
  const path = usePathname() || "/";
  return (
    <nav className="container-x edge-fade flex gap-1.5 overflow-x-auto pb-2.5 [scrollbar-width:none] lg:hidden" aria-label="Sections">
      {PRIMARY.map((n) => {
        const on = isActive(path, n.href);
        return (
          <Link key={n.href} href={n.href} aria-current={on ? "page" : undefined} className={`chip shrink-0 gap-1.5 whitespace-nowrap py-1.5 ${on ? "chip-active" : ""}`}>
            <NavIcon name={n.icon} className={`h-3.5 w-3.5 ${on ? "text-violet" : ""}`} />
            {n.label}
          </Link>
        );
      })}
    </nav>
  );
}

/** Phones and tablets: a Menu button that opens a full-screen sheet with every section, My list and the theme. */
export function MobileMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const sheet = useRef<HTMLDivElement>(null);
  const first = useRef<HTMLAnchorElement>(null);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const button = useRef<HTMLButtonElement>(null);
  const path = usePathname() || "/";
  const reduce = useReducedMotion();
  const { items, ready } = useWatchlist();
  const close = () => setOpen(false);
  useDismiss(open, close, ref, sheet);
  useEffect(() => {
    if (!open) return;
    // Lock scrolling on <html>, not <body>: with overflow-x: clip on both, overflow: hidden on <body> makes it the
    // sticky header's scroll container, so after scrolling down the header (and the close button) jumped off-screen.
    const root = document.documentElement;
    const prev = root.style.overflow;
    const trigger = button.current;
    root.style.overflow = "hidden";
    first.current?.focus();
    return () => { root.style.overflow = prev; trigger?.focus({ preventScroll: true }); };
  }, [open]);

  return (
    <div ref={ref} className="lg:hidden">
      <button ref={button} type="button" aria-expanded={open} aria-controls="mobile-menu" aria-label={open ? "Close menu" : "Open menu"} onClick={() => setOpen((o) => !o)} className="grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-line bg-bg-2 text-muted transition hover:border-violet hover:text-ink">
        <svg aria-hidden viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth={1.9} strokeLinecap="round">
          {open ? <path d="M6 6l12 12M18 6 6 18" /> : <path d="M4 7h16M4 12h16M4 17h10" />}
        </svg>
      </button>
      {/* Portalled to <body>: the header's backdrop-filter would make it the containing block of a fixed child. */}
      {mounted && createPortal(<AnimatePresence>
        {open && (
          <m.div ref={sheet} id="mobile-menu" role="dialog" aria-modal="true" aria-label="Menu" initial={reduce ? false : { opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, y: -10 }} transition={{ duration: 0.18 }}
            className="fixed inset-x-0 bottom-0 top-14 z-50 overflow-y-auto overscroll-contain border-t border-line bg-bg/95 backdrop-blur-xl">
            <div className="container-x space-y-6 py-5 pb-[max(1.5rem,env(safe-area-inset-bottom))]">
              <section aria-labelledby="mm-browse">
                <h2 id="mm-browse" className="mb-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Browse</h2>
                <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                  {PRIMARY.map((n, i) => {
                    const on = isActive(path, n.href);
                    return (
                      <li key={n.href}>
                        <Link ref={i === 0 ? first : undefined} href={n.href} aria-current={on ? "page" : undefined} className={`flex items-center gap-2.5 rounded-xl border p-3 text-sm font-semibold transition-colors ${on ? "border-accent/60 bg-accent/15 text-ink" : "border-line bg-bg-2 text-ink hover:border-violet/60"}`}>
                          <NavIcon name={n.icon} className={`h-5 w-5 ${on ? "text-violet" : "text-muted"}`} />
                          {n.label}
                        </Link>
                      </li>
                    );
                  })}
                  <li>
                    <Link href="/my" aria-current={path.startsWith("/my") ? "page" : undefined} className="flex items-center gap-2.5 rounded-xl border border-line bg-bg-2 p-3 text-sm font-semibold text-ink transition-colors hover:border-violet/60">
                      <NavIcon name="bookmark" className="h-5 w-5 text-muted" />
                      My list
                      {ready && items.length > 0 && <span className="ml-auto rounded-full bg-accent-strong px-1.5 text-[10px] font-bold leading-4 text-snow">{items.length}</span>}
                    </Link>
                  </li>
                </ul>
              </section>
              <section aria-labelledby="mm-guides">
                <h2 id="mm-guides" className="mb-1.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-muted">Guides &amp; more</h2>
                <ul className="grid gap-0.5 sm:grid-cols-2">
                  {EXPLORE.map((n) => <li key={n.href}><MenuLink item={n} on={isActive(path, n.href)} /></li>)}
                </ul>
              </section>
              <div className="flex items-center justify-between rounded-xl border border-line bg-bg-2 px-3 py-2.5">
                <span className="text-sm font-medium text-ink">Theme</span>
                <ThemeToggle />
              </div>
            </div>
          </m.div>
        )}
      </AnimatePresence>, document.body)}
    </div>
  );
}
