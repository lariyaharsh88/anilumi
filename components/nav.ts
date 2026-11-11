import type { IconName } from "./NavIcon";

export type NavItem = { href: string; label: string; icon: IconName; desc?: string };

/** Always in the header. */
export const PRIMARY: NavItem[] = [
  { href: "/schedule", label: "Schedule", icon: "schedule" },
  { href: "/tonight", label: "Tonight", icon: "tonight" },
  { href: "/season", label: "Seasonal", icon: "season" },
  { href: "/top/rated", label: "Top 100", icon: "top" },
  { href: "/watch-order", label: "Watch orders", icon: "order" },
];

/** The Explore menu (desktop) and the Guides section of the mobile menu. */
export const EXPLORE: NavItem[] = [
  { href: "/genre", label: "Genres", icon: "genre", desc: "Browse by genre and mood" },
  { href: "/characters", label: "Characters", icon: "characters", desc: "Most popular characters" },
  { href: "/filler-lists", label: "Filler lists", icon: "filler", desc: "Episodes you can skip" },
  { href: "/how-long-to-watch", label: "How long to watch", icon: "time", desc: "Total binge time per series" },
  { href: "/anime-to-manga", label: "Anime to manga", icon: "manga", desc: "Where the manga picks up" },
  { href: "/parents-guide", label: "Parents' guide", icon: "parents", desc: "Is it OK for kids?" },
  { href: "/birthdays", label: "Birthdays", icon: "birthday", desc: "Character birthdays today" },
  { href: "/lists", label: "Lists", icon: "lists", desc: "Hand-picked anime lists" },
  { href: "/news", label: "News", icon: "news", desc: "Latest anime news" },
  { href: "/where-to-watch", label: "Where to watch", icon: "play", desc: "Streaming by country, sub or dub" },
  { href: "/dub-schedule", label: "Dub schedule", icon: "schedule", desc: "Next English and Hindi dub episodes" },
  { href: "/hindi-dub", label: "Hindi dubbed anime", icon: "hindi", desc: "Anime you can watch in Hindi" },
  { href: "/hi", label: "हिंदी गाइड", icon: "hindi", desc: "Watch guides in Hindi" },
  { href: "/random-anime-generator", label: "Random anime generator", icon: "random", desc: "Pick by genre, length or score" },
  { href: "/anime-birthday-twin", label: "Anime birthday twin", icon: "birthday", desc: "Who shares your birthday?" },
];

export const isActive = (path: string, href: string) =>
  href === "/season" ? path.startsWith("/season") : href === "/top/rated" ? path.startsWith("/top") : path === href || path.startsWith(`${href}/`);
