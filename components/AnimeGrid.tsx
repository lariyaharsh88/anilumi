import { Anime } from "@/lib/kitsu";
import AnimeCard from "./AnimeCard";

export default function AnimeGrid({ items, startRank, emptyText = "Nothing here yet." }: { items: Anime[]; startRank?: number; emptyText?: string }) {
  if (!items.length) return <p className="card p-8 text-center text-sm text-muted">{emptyText}</p>;
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {items.map((a, i) => (
        <AnimeCard key={a.id} a={a} rank={startRank ? startRank + i : undefined} priority={i < 5} />
      ))}
    </div>
  );
}
