import { fitDescription } from "@/lib/titles";
import type { Metadata } from "next";
import Link from "@/components/Link";
import Image from "next/image";
import { listAnime, animePath, posterUrl } from "@/lib/kitsu";
import { getThemes } from "@/lib/themes";
import PageHero from "@/components/PageHero";
import { itemList } from "@/lib/ld";
import JsonLd from "@/components/JsonLd";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Best Anime Openings – Theme Songs of the Most Popular Anime",
  description: fitDescription("The opening songs of the most popular anime, with artists and every later opening, plus ending themes for each series."),
  alternates: { canonical: "/anime-openings" },
};

export default async function OpeningsHub() {
  const top = (await listAnime({ sort: "-userCount", limit: 20, filter: { subtype: "TV" }, revalidate: 86400 })).items;
  // Ten at a time stays inside AnimeThemes' rate limit (90/min). Each show gets 6 s: a slow upstream drops that row
  // instead of stalling the page past the 60 s build limit; the next daily render fills it from the fetch cache.
  const capped = (id: string) => Promise.race([getThemes(id).catch(() => null), new Promise<null>((r) => setTimeout(() => r(null), 6000))]);
  const all: { a: (typeof top)[number]; t: Awaited<ReturnType<typeof getThemes>> }[] = [];
  for (let i = 0; i < top.length; i += 10) all.push(...(await Promise.all(top.slice(i, i + 10).map(async (a) => ({ a, t: await capped(a.id) })))));
  const rows = all.filter((r) => r.t?.themes.some((x) => x.type === "OP"));
  return (
    <div className="container-x pb-8">
      <JsonLd data={itemList("Anime openings & endings", rows.map(({ a }) => ({ url: `${animePath(a)}/openings-endings`, name: `${a.title} openings & endings` })))} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/anime-openings", label: "Anime openings" }]}
        eyebrow="🎵 Theme songs"
        title={<>Anime <span className="text-gradient">openings</span> &amp; endings</>}
        subtitle="The theme songs of the most popular series. Open any show for every opening and ending, who sings them and which episodes they play on."
        facts={[{ value: String(rows.length), label: "series" }, { value: String(rows.reduce((n, r) => n + r.t!.themes.length, 0)), label: "theme songs" }]}
        hue={330}
        posters={rows.slice(0, 3).map((r) => posterUrl(r.a, "medium"))}
      />
      <ul className="mt-10 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {rows.map(({ a, t }) => {
          const ops = t!.themes.filter((x) => x.type === "OP");
          return (
            <li key={a.id} className="reveal">
              <Link href={`${animePath(a)}/openings-endings`} className="card group flex gap-3 p-3 transition duration-300 hover:-translate-y-0.5 hover:border-white/20">
                <span className="relative h-20 w-14 shrink-0 overflow-hidden rounded-md bg-bg-2">{posterUrl(a, "tiny") && <Image src={posterUrl(a, "tiny")!} alt={`${a.title} poster`} fill sizes="56px" className="object-cover" />}</span>
                <span className="min-w-0">
                  <span className="block truncate font-semibold text-ink group-hover:text-violet-2">{a.title}</span>
                  <span className="mt-0.5 block truncate text-sm text-ink/80">OP1 “{ops[0].song}”</span>
                  <span className="block truncate text-xs text-muted">{ops[0].artists.join(", ")} · {ops.length} OP · {t!.themes.length - ops.length} ED</span>
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
