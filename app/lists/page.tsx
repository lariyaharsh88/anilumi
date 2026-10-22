import type { Metadata } from "next";
import Link from "next/link";
import { getTrending, getCategories } from "@/lib/kitsu";
import Breadcrumbs from "@/components/Breadcrumbs";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Anime Lists – Best of Each Year, Short Binges, Similar Shows",
  description: "Curated-by-data anime lists: the best anime of every year, series you can finish in a weekend, and what to watch after your favourite show.",
  alternates: { canonical: "/lists" },
};

export default async function Lists() {
  const y = new Date().getFullYear();
  const [trending, genres] = await Promise.all([getTrending(12), getCategories(10)]);
  const years = Array.from({ length: y - 1999 }, (_, i) => y - i);
  return (
    <div className="container-x py-8">
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { href: "/lists", label: "Lists" }]} />
      <h1 className="text-3xl font-extrabold tracking-tight">Anime lists</h1>
      <p className="mt-2 max-w-2xl text-muted">Generated from live data, refreshed daily. No one&apos;s opinion, just what fans actually rate and watch.</p>
      <section className="mt-8">
        <h2 className="h-section mb-3">Genre trends</h2>
        <p className="text-sm text-muted"><Link href="/trends" className="text-violet hover:underline">Which genres are growing and shrinking →</Link> year-by-year shares since 2000, e.g. <Link href="/trends/isekai" className="text-violet hover:underline">the rise of isekai</Link>.</p>
      </section>
      <section className="mt-8">
        <h2 className="h-section mb-3">Compare two anime</h2>
        <p className="text-sm text-muted"><Link href="/compare" className="text-violet hover:underline">Put any two anime side by side →</Link> scores, rating breakdowns, runtime and shared genres.</p>
      </section>
      <section className="mt-8">
        <h2 className="h-section mb-3">Finish it tonight</h2>
        <div className="flex flex-wrap gap-2">
          {[[30, "in 30 minutes"], [60, "in an hour"], [120, "in 2 hours"], [180, "in 3 hours"], [300, "in 5 hours"], [600, "in a day"]].map(([m, t]) => (
            <Link key={m} href={`/tonight${m !== 120 ? `?minutes=${m}` : ""}`} className="chip">Anime you can finish {t}</Link>
          ))}
        </div>
      </section>
      <section className="mt-8">
        <h2 className="h-section mb-3">Best anime by year</h2>
        <div className="flex flex-wrap gap-2">{years.map((yy) => <Link key={yy} href={`/best/${yy}`} className="chip">{yy}</Link>)}</div>
      </section>
      <section className="mt-8">
        <h2 className="h-section mb-3">Short anime you can finish in a weekend</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/short-anime" className="chip chip-active">All genres · ≤ 13 ep</Link>
          {genres.map((g) => <Link key={g.id} href={`/short-anime?genre=${g.slug}`} className="chip">Short {g.title.toLowerCase()}</Link>)}
          <Link href="/short-anime?max=26" className="chip">≤ 26 episodes</Link>
        </div>
      </section>
      <section className="mt-8">
        <h2 className="h-section mb-3">What to watch next</h2>
        <div className="flex flex-wrap gap-2">{trending.map((a) => <Link key={a.id} href={`/similar/${a.slug}`} className="chip">Anime like {a.title}</Link>)}</div>
        <p className="mt-2 text-sm text-muted">Every anime page links to its own “more like this” list.</p>
      </section>
    </div>
  );
}
