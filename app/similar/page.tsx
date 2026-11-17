import { fitDescription, fitTitle } from "@/lib/titles";
import type { Metadata } from "next";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import { itemList } from "@/lib/ld";
import { indexedSimilar } from "@/lib/similarhub";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: fitTitle(["Anime Like Your Favourite: Every “What to Watch Next” List, A–Z", "Anime Like Your Favourite: All Lists, A–Z"]),
  description: fitDescription("Every “anime like X” list on AniLumi, A to Z: what fans recommend after Naruto, Attack on Titan, Frieren and hundreds more, with the reason each pick fits and where to stream it."),
  alternates: { canonical: "/similar" },
};

const letterOf = (t: string) => (/^[a-z]/i.test(t) ? t[0].toUpperCase() : "#");

/** Hub for the indexed "anime like X" pages (lib/similarhub.ts), grouped by first letter. */
export default async function SimilarHub() {
  const pages = (await indexedSimilar().catch(() => [])).sort((x, y) => x.title.localeCompare(y.title));
  const groups = new Map<string, typeof pages>();
  for (const p of pages) groups.set(letterOf(p.title), [...(groups.get(letterOf(p.title)) ?? []), p]);
  return (
    <div className="container-x pb-8">
      <JsonLd data={itemList("Anime like your favourite", pages.slice(0, 100).map((p) => ({ url: `/similar/${p.slug}`, name: `Anime like ${p.title}` })))} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/similar", label: "Anime like…" }]}
        eyebrow="🧭 What to watch next"
        title={<>Anime like <span className="text-gradient">your favourite</span></>}
        subtitle="Pick the show you just finished. Each list has what its fans recommend most, why every pick fits, and where to stream it."
        facts={[{ value: String(pages.length), label: "lists" }]}
        hue={190}
      >
        <p className="flex flex-wrap gap-2 text-sm"><Link href="/quiz" className="chip">🎯 What should I watch?</Link><Link href="/tonight" className="chip">🌙 Watch tonight</Link><Link href="/lists" className="chip">📋 All lists</Link></p>
      </PageHero>
      <div className="mt-10 space-y-4">
        {[...groups].map(([l, list]) => (
          <section key={l} aria-label={`Anime starting with ${l}`} className="card p-3 sm:p-4">
            <h2 className="mb-2 grid h-9 w-9 place-items-center rounded-xl bg-gradient-to-br from-accent to-violet text-base font-black text-snow">{l}</h2>
            <ul className="grid gap-x-3 sm:grid-cols-2 lg:grid-cols-3">
              {list.map((p) => (
                <li key={p.slug}><Link href={`/similar/${p.slug}`} className="block truncate rounded-lg px-2 py-1.5 text-sm text-ink/90 transition-colors hover:bg-white/[0.05] hover:text-violet-2">Anime like {p.title}</Link></li>
              ))}
            </ul>
          </section>
        ))}
      </div>
    </div>
  );
}
