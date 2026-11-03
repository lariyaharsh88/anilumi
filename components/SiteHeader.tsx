import Link from "next/link";
import { site } from "@/lib/site";
import SearchBox from "./SearchBox";
import Logo from "./Logo";
import HeaderShell from "./HeaderShell";
import NavLinks, { MobileNav, MobileMenu, WatchlistLink } from "./NavLinks";
import ThemeToggle from "./ThemeToggle";

/**
 * Desktop: logo, icon nav with an Explore menu, search, My list, theme.
 * Phones: logo, search and a Menu button (full-screen sheet with every section), plus a row of icon chips.
 */
export default function SiteHeader() {
  return (
    <HeaderShell>
      <div className="container-x flex h-14 items-center gap-2.5 sm:gap-4">
        <Link href="/" className="group flex shrink-0 items-center gap-2 text-lg font-extrabold tracking-tight">
          <span className="transition-transform duration-300 group-hover:rotate-[-8deg] group-hover:scale-110"><Logo /></span>
          <span className="hidden min-[400px]:inline">Ani<span className="brand-gradient">Lumi</span></span>
          <span className="sr-only">{site.name} home</span>
        </Link>
        <NavLinks />
        <div className="ml-auto w-full min-w-0 lg:max-w-[220px] 2xl:max-w-xs">
          <SearchBox />
        </div>
        <WatchlistLink />
        <div className="hidden lg:block"><ThemeToggle /></div>
        <MobileMenu />
      </div>
      <MobileNav />
    </HeaderShell>
  );
}
