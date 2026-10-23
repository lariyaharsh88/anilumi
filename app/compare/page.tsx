import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { listAnime, searchAnime, comparePath, suggestComparePairs } from "@/lib/kitsu";
import PageHero from "@/components/PageHero";

export const revalidate = 86400;
type Props = { searchParams: Promise<{ a?: string; b?: string }> };

export const metadata: Metadata = {
  title: "Compare Anime – Side-by-Side Scores, Length and Popularity",
  description: "Put any two anime side by side: community score, how each is rated, members, favourites, runtime and shared genres.",
  alternates: { canonical: "/compare" },
};

export default async function CompareIndex({ searchParams }: Props) {
  const { a = "", b = "" } = await searchParams;
  let error: string | null = null;
  if (a.trim() && b.trim()) {
    const [ra, rb] = await Promise.all([searchAnime(a, 1), searchAnime(b, 1)]);
    if (ra[0] && rb[0] && ra[0].id !== rb[0].id) redirect(comparePath(ra[0], rb[0]));
    error = !ra[0] ? `No anime matched “${a}”.` : !rb[0] ? `No anime matched “${b}”.` : "Pick two different titles.";
  }
  const pages = await Promise.all([0, 20].map((offset) => listAnime({ sort: "-userCount", limit: 20, offset, withCategories: true })));
  const pairs = suggestComparePairs(pages.flatMap((p) => p.items), 1).slice(0, 30);
  return (
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/compare", label: "Compare" }]}
        eyebrow="Head to head"
        title={<>Compare <span className="text-gradient">two anime</span></>}
        subtitle="Type two titles in English or Japanese. You'll get scores, rating breakdowns, audience size, runtime and shared genres side by side."
        hue={350}
      >
      <form method="get" action="/compare" className="grid gap-3 rounded-2xl border border-white/10 bg-bg/60 p-4 backdrop-blur sm:grid-cols-[1fr_auto_1fr_auto] sm:items-end">
        <label className="text-sm"><span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">First anime</span><input name="a" defaultValue={a} required placeholder="e.g. Frieren" className="input" /></label>
        <span className="hidden pb-2 text-center font-black text-muted sm:block">vs</span>
        <label className="text-sm"><span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Second anime</span><input name="b" defaultValue={b} required placeholder="e.g. Mushoku Tensei" className="input" /></label>
        <button type="submit" className="btn-primary">Compare</button>
      </form>
      </PageHero>
      {error && <p className="mt-3 text-sm text-accent-2" role="alert">{error}</p>}
      <section className="mt-10">
        <h2 className="h-section mb-3">Popular matchups</h2>
        <p className="mb-3 text-sm text-muted">Each popular title paired with the one that shares the most genres with it.</p>
        <ul className="flex flex-wrap gap-2">
          {pairs.map(([x, y]) => <li key={`${x.id}-${y.id}`}><Link href={comparePath(x, y)} className="chip">{x.title} vs {y.title}</Link></li>)}
        </ul>
      </section>
    </div>
  );
}
