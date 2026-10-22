import Link from "next/link";
import { Anime } from "@/lib/kitsu";
import AnimeCard from "./AnimeCard";

export default function AnimeRail({ title, href, items, rank = false }: { title: string; href?: string; items: Anime[]; rank?: boolean }) {
  if (!items.length) return null;
  return (
    <section className="mt-10">
      <div className="mb-3 flex items-end justify-between">
        <h2 className="h-section">{title}</h2>
        {href && <Link href={href} className="text-sm font-medium text-violet hover:underline">View all →</Link>}
      </div>
      <div className="scroll-x">
        {items.map((a, i) => (
          <AnimeCard key={a.id} a={a} rank={rank ? i + 1 : undefined} priority={i < 4} className="w-36 sm:w-44" />
        ))}
      </div>
    </section>
  );
}
