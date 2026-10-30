import Image from "next/image";
import Link from "@/components/Link";
import AnimeCard from "./AnimeCard";
import RailScroller from "./fx/RailScroller";
import type { FanRec } from "@/lib/anilist";

const votes = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : String(n));

/** "Fans who liked X also liked": AniList community recommendations with vote counts. */
export default function FanRecs({ title, recs, heading }: { title: string; recs: FanRec[]; heading?: string }) {
  if (!recs.length) return null;
  const label = heading ?? `Fans of ${title} also love`;
  return (
    <section className="reveal mt-12" aria-labelledby="fan-recs-h">
      <div className="mb-1 flex items-end justify-between gap-3">
        <h2 id="fan-recs-h" className="h-section">{label}</h2>
        <span className="hidden shrink-0 text-xs text-muted sm:inline">Voted by AniList members</span>
      </div>
      <RailScroller label={label}>
        {recs.map((r) => (
          <div key={r.anilistId} className="w-36 shrink-0 sm:w-44">
            {r.anime ? (
              <AnimeCard a={r.anime} className="w-full" />
            ) : (
              <a href={`https://anilist.co/anime/${r.anilistId}`} target="_blank" rel="noopener" className="group block">
                <span className="relative block aspect-[2/3] overflow-hidden rounded-xl border border-line bg-bg-2">{r.cover && <Image src={r.cover} alt="" fill sizes="176px" className="object-cover" />}</span>
                <span className="mt-2 line-clamp-2 block text-sm font-semibold group-hover:text-violet-2">{r.title}</span>
              </a>
            )}
            <p className="mt-1 flex items-center gap-1 text-xs text-muted">
              <span aria-hidden>👍</span>
              <span><strong className="text-ink/90">{votes(r.votes)}</strong> fans recommend</span>
            </p>
          </div>
        ))}
      </RailScroller>
      {recs[0]?.anime && (
        <p className="mt-2 text-sm text-muted">Most recommended: <Link href={`/anime/${recs[0].anime.slug}`} className="text-violet underline decoration-violet/40 underline-offset-2 hover:text-violet-2 hover:decoration-violet-2">{recs[0].title}</Link>, by {recs[0].votes.toLocaleString("en-US")} fans.</p>
      )}
    </section>
  );
}
