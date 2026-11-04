import Link from "@/components/Link";
import { Anime, animePath, posterUrl, posterSrcSet, subtypeLabel, statusLabel } from "@/lib/kitsu";
import TiltCard from "./fx/TiltCard";

/** `sizes`: the card's rendered width, so phones pick the 284 px poster when the card is narrow. */
type Props = { a: Anime; rank?: number; priority?: boolean; className?: string; sizes?: string };

export default function AnimeCard({ a, rank, priority = false, className = "w-full", sizes = "(max-width: 640px) 45vw, 200px" }: Props) {
  const img = posterUrl(a, "medium");
  const year = a.startDate?.slice(0, 4);
  const meta = [subtypeLabel(a.subtype), year, a.episodeCount ? `${a.episodeCount} ep` : a.status === "upcoming" ? statusLabel(a.status) : null].filter(Boolean).join(" · ");
  return (
    <Link href={animePath(a)} className={`group block min-w-0 ${className}`} title={a.title}>
      <TiltCard className="pc-tilt">
      <div className="pc-frame">
        {img ? (
          // Plain <img> with Kitsu's own sizes as a srcset: with unoptimized images, next/image would always send one size.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} srcSet={posterSrcSet(a)} sizes={sizes} alt={`${a.title} poster`} loading={priority ? "eager" : "lazy"} decoding="async" className="pc-img" />
        ) : (
          <div className="grid h-full place-items-center p-3 text-center text-xs text-muted">No image</div>
        )}
        <div className="pc-shade" />
        {rank && <span className="pc-rank">#{rank}</span>}
        {a.rating && <span className="pc-score">★ {(a.rating / 10).toFixed(1)}</span>}
        {a.status === "current" && <span className="pc-live"><span className="live-dot" aria-hidden />Airing</span>}
      </div>
      </TiltCard>
      <p className="pc-title">{a.title}</p>
      <p className="pc-meta">{meta}</p>
      {/* Only lists that fetch streaming links (season charts, top lists) have them. */}
      {a.streaming?.length > 0 && <p className="pc-meta text-ink/70">▶ {[...new Set(a.streaming.map((s) => s.site))].slice(0, 2).join(" · ")}</p>}
    </Link>
  );
}
