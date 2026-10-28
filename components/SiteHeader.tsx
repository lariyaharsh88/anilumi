import Link from "next/link";
import { site } from "@/lib/site";
import SearchBox from "./SearchBox";
import WatchlistBadge from "./WatchlistBadge";
import Logo from "./Logo";
import HeaderShell from "./HeaderShell";
import NavLinks, { MobileNav } from "./NavLinks";
import ThemeToggle from "./ThemeToggle";

const nav = [
  { href: "/schedule", label: "Schedule" },
  { href: "/tonight", label: "Tonight" },
  { href: "/season", label: "Seasonal" },
  { href: "/top/rated", label: "Top 100" },
  { href: "/genre", label: "Genres" },
  { href: "/watch-order", label: "Watch orders" },
  { href: "/lists", label: "Lists" },
];

export default function SiteHeader() {
  return (
    <HeaderShell>
      <div className="container-x flex h-14 items-center gap-4">
        <Link href="/" className="group flex shrink-0 items-center gap-2 text-lg font-extrabold tracking-tight">
          <span className="transition-transform duration-300 group-hover:rotate-[-8deg] group-hover:scale-110"><Logo /></span>
          <span>Ani<span className="brand-gradient">Lumi</span></span>
          <span className="sr-only">{site.name} home</span>
        </Link>
        <NavLinks items={nav} trailing={<WatchlistBadge />} />
        <div className="ml-auto w-full min-w-0 max-w-xs">
          <SearchBox />
        </div>
        <ThemeToggle />
      </div>
      <MobileNav items={[...nav, { href: "/my", label: "My list" }]} />
    </HeaderShell>
  );
}
