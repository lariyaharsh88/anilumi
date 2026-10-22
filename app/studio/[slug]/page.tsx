import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getProducerBySlug, getStudioAnime } from "@/lib/kitsu";
import { abs } from "@/lib/site";
import AnimeGrid from "@/components/AnimeGrid";
import AnimeRail from "@/components/AnimeRail";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import Faq from "@/components/Faq";
import AdSlot from "@/components/AdSlot";

export const revalidate = 86400;
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
  const ld = { "@context": "https://schema.org", "@type": "Organization", name: p.name, url: abs(`/studio/${p.slug}`) };
  return (
    <div className="container-x py-8">
      <JsonLd data={ld} />
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { href: `/studio/${p.slug}`, label: p.name }]} />
      <h1 className="text-3xl font-extrabold tracking-tight">{p.name} anime</h1>
      <p className="mt-2 max-w-2xl text-muted">{total} titles credited to {p.name} as animation studio on Kitsu. Showing the {items.length} most followed.</p>
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
        ]}
      />
    </div>
  );
}
