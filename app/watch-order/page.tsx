import { fitDescription, fitTitle } from "@/lib/titles";
import type { Metadata } from "next";
import Link from "@/components/Link";
import { listAnime, animePath, getRelations, uniqueById, posterUrl } from "@/lib/kitsu";
import { WATCH_ORDER_OVERRIDES } from "@/data/watch-orders";
import franchiseData from "@/data/franchises.json";
import PageHero from "@/components/PageHero";
import Image from "next/image";
import FranchiseIndex, { type FranchiseRow } from "@/components/FranchiseIndex";
import { watchOrderIndexed } from "@/lib/indexing";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: fitTitle(["Anime Watch Order Guides – Every Franchise in the Right Order", "Anime Watch Order Guides for Every Franchise"]),
  description: fitDescription("Watch orders for the biggest anime franchises, hand-checked for the most popular: seasons, movies, OVAs, which recaps to skip and the total binge time."),
  alternates: { canonical: "/watch-order" },
};

export default async function WatchOrderIndex() {
  const pages = await Promise.all([0, 20].map((offset) => listAnime({ sort: "-userCount", limit: 20, offset, filter: { subtype: "TV" } })));
  const candidates = uniqueById(pages.flatMap((p) => p.items));
  const rels = await Promise.all(candidates.map((a) => getRelations(a.id)));
  // Only franchise starting points: drop entries that have a prequel on record.
  const items = candidates.filter((_, i) => !rels[i].some((r) => r.role === "prequel")).slice(0, 24);
  const edited = new Set(Object.keys(WATCH_ORDER_OVERRIDES));
  const azRows: FranchiseRow[] = (franchiseData as { franchises: { s: string; t: string; n: number }[] }).franchises
    .filter((f) => f.n > 1 && watchOrderIndexed(f.s, f.n)).slice(0, 1000)
    .sort((x, y) => x.t.localeCompare(y.t))
    .map((f) => ({ s: f.s, t: f.t, n: f.n, ed: edited.has(f.s) }));
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
                <span className="relative h-16 w-11 shrink-0 overflow-hidden rounded-md bg-bg-2">{posterUrl(a, "tiny") && <Image src={posterUrl(a, "tiny")!} alt={`${a.title} poster`} fill sizes="44px" className="object-cover" />}</span>
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
              <li key={slug}>
                <Link href={`/watch-order/${slug}`} className="chip gap-1.5 py-1.5 text-sm">
                  <svg aria-hidden viewBox="0 0 24 24" className="h-3.5 w-3.5 text-violet" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
                  {o.label || slug.replace(/-/g, " ")}
                </Link>
              </li>
            ))}
        </ul>
        <p className="mt-4 text-sm text-muted">Any title has a watch order: open it and press “Watch order”. Example: <Link href={animePath({ slug: "naruto" })} className="text-violet">Naruto</Link>.</p>
      </section>

      {/* Every indexed franchise watch order (the sitemap's list, lib/indexing.ts), A to Z, with a filter and a letter bar:
          linking only these keeps the hub's link weight on the pages that can rank. */}
      {azRows.length > 0 && (
        <section className="reveal mt-12" aria-labelledby="az-h">
          <h2 id="az-h" className="h-section mb-1">All franchise watch orders, A–Z</h2>
          <p className="mb-4 text-sm text-muted">{azRows.length} franchises with a full watch order guide. Any other title&rsquo;s order is on its page, under &ldquo;Watch order&rdquo;.</p>
          <FranchiseIndex rows={azRows} />
        </section>
      )}
    </div>
  );
}
