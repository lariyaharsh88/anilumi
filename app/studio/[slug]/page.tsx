import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProducerBySlug, getStudioAnime, posterUrl } from "@/lib/kitsu";
import { abs } from "@/lib/site";
import { studioFacts } from "@/lib/wikidata";
import AnimeGrid from "@/components/AnimeGrid";
import AnimeRail from "@/components/AnimeRail";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import Faq from "@/components/Faq";
import AdSlot from "@/components/AdSlot";
import StatTiles from "@/components/viz/StatTiles";
import BarChart from "@/components/viz/BarChart";

export const revalidate = 604800;
// Render on first request, then serve from the ISR cache until revalidated.
export async function generateStaticParams() { return []; }
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const p = await getProducerBySlug(decodeURIComponent(slug));
  if (!p) notFound();
  return {
    title: `${p.name} Anime List – Every Series, Upcoming & Best Rated`,
    description: `All anime animated by ${p.name}: currently airing and upcoming projects, plus the studio's most popular and best-rated series with where to watch.`,
    alternates: { canonical: `/studio/${p.slug}` },
  };
}

export default async function StudioPage({ params }: Props) {
  const { slug } = await params;
  const p = await getProducerBySlug(decodeURIComponent(slug));
  if (!p) notFound();
  const { items, total } = await getStudioAnime(p.id);
  const airing = items.filter((a) => a.status === "current");
  const upcoming = items.filter((a) => a.status === "upcoming");
  const rated = [...items].filter((a) => a.rating).sort((x, y) => (y.rating || 0) - (x.rating || 0)).slice(0, 10);
  const allRated = items.filter((a) => a.rating);
  const avg = allRated.length ? allRated.reduce((n, a) => n + (a.rating || 0), 0) / allRated.length / 10 : null;
  const byYear = new Map<number, number>();
  for (const a of items) { const yr = Number(a.startDate?.slice(0, 4)); if (yr) byYear.set(yr, (byYear.get(yr) || 0) + 1); }
  const years = [...byYear.keys()].sort((x, y) => x - y);
  const span = years.length ? Array.from({ length: Math.min(years[years.length - 1] - years[0] + 1, 30) }, (_, i) => years[years.length - 1] - Math.min(years[years.length - 1] - years[0], 29) + i) : [];
  const busiest = [...byYear.entries()].sort((x, y) => y[1] - x[1])[0];
  const wd = await studioFacts(p.name);
  const ld = { "@context": "https://schema.org", "@type": "Organization", name: p.name, url: abs(`/studio/${p.slug}`), foundingDate: wd?.founded ? String(wd.founded) : undefined, founder: wd?.founders.length ? wd.founders.map((name) => ({ "@type": "Person", name })) : undefined, parentOrganization: wd?.parent ? { "@type": "Organization", name: wd.parent } : undefined, sameAs: [wd?.website, wd ? `https://www.wikidata.org/wiki/${wd.qid}` : undefined].filter(Boolean) };
  const about = wd ? [wd.founded && ["Founded", String(wd.founded)], wd.headquarters && ["Headquarters", wd.headquarters], wd.founders.length && ["Founded by", wd.founders.join(", ")], wd.parent && ["Parent company", wd.parent]].filter(Boolean) as [string, string][] : [];
  return (
    <div className="container-x pb-8">
      <JsonLd data={ld} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: `/studio/${p.slug}`, label: p.name }]}
        eyebrow="Animation studio"
        title={<><span className="text-gradient">{p.name}</span> anime</>}
        subtitle={`${wd?.founded ? `Founded in ${wd.founded}${wd.headquarters ? ` in ${wd.headquarters}` : ""}. ` : ""}${total} titles credited to ${p.name} as animation studio on Kitsu. Showing the ${items.length} most followed.`}
        hue={220}
        backdrop={items[0]?.cover?.large || null}
        posters={(rated.length >= 3 ? rated : items).slice(0, 3).map((x) => posterUrl(x, "medium"))}
      />
      <section className="reveal mt-8 space-y-3" aria-label="Studio at a glance">
        <StatTiles
          stats={[
            { label: "Titles credited", value: total.toLocaleString(), sub: "as animation studio" },
            { label: "Average score", value: avg ? avg.toFixed(1) : "–", sub: avg ? `across ${allRated.length} rated titles` : "No ratings yet" },
            { label: "Highest rated", value: rated[0]?.rating ? (rated[0].rating / 10).toFixed(1) : "–", sub: rated[0]?.title },
            { label: "Busiest year", value: busiest ? String(busiest[0]) : "–", sub: busiest ? `${busiest[1]} titles premiered` : undefined },
          ]}
        />
        {span.length >= 3 && (
          <BarChart
            title="Titles per year"
            subtitle={`Premiere year of the ${items.length} most-followed ${p.name} titles`}
            valueHeading="Titles"
            integer
            data={span.map((yr) => ({ key: String(yr), label: span.length > 16 ? `’${String(yr).slice(2)}` : String(yr), value: byYear.get(yr) || 0, display: `${byYear.get(yr) || 0} in ${yr}`, mark: String(byYear.get(yr) || 0) }))}
            labelKeys={busiest ? [String(busiest[0])] : []}
          />
        )}
      </section>

      {about.length > 0 && (
        <section className="card reveal mt-6 p-4" aria-labelledby="studio-about-h">
          <h2 id="studio-about-h" className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">About {p.name}</h2>
          <dl className="grid gap-x-8 gap-y-2 text-sm sm:grid-cols-2 lg:grid-cols-4">
            {about.map(([k, v]) => <div key={k}><dt className="text-xs text-muted">{k}</dt><dd className="font-medium text-ink">{v}</dd></div>)}
          </dl>
          <p className="mt-3 text-xs text-muted">{wd?.website && <><a href={wd.website} target="_blank" rel="noopener nofollow" className="text-violet hover:text-violet-2">Official website</a> · </>}Facts from <a href={`https://www.wikidata.org/wiki/${wd!.qid}`} target="_blank" rel="noopener" className="underline">Wikidata</a>.</p>
        </section>
      )}
      <AdSlot slot="studio-top" />
      <AnimeRail title="Airing now" items={airing} />
      <AnimeRail title="Upcoming" items={upcoming} />
      <AnimeRail title={`Best rated by ${p.name}`} items={rated} rank />
      <section className="mt-10">
        <h2 className="h-section mb-3">Most popular</h2>
        <AnimeGrid items={items.slice(0, 40)} startRank={1} />
      </section>
      <Faq
        items={[
          { q: `What is ${p.name} working on now?`, a: airing.length || upcoming.length ? `${[...airing, ...upcoming].slice(0, 4).map((a) => a.title).join(", ")}${airing.length + upcoming.length > 4 ? " and more" : ""}.` : `${p.name} has no currently airing or announced titles on record.` },
          { q: `What is ${p.name}'s best anime?`, a: rated[0] ? `${rated[0].title} is the studio's highest-rated work${rated[0].rating ? ` at ${(rated[0].rating / 10).toFixed(1)}/10` : ""}, while ${items[0]?.title} is its most watched.` : "Ratings will appear once titles are scored." },
          ...(wd?.founded ? [{ q: `When was ${p.name} founded?`, a: `${p.name} was founded in ${wd.founded}${wd.founders.length ? ` by ${wd.founders.join(" and ")}` : ""}${wd.headquarters ? ` and is based in ${wd.headquarters}` : ""}${wd.parent ? `. It is part of ${wd.parent}` : ""}.` }] : []),
        ]}
      />
    </div>
  );
}
