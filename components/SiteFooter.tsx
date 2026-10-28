import Link from "@/components/Link";
import { site } from "@/lib/site";
import Logo from "./Logo";
import { seasonOf, cap } from "@/lib/kitsu";

type Col = { h: string; links: [string, string][] };

export default function SiteFooter() {
  const { season, year } = seasonOf();
  // Four balanced groups (6–7 links each) instead of one long list, so the footer scans quickly.
  const cols: Col[] = [
    { h: "Discover", links: [["/schedule", "Airing this week"], [`/season/${year}/${season}`, `${cap(season)} ${year} season`], ["/top/rated", "Top rated"], ["/top/popular", "Most popular"], ["/top/upcoming", "Upcoming"], ["/top/movies", "Best movies"], ["/news", "Anime news"]] },
    { h: "Guides", links: [["/watch-order", "Watch orders"], ["/upcoming-seasons", "Confirmed sequels"], ["/how-long-to-watch", "How long to watch"], ["/parents-guide", "Anime for kids"], ["/anime-openings", "Openings & endings"], ["/voice-actors", "Voice actors"]] },
    { h: "Tools", links: [["/what-anime-is-this", "What anime is this?"], ["/tonight", "Watch tonight"], ["/quiz", "What should I watch?"], ["/tier-list", "Tier list maker"], ["/compare", "Compare anime"], ["/trends", "Genre trends"], ["/birthdays", "Birthdays"]] },
    { h: "Genres", links: [["/genre/action", "Action"], ["/genre/romance", "Romance"], ["/genre/comedy", "Comedy"], ["/genre/fantasy", "Fantasy"], ["/genre/isekai", "Isekai"], ["/genre", "All genres"]] },
  ];
  const small: [string, string][] = [["/about", "About"], ["/my", "My list"], ["/search", "Search"], ["/feed.xml", "RSS"]];

  return (
    <footer className="relative mt-20 border-t border-line bg-bg-2">
      <div aria-hidden className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" />

      <div className="container-x grid gap-10 py-12 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,3fr)] lg:gap-16">
        <div className="max-w-sm">
          <Link href="/" className="inline-flex items-center gap-2 text-lg font-extrabold">
            <Logo size={26} />
            <span>Ani<span className="brand-gradient">Lumi</span></span>
          </Link>
          <p className="mt-3 text-sm leading-6 text-muted">{site.tagline}. Countdowns, watch orders and season news for every anime, free and with no sign-up.</p>
          <div className="mt-4 flex flex-wrap gap-2">
            <Link href="/my" className="chip">My list</Link>
            <a href="/feed.xml" className="chip">RSS feed</a>
          </div>
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
          {cols.map((c) => (
            <div key={c.h} className="min-w-0">
              <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink/60">{c.h}</h3>
              <ul className="space-y-2 text-sm">
                {c.links.map(([href, label]) => (
                  <li key={href}>
                    <Link href={href} className="text-ink/75 transition-colors hover:text-ink">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t border-line">
        <div className="container-x flex flex-col gap-3 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {site.name} · Data and images from <a className="underline hover:text-ink" href="https://kitsu.io" rel="noopener">Kitsu</a>, owned by their rights holders. Not affiliated with any studio or streaming service.</p>
          <ul className="flex shrink-0 flex-wrap gap-x-4 gap-y-1">
            {small.map(([href, label]) => (
              <li key={href}>{href === "/feed.xml" ? <a href={href} className="hover:text-ink">{label}</a> : <Link href={href} className="hover:text-ink">{label}</Link>}</li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
