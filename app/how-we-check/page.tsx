import type { Metadata } from "next";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import { site } from "@/lib/site";
import { webPage } from "@/lib/ld";
import { AUTHOR, authorRef } from "@/lib/author";
import { checkedGuides, draftCounts } from "@/lib/checked";

export const metadata: Metadata = {
  title: "How AniLumi's guides are made and checked",
  description: "What refreshes automatically, what is drafted and cross-checked against sources, what a person has checked, and what each label on a guide means.",
  alternates: { canonical: "/how-we-check" },
};

const fmt = (d: string | null) => (d ? new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "");

/** Methodology: the "How" behind every guide (Google's who / how / why), with live counts from the guide data. */
export default function HowWeCheck() {
  const guides = checkedGuides();
  const d = draftCounts();
  return (
    <div className="container-x pb-8">
      <JsonLd data={{ ...webPage("AboutPage", "/how-we-check", "How AniLumi's guides are made and checked"), author: authorRef() }} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/about", label: "About" }, { href: "/how-we-check", label: "How we check" }]}
        eyebrow="About the guides"
        title={<>How guides are <span className="text-gradient">made and checked</span></>}
        subtitle="Three kinds of information, each labelled so you know how much to trust it."
        hue={262}
      />
      <div className="prose-anime mt-8 max-w-3xl">
        <h2>1. Refreshed automatically</h2>
        <p>Titles, scores, episode lists, air times, casts and streaming links come from open databases and refresh on their own: <a href="https://kitsu.io" rel="noopener nofollow">Kitsu</a> (titles, ratings, episodes, streaming links), <a href="https://anilist.co" rel="noopener nofollow">AniList</a> (exact air times, refreshed every 3 hours; tags and fan recommendations), <a href="https://animethemes.moe" rel="noopener nofollow">AnimeThemes</a> (openings and endings, monthly) and <a href="https://www.animenewsnetwork.com" rel="noopener nofollow">Anime News Network</a> (headlines, linked to the original). Pages re-read their sources at least daily; anime pages show the date as &ldquo;Data refreshed&rdquo;. If a source is wrong, the page can be too, so please <Link href="/contact">tell us</Link>.</p>

        <h2>2. Drafted, and labelled as drafts</h2>
        <p>Guides that need judgement, like watch-order notes, the &ldquo;In short&rdquo; notes, story arcs, manga chapters per season and the Hindi dub list, are first drafted with the help of an AI assistant, using the sources above. Until a person has signed one off, it is labelled as a draft. Right now that covers:</p>
        <ul>
          <li><strong>{d.watchOrders}</strong> watch-order notes and <strong>{d.takes}</strong> editor&apos;s takes, built on Kitsu&apos;s sequel and prequel links, with every linked title checked against Kitsu.</li>
          {d.arcShows > 0 && <li>Story arcs for <strong>{d.arcShows}</strong> long-running shows, cross-checked against Wikipedia&apos;s episode lists, the series wikis and AnimeFillerList{d.arcsChecked ? ` on ${fmt(d.arcsChecked)}` : ""}.</li>}
          {d.mangaSeasons > 0 && <li>Which manga chapters or light-novel volumes <strong>{d.mangaSeasons}</strong> TV seasons adapt, cross-checked against the series wikis, MangaUpdates and per-episode chapter guides{d.mangaChecked ? ` on ${fmt(d.mangaChecked)}` : ""}.</li>}
          {d.volumes > 0 && <li>Which printed volume to buy to read on after <strong>{d.volumes}</strong> of those seasons, from Wikipedia&apos;s chapter-by-volume lists cross-checked against the series wikis{d.volumesChecked ? ` on ${fmt(d.volumesChecked)}` : ""}.</li>}
          {d.dubs > 0 && <li><strong>{d.dubs}</strong> entries in the <Link href="/hindi-dub">Hindi dub list</Link>, from Crunchyroll&apos;s audio listings, Netflix India and Indian news reports, each with a confidence level{d.dubsChecked ? ` (checked ${fmt(d.dubsChecked)})` : ""}.</li>}
          <li>Filler lists for most shows come from the filler flags on MyAnimeList&apos;s episode lists; hand-made lists are cross-checked against AnimeFillerList.</li>
        </ul>

        <h2>3. Checked by a person</h2>
        <p><Link href={AUTHOR.path}>{AUTHOR.name}</Link>, who runs {site.name}, reads a guide end to end, checks it against the official releases and the sources, and signs it off. {guides.length} guide{guides.length === 1 ? " has" : "s have"} been checked so far; the list, with dates, is on the <Link href={AUTHOR.path}>author page</Link>.</p>

        <h2>What the labels mean</h2>
        <ul>
          <li><strong>&ldquo;✓ Checked by {AUTHOR.name} on [date]&rdquo;</strong>: a person checked this guide on that date.</li>
          <li><strong>&ldquo;Draft&rdquo;</strong> (with the sources, where it was cross-checked): not yet signed off by a person.</li>
          <li><strong>&ldquo;Data refreshed [date]&rdquo; / &ldquo;Updated [date]&rdquo;</strong>: when the page last re-read its sources.</li>
        </ul>

        <h2>Rankings and links</h2>
        <p>Rankings and scores come from the sources&apos; own community data, not from us, and nobody can pay to change them or a guide. We link only to official, licensed streaming services. Some links, like manga on Amazon, are affiliate links and are marked as sponsored; they never decide what a guide says.</p>

        <h2>Corrections</h2>
        <p>Every page has a &ldquo;Spotted a mistake?&rdquo; link, and there is a <Link href="/contact">contact form</Link>. Every report is read, and confirmed fixes usually go live within a few days.</p>
      </div>
    </div>
  );
}
