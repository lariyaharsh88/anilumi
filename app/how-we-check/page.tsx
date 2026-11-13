import { fitDescription } from "@/lib/titles";
import type { Metadata } from "next";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import JsonLd from "@/components/JsonLd";
import { site } from "@/lib/site";
import { webPage } from "@/lib/ld";
import { AUTHOR, authorRef } from "@/lib/author";
import { checkedGuides, draftCounts } from "@/lib/checked";
import { notedCharacters } from "@/lib/indexing";
import { characterDeep } from "@/lib/chardeep";
import { hindiArtists } from "@/lib/hindivoices";
import summaries from "@/data/summaries.json";

export const metadata: Metadata = {
  title: "How AniLumi's guides are made and checked",
  description: fitDescription("What refreshes automatically, what is drafted and cross-checked against sources, what a person has checked, and what each label on a guide means."),
  alternates: { canonical: "/how-we-check" },
};

const fmt = (d: string | null) => (d ? new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "");

/** Methodology: the "How" behind every guide (Google's who / how / why), with live counts from the guide data. */
export default function HowWeCheck() {
  const guides = checkedGuides();
  const d = draftCounts();
  const noted = notedCharacters();
  const deep = noted.filter((x) => characterDeep(x)).length;
  const summaryCount = Object.keys((summaries as { anime: Record<string, unknown> }).anime).length;
  const artists = hindiArtists();
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
          <li>Spoiler-free summaries for <strong>{summaryCount.toLocaleString("en-US")}</strong> anime, each fact confirmed in two of MyAnimeList, AniList, Wikipedia and Anime News Network, and checked by script so no run of six words matches those sites&apos; own synopses.</li>
          <li>Character pages for <strong>{noted.length}</strong> characters: who they are, first appearance, arcs, abilities and whether they survive{deep ? <>, plus qualities, relationships, best fights, key episodes, backstory and journey for the <strong>{deep}</strong> most-searched</> : null}. Every fact is confirmed in two sources (Wikipedia, the series wiki, AniList or MyAnimeList), the wording is checked against those sources the same way, and anything past a character&apos;s first season sits behind a spoiler toggle. Each page lists its sources at the end.</li>
          {artists.length > 0 && <li><strong>{artists.length}</strong> <Link href="/hindi-voice-artists">Hindi voice artists</Link>: a role is listed only with an official credit, the studio&apos;s or the artist&apos;s own post, or two independent reports, never from a fan wiki alone.</li>}
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
