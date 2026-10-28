"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { m } from "motion/react";

export type NavItem = { href: string; label: string };

const active = (path: string, href: string) => (href === "/season" ? path.startsWith("/season") : href === "/top/rated" ? path.startsWith("/top") : path === href || path.startsWith(`${href}/`));

/** Desktop nav with a pill that glides to the current section (shared layoutId persists across navigations). */
export default function NavLinks({ items, trailing }: { items: NavItem[]; trailing?: React.ReactNode }) {
  const path = usePathname() || "/";
  return (
    <nav className="hidden items-center gap-0.5 lg:flex" aria-label="Main">
      {items.map((n) => {
        const on = active(path, n.href);
        return (
          <Link key={n.href} href={n.href} aria-current={on ? "page" : undefined} className={`relative whitespace-nowrap rounded-full px-3 py-1.5 text-sm font-medium transition-colors ${on ? "text-ink" : "text-muted hover:text-ink"}`}>
            {on && <m.span layoutId="nav-pill" className="absolute inset-0 -z-10 rounded-full border border-white/10 bg-white/[0.07]" transition={{ type: "spring", stiffness: 500, damping: 38 }} />}
            {n.label}
          </Link>
        );
      })}
      {trailing}
    </nav>
  );
}

/** Mobile chip row with the same active state. */
export function MobileNav({ items }: { items: NavItem[] }) {
  const path = usePathname() || "/";
  return (
    <nav className="container-x edge-fade flex gap-1.5 overflow-x-auto pb-2 lg:hidden" aria-label="Main">
      {items.map((n) => (
        <Link key={n.href} href={n.href} aria-current={active(path, n.href) ? "page" : undefined} className={`chip whitespace-nowrap ${active(path, n.href) ? "chip-active" : ""}`}>{n.label}</Link>
      ))}
    </nav>
  );
}
