import Link from "@/components/Link";
import GenreIcon from "./GenreIcon";

/** Hue cycle shared by the home page and /genre tiles. */
export const GENRE_HUES = [350, 262, 40, 190, 300, 140, 20, 220];

/** Genre tile: tinted icon chip, name and title count, with a faint oversized icon in the corner. */
export default function GenreTile({ slug, title, count, hue }: { slug: string; title: string; count?: number | null; hue: number }) {
  return (
    <Link href={`/genre/${slug}`} className="genre-tile card group relative flex items-center gap-3 p-3 transition duration-300 hover:-translate-y-0.5 hover:border-white/20" style={{ ["--h" as string]: String(hue) }}>
      <span className="genre-ico grid h-10 w-10 shrink-0 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"><GenreIcon slug={slug} /></span>
      <span className="min-w-0">
        <span className="block truncate font-semibold text-ink">{title}</span>
        <span className="block text-xs text-muted">{count ? `${count.toLocaleString()} titles` : "Browse"}</span>
      </span>
      <span aria-hidden className="genre-mark pointer-events-none absolute -bottom-3 -right-3 -rotate-12 transition-transform duration-500 group-hover:-rotate-3 group-hover:scale-110"><GenreIcon slug={slug} className="h-16 w-16" /></span>
    </Link>
  );
}
