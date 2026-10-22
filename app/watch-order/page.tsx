import type { Metadata } from "next";
import Link from "next/link";
import { listAnime, animePath, getRelations, uniqueById } from "@/lib/kitsu";
import { WATCH_ORDER_OVERRIDES } from "@/data/watch-orders";
import AnimeGrid from "@/components/AnimeGrid";
import Breadcrumbs from "@/components/Breadcrumbs";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Anime Watch Order Guides – Every Franchise in the Right Order",
  description: "Auto-generated watch orders for the biggest anime franchises: seasons, movies, OVAs and which recaps to skip, with total binge time.",
  alternates: { canonical: "/watch-order" },
};

export default async function WatchOrderIndex() {
  const pages = await Promise.all([0, 20].map((offset) => listAnime({ sort: "-userCount", limit: 20, offset, filter: { subtype: "TV" } })));
  const candidates = uniqueById(pages.flatMap((p) => p.items));
  const rels = await Promise.all(candidates.map((a) => getRelations(a.id)));
  // Only franchise starting points: drop entries that have a prequel on record.
  const items = candidates.filter((_, i) => !rels[i].some((r) => r.role === "prequel")).slice(0, 24);
  return (
    <div className="container-x py-8">
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { href: "/watch-order", label: "Watch orders" }]} />
      <h1 className="text-3xl font-extrabold tracking-tight">Anime watch orders</h1>
      <p className="mt-2 max-w-2xl text-muted">Pick a franchise. We assemble seasons, movies, OVAs and spin-offs into one list, flag the recaps you can skip, and total the runtime.</p>
      <ul className="mt-6 flex flex-wrap gap-2">
        {items.map((a) => (
          <li key={a.id}><Link href={`/watch-order/${a.slug}`} className="chip">{a.title} →</Link></li>
        ))}
      </ul>
      <h2 className="h-section mt-10 mb-3">Guides with editor notes</h2>
      <ul className="flex flex-wrap gap-2">
        {Object.keys(WATCH_ORDER_OVERRIDES).map((slug) => (
          <li key={slug}><Link href={`/watch-order/${slug}`} className="chip">{slug.replace(/-/g, " ")}</Link></li>
        ))}
      </ul>
      <h2 className="h-section mt-10 mb-3">Most popular franchises</h2>
      <AnimeGrid items={items} />
      <p className="mt-4 text-sm text-muted">Any title has a watch order: open it and press “Watch order”, or go to <code className="text-ink">/watch-order/&lt;slug&gt;</code>. Example: <Link href={animePath({ slug: "naruto" })} className="text-violet">Naruto</Link>.</p>
    </div>
  );
}
