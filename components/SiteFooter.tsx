import Link from "next/link";
import { site } from "@/lib/site";
import { seasonOf, cap } from "@/lib/kitsu";

export default function SiteFooter() {
  const { season, year } = seasonOf();
  const cols = [
    { h: "Browse", links: [["/schedule", "Airing this week"], [`/season/${year}/${season}`, `${cap(season)} ${year} anime`], ["/top/rated", "Top rated anime"], ["/top/popular", "Most popular anime"], ["/top/upcoming", "Upcoming anime"], ["/top/movies", "Best anime movies"], ["/watch-order", "Watch order guides"], ["/tonight", "What to watch tonight"], ["/compare", "Compare two anime"], ["/trends", "Genre trends"], ["/lists", "Lists: best by year, short anime"], ["/my", "My list"]] },
    { h: "Genres", links: [["/genre/action", "Action"], ["/genre/romance", "Romance"], ["/genre/comedy", "Comedy"], ["/genre/fantasy", "Fantasy"], ["/genre/isekai", "Isekai"], ["/genre", "All genres"]] },
    { h: "About", links: [["/about", "About & data sources"], ["/search", "Search"], ["/feed.xml", "RSS: this week’s episodes"]] },
  ];
  return (
    <footer className="mt-16 border-t border-line bg-bg-2">
      <div className="container-x grid gap-8 py-12 sm:grid-cols-3">
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
