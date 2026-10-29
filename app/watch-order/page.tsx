import type { Metadata } from "next";
import Link from "@/components/Link";
import { listAnime, animePath, getRelations, uniqueById, posterUrl } from "@/lib/kitsu";
import { WATCH_ORDER_OVERRIDES } from "@/data/watch-orders";
import PageHero from "@/components/PageHero";
import Image from "next/image";

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
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/watch-order", label: "Watch orders" }]}
        eyebrow="Franchise guides"
        title={<>Anime <span className="text-gradient">watch orders</span></>}
        subtitle="Pick a franchise. We assemble seasons, movies, OVAs and spin-offs into one list, flag the recaps you can skip, and total the runtime."
        facts={[{ value: String(Object.keys(WATCH_ORDER_OVERRIDES).length), label: "guides with editor notes" }, { value: String(items.length), label: "popular franchises" }]}
        hue={262}
        posters={items.slice(0, 3).map((a) => posterUrl(a, "medium"))}
      />

      <section className="reveal mt-10">
        <h2 className="h-section mb-3">Most popular franchises</h2>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((a) => (
            <li key={a.id}>
              <Link href={`/watch-order/${a.slug}`} className="card group flex items-center gap-3 p-2.5 transition duration-300 hover:-translate-y-0.5 hover:border-violet/60">
                <span className="relative h-16 w-11 shrink-0 overflow-hidden rounded-md bg-bg-2">{posterUrl(a, "tiny") && <Image src={posterUrl(a, "tiny")!} alt="" fill sizes="44px" className="object-cover" />}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold group-hover:text-violet-2">{a.title}</span>
                  <span className="text-xs text-muted">{a.startDate?.slice(0, 4)}{a.rating ? ` · ★ ${(a.rating / 10).toFixed(1)}` : ""}</span>
                </span>
                <span className="text-muted transition group-hover:translate-x-0.5 group-hover:text-ink" aria-hidden>→</span>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="reveal mt-12">
        <h2 className="h-section mb-3">Guides with editor notes</h2>
        <ul className="flex flex-wrap gap-2">
          {Object.entries(WATCH_ORDER_OVERRIDES)
            .sort(([, x], [, y]) => (x.label || "").localeCompare(y.label || ""))
            .map(([slug, o]) => (
              <li key={slug}><Link href={`/watch-order/${slug}`} className="chip">{o.label || slug.replace(/-/g, " ")}</Link></li>
            ))}
        </ul>
        <p className="mt-4 text-sm text-muted">Any title has a watch order: open it and press “Watch order”. Example: <Link href={animePath({ slug: "naruto" })} className="text-violet">Naruto</Link>.</p>
      </section>
    </div>
  );
}
