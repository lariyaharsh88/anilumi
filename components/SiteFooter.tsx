import Link from "next/link";
import { site } from "@/lib/site";
import Logo from "./Logo";
import { seasonOf, cap } from "@/lib/kitsu";

export default function SiteFooter() {
  const { season, year } = seasonOf();
  const cols = [
    { h: "Browse", links: [["/schedule", "Airing this week"], [`/season/${year}/${season}`, `${cap(season)} ${year} anime`], ["/top/rated", "Top rated anime"], ["/top/popular", "Most popular anime"], ["/top/upcoming", "Upcoming anime"], ["/top/movies", "Best anime movies"], ["/watch-order", "Watch order guides"], ["/tonight", "What to watch tonight"], ["/compare", "Compare two anime"], ["/trends", "Genre trends"], ["/how-long-to-watch", "How long to watch"], ["/parents-guide", "Best anime for kids"], ["/upcoming-seasons", "Confirmed sequels"], ["/voice-actors", "Voice actors"], ["/anime-openings", "Anime openings"], ["/birthdays", "Character birthdays"], ["/tier-list", "Tier list maker"], ["/quiz", "What should I watch?"], ["/lists", "Lists: best by year, short anime"], ["/my", "My list"]] },
    { h: "Genres", links: [["/genre/action", "Action"], ["/genre/romance", "Romance"], ["/genre/comedy", "Comedy"], ["/genre/fantasy", "Fantasy"], ["/genre/isekai", "Isekai"], ["/genre", "All genres"]] },
    { h: "About", links: [["/about", "About & data sources"], ["/search", "Search"], ["/feed.xml", "RSS: this week’s episodes"]] },
  ];
  return (
    <footer className="relative mt-20 border-t border-line bg-bg-2">
      <div aria-hidden className="absolute inset-x-0 -top-px h-px bg-gradient-to-r from-transparent via-accent/70 to-transparent" />
      <div className="container-x flex items-center gap-2 pt-10 text-lg font-extrabold"><Logo size={24} /><span>Ani<span className="brand-gradient">Lumi</span></span><span className="ml-2 text-sm font-normal text-muted">{site.tagline}</span></div>
      <div className="container-x grid gap-8 py-10 sm:grid-cols-3">
        {cols.map((c) => (
          <div key={c.h}>
            <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">{c.h}</h3>
            <ul className="space-y-2 text-sm">
              {c.links.map(([href, label]) => (
                <li key={href}><Link href={href} className="text-ink/80 hover:text-ink">{label}</Link></li>
              ))}
            </ul>
          </div>
        ))}
      </div>
      <div className="container-x border-t border-line py-6 text-xs text-muted">
        <p>© {new Date().getFullYear()} {site.name}. Anime data and images from <a className="underline" href="https://kitsu.io" rel="noopener">Kitsu</a> and belong to their respective owners. Not affiliated with any studio or streaming service. Some links are affiliate links; we may earn a commission at no cost to you.</p>
      </div>
    </footer>
  );
}
