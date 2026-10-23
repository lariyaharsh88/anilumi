import type { Metadata } from "next";
import { site } from "@/lib/site";
import PageHero from "@/components/PageHero";

export const metadata: Metadata = { title: "About", description: `How ${site.name} works and where the data comes from.`, alternates: { canonical: "/about" } };

export default function About() {
  return (
    <div className="container-x pb-8">
      <PageHero eyebrow="About" title={<>About <span className="text-gradient">{site.name}</span></>} subtitle="A fast anime guide for the three questions fans ask most: what's airing, when's the next episode, and where can I legally watch it." hue={262} />
      <div className="prose-anime mt-8 max-w-3xl">
      <p>{site.name} is a fast, ad-light anime guide focused on the three questions fans ask most: what is airing now, when is the next episode, and where can I legally watch it.</p>
      <h2>Data sources</h2>
      <p>All titles, ratings, episode lists, artwork and streaming links come from the open <a href="https://kitsu.io" rel="noopener">Kitsu</a> community database via its public API. Rankings refresh hourly; episode schedules refresh every 30 minutes. Artwork and trademarks belong to their respective studios and licensors.</p>
      <h2>Streaming links</h2>
      <p>We only link to official, licensed services such as Crunchyroll, Netflix, Hulu and Amazon Prime Video. Availability differs by country.</p>
      <h2>Contact</h2>
      <p>Spotted an error or missing title? Fix it upstream on Kitsu and it will flow here automatically on the next refresh.</p>
      </div>
    </div>
  );
}
