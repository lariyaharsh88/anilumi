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
      <TiltCard className="rounded-xl shadow-card transition-shadow duration-300 group-hover:shadow-[0_18px_40px_-14px_rgba(139,124,255,.55)]">
      <div className="relative aspect-[2/3] w-full overflow-hidden rounded-xl border border-line bg-bg-2 transition-colors duration-300 group-hover:border-violet/60">
        {img ? (
          // Plain <img> with Kitsu's own sizes as a srcset: with unoptimized images, next/image would always send one size.
          // eslint-disable-next-line @next/next/no-img-element
          <img src={img} srcSet={posterSrcSet(a)} sizes={sizes} alt={`${a.title} poster`} loading={priority ? "eager" : "lazy"} fetchPriority={priority ? "high" : undefined} decoding="async" className="absolute inset-0 h-full w-full object-cover transition duration-300 group-hover:scale-105" />
        ) : (
          <div className="grid h-full place-items-center p-3 text-center text-xs text-muted">No image</div>
        )}
        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/60 to-transparent" />
        {rank && <span className="absolute left-2 top-2 rounded-md bg-black/75 px-2 py-0.5 text-xs font-bold text-[#ffc857]">#{rank}</span>}
        {a.rating && <span className="absolute right-2 top-2 rounded-md bg-black/75 px-1.5 py-0.5 text-xs font-semibold text-snow">★ {(a.rating / 10).toFixed(1)}</span>}
        {a.status === "current" && <span className="absolute bottom-2 left-2 flex items-center gap-1 rounded-md bg-accent-strong px-1.5 py-0.5 text-[10px] font-bold uppercase text-snow"><span className="live-dot" aria-hidden />Airing</span>}
      </div>
      </TiltCard>
      <p className="mt-2 line-clamp-2 min-h-[2.5rem] text-sm font-semibold leading-5 text-ink group-hover:text-violet">{a.title}</p>
      <p className="mt-0.5 truncate text-xs text-muted">{meta}</p>
    </Link>
  );
}
