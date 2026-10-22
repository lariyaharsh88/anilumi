import Link from "next/link";
import { site } from "@/lib/site";
import SearchBox from "./SearchBox";

const nav = [
  { href: "/schedule", label: "Schedule" },
  { href: "/season", label: "Seasonal" },
  { href: "/top/rated", label: "Top 100" },
  { href: "/genre", label: "Genres" },
  { href: "/watch-order", label: "Watch orders" },
  { href: "/top/movies", label: "Movies" },
];

export default function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-line/70 bg-bg/85 backdrop-blur">
      <div className="container-x flex h-14 items-center gap-4">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-lg font-extrabold tracking-tight">
          <span className="grid h-7 w-7 place-items-center rounded-md bg-accent text-sm text-white">A</span>
          {site.name}
        </Link>
        <nav className="hidden items-center gap-1 md:flex">
          {nav.map((n) => (
            <Link key={n.href} href={n.href} className="whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium text-muted hover:bg-bg-2 hover:text-ink">
              {n.label}
            </Link>
          ))}
        </nav>
        <div className="ml-auto w-full max-w-xs">
          <SearchBox />
        </div>
      </div>
      <nav className="container-x flex gap-1 overflow-x-auto pb-2 md:hidden">
        {nav.map((n) => (
          <Link key={n.href} href={n.href} className="chip whitespace-nowrap">
            {n.label}
          </Link>
        ))}
      </nav>
    </header>
  );
}
