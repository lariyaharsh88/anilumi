import { animePath, type Anime } from "@/lib/kitsu";
import AnimeCard from "./AnimeCard";
import JsonLd from "./JsonLd";
import { itemList } from "@/lib/ld";

/** `ld`: the list's name, to also emit it as a schema.org ItemList (once per page, on list pages). */
export default function AnimeGrid({ items, startRank, emptyText = "Nothing here yet.", ld }: { items: Anime[]; startRank?: number; emptyText?: string; ld?: string }) {
  if (!items.length) return <p className="card p-8 text-center text-sm text-muted">{emptyText}</p>;
  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {ld && <JsonLd data={itemList(ld, items.map((a) => ({ url: animePath(a), name: a.title })), startRank || 1)} />}
      {items.map((a, i) => (
        <div key={a.id} className="reveal"><AnimeCard a={a} rank={startRank ? startRank + i : undefined} priority={i < 5} /></div>
      ))}
    </div>
  );
}
