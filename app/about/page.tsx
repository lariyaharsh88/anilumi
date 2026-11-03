import type { Metadata } from "next";
import Link from "@/components/Link";
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
      <p>Other open sources: <a href="https://anilist.co" rel="noopener">AniList</a> (next-episode times, cast, fan recommendations, tags), <a href="https://animethemes.moe" rel="noopener">AnimeThemes</a> (openings and endings), <a href="https://trace.moe" rel="noopener">trace.moe</a> (screenshot search) and <a href="https://www.animenewsnetwork.com" rel="noopener">Anime News Network</a> (news headlines, linked to the original articles). Search aliases use the <a href="https://github.com/manami-project/anime-offline-database" rel="noopener">anime-offline-database</a> by manami-project, made available under the <a href="https://opendatacommons.org/licenses/odbl/1-0/" rel="noopener">Open Database License</a>; our derived alias file is published in this site&apos;s public repository under the same licence.</p>
      <p>We only link to official, licensed services such as Crunchyroll, Netflix, Hulu and Amazon Prime Video. Availability differs by country.</p>
      <h2>How guides are checked</h2>
      <p>Facts like episode lists, air dates and casts come from the sources above and refresh automatically. Watch orders, filler lists and manga continuations are checked by hand against the official releases; checked guides show the date they were last verified and the sources used. Pages quote only short excerpts of third-party synopses and biographies, with a link to the source.</p>
      <h2>Contact and corrections</h2>
      <p>Spotted a mistake? Use the <em>Spotted a mistake?</em> link at the bottom of any page, or the <Link href="/contact">contact form</Link>. Every report is read, and confirmed fixes usually go live within a few days.</p>
      </div>
    </div>
  );
}
