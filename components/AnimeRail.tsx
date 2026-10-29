import Link from "@/components/Link";
import { Anime } from "@/lib/kitsu";
import AnimeCard from "./AnimeCard";
import RailScroller from "./fx/RailScroller";

type Props = { title: string; href?: string; items: Anime[]; rank?: boolean; bigRank?: boolean };

/** Horizontal rail. `bigRank` draws Top-10 style outlined numerals beside each card. */
export default function AnimeRail({ title, href, items, rank = false, bigRank = false }: Props) {
  if (!items.length) return null;
  return (
    <section className="reveal mt-12">
      <div className="mb-2 flex items-end justify-between">
        <h2 className="h-section">{title}</h2>
        {href && <Link href={href} className="group text-sm font-medium text-violet hover:text-violet-2">View all <span className="inline-block transition-transform group-hover:translate-x-1">→</span></Link>}
      </div>
      <RailScroller label={title}>
        {items.map((a, i) =>
          bigRank ? (
            <div key={a.id} className="flex items-end">
              <span className="rank-numeral -mr-3 select-none pb-[3.9rem] sm:-mr-4">
                <span aria-hidden>{i + 1}</span>
                <span className="sr-only">Rank {i + 1}</span>
              </span>
              <AnimeCard a={a} priority={i < 4} className="relative w-32 sm:w-40" sizes="(max-width: 640px) 128px, 160px" />
            </div>
          ) : (
            <AnimeCard key={a.id} a={a} rank={rank ? i + 1 : undefined} priority={i < 4} className="w-36 sm:w-44" sizes="(max-width: 640px) 144px, 176px" />
          ),
        )}
      </RailScroller>
    </section>
  );
}
