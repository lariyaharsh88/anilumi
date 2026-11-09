import Link from "@/components/Link";
import { site } from "@/lib/site";
import Logo from "./Logo";
import LeadForm from "./LeadForm";
import CorrectionForm from "./CorrectionForm";
import ConsentLink from "./ConsentLink";
import { dbEnabled } from "@/lib/db";
import { seasonOf, shiftSeason, cap } from "@/lib/kitsu";

type Col = { h: string; links: [string, string][] };

export default function SiteFooter() {
  const { season, year } = seasonOf();
  const next = shiftSeason(season, year, 1);
  // Four balanced groups (6–8 links each) instead of one long list, so the footer scans quickly.
  const cols: Col[] = [
    { h: "Discover", links: [["/schedule", "Airing this week"], [`/season/${year}/${season}`, `${cap(season)} ${year} season`], ["/top/rated", "Top rated"], ["/top/popular", "Most popular"], ["/top/upcoming", "Upcoming"], ["/top/movies", "Best movies"], ["/news", "Anime news"], [`/season/${next.year}/${next.season}/preview`, `${cap(next.season)} ${next.year} preview`]] },
    { h: "Guides", links: [["/watch-order", "Watch orders"], ["/upcoming-seasons", "Confirmed sequels"], ["/how-long-to-watch", "How long to watch"], ["/filler-lists", "Filler lists"], ["/anime-to-manga", "Anime to manga"], ["/parents-guide", "Anime for kids"], ["/anime-openings", "Openings & endings"], ["/characters", "Popular characters"], ["/voice-actors", "Voice actors"], ["/hindi-dub", "Hindi dubbed anime"], ["/hi", "हिंदी गाइड"]] },
    { h: "Tools", links: [["/what-anime-is-this", "What anime is this?"], ["/tonight", "Watch tonight"], ["/quiz", "What should I watch?"], ["/tier-list", "Tier list maker"], ["/compare", "Compare anime"], ["/trends", "Genre trends"], ["/birthdays", "Birthdays"], ["/on-this-day", "On this day"], ["/hype", "Most hyped"]] },
    { h: "Genres", links: [["/genre/action", "Action"], ["/genre/romance", "Romance"], ["/genre/comedy", "Comedy"], ["/genre/fantasy", "Fantasy"], ["/genre/isekai", "Isekai"], ["/genre", "All genres"]] },
  ];
  const small: [string, string][] = [["/about", "About"], ["/how-we-check", "How we check"], ["/contact", "Contact"], ["/advertise", "Advertise"], ["/privacy", "Privacy"], ["/my", "My list"], ["/feed.xml", "RSS"]];

  return (
    <footer data-chrome className="relative mt-20 border-t border-line bg-bg-2">
      <div aria-hidden className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" />

      {/* Not gated on dbEnabled(): many pages are prerendered at build time without the database secret. */}
      <div className="container-x pt-6"><CorrectionForm /></div>
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
          {dbEnabled() && <LeadForm compact className="mt-6" kind="digest" source="footer-digest" title="📰 Weekly anime digest" button="Subscribe" />}
        </div>

        <nav aria-label="Footer" className="grid grid-cols-2 gap-x-6 gap-y-8 sm:grid-cols-4">
          {cols.map((c) => (
            <div key={c.h} className="min-w-0">
              <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-ink/60">{c.h}</h2>
              <ul className="space-y-0.5 text-sm sm:space-y-2">
                {c.links.map(([href, label]) => (
                  <li key={href}>
                    {/* Taller tap area on phones (≥ 32px); the desktop list keeps its compact rhythm. */}
                    <Link href={href} className="ft-link">{label}</Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </nav>
      </div>

      <div className="border-t border-line">
        <div className="container-x flex flex-col gap-3 py-5 text-xs text-muted sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {site.name} · Data and images from <a className="underline hover:text-ink" href="https://kitsu.io" rel="noopener nofollow">Kitsu</a>, owned by their rights holders. Not affiliated with any studio or streaming service.</p>
          <ul className="flex shrink-0 flex-wrap gap-x-4 gap-y-0 sm:gap-y-1">
            {small.map(([href, label]) => (
              <li key={href}>{href === "/feed.xml" ? <a href={href} className="inline-block py-1.5 hover:text-ink sm:py-0">{label}</a> : <Link href={href} className="inline-block py-1.5 hover:text-ink sm:py-0">{label}</Link>}</li>
            ))}
            <li><ConsentLink className="inline-block py-1.5 hover:text-ink sm:py-0" /></li>
          </ul>
        </div>
      </div>
    </footer>
  );
}
