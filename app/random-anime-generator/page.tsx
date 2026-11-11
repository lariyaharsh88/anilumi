import { fitDescription } from "@/lib/titles";
import type { Metadata } from "next";
import MadeBy from "@/components/MadeBy";
import Link from "@/components/Link";
import PageHero from "@/components/PageHero";
import Faq from "@/components/Faq";
import JsonLd from "@/components/JsonLd";
import RandomPicker, { type RandomItem } from "@/components/RandomPicker";
import data from "@/data/anime-al.json";
import { alAnime } from "@/lib/alsnap";
import { kitsuByAniListIds, posterUrl } from "@/lib/kitsu";
import { snapshotOrder } from "@/lib/wosnap";
import { dubFor } from "@/lib/hindidub";
import { themesOf } from "@/lib/picks";
import { editorWatched } from "@/lib/editor";

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Random Anime Generator: Pick by Mood, Genre, Length & Score",
  description: fitDescription("Can't decide what to watch? Pick a random anime by mood (feel-good, sad, hype, mind-bending, romance, scary), genre, length, score or Hindi dub, one or three at a time."),
  alternates: { canonical: "/random-anime-generator" },
};

/** Where you'd start each franchise among the snapshot's most-watched titles, with what the picker filters on. */
async function pool(): Promise<RandomItem[]> {
  const ids = Object.keys((data as unknown as { anime: Record<string, unknown> }).anime).map(Number);
  const kitsu = await kitsuByAniListIds(ids).catch(() => new Map());
  const seen = new Set<string>();
  const out: RandomItem[] = [];
  for (const id of ids) {
    const a = kitsu.get(id), al = alAnime(id);
    if (!a || !al || al.g.includes("Ecchi")) continue;
    const root = snapshotOrder(a.id)?.root.slug ?? a.slug;
    if (root !== a.slug || seen.has(root)) continue;
    seen.add(root);
    out.push({
      slug: a.slug, title: a.titleEn && a.titleEn.length <= 50 ? a.titleEn : a.title, poster: posterUrl(a, "small"), genres: al.g,
      eps: a.episodeCount ?? null, movie: a.subtype === "movie", year: a.startDate ? Number(a.startDate.slice(0, 4)) : null,
      score: al.s, themes: themesOf(al.t), hindi: dubFor(a)?.status === "available", watched: editorWatched(a),
    });
  }
  return out.sort((x, y) => x.title.localeCompare(y.title));
}

export default async function RandomGenerator() {
  const items = await pool();
  const genres = [...new Set(items.flatMap((x) => x.genres))].sort();
  return (
    <div className="container-x pb-8">
      <JsonLd data={{ "@context": "https://schema.org", "@type": "WebApplication", name: "Random anime generator", applicationCategory: "EntertainmentApplication", operatingSystem: "Any", offers: { "@type": "Offer", price: "0", priceCurrency: "USD" } }} />
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/random-anime-generator", label: "Random anime generator" }]}
        eyebrow="🎲 Random pick"
        title={<>Random <span className="text-gradient">anime generator</span></>}
        subtitle={`Pick a mood, or set a genre, a length or a minimum score, then let it pick one or three from ${items.length} well-loved anime. Only first seasons and standalone films, so every pick is somewhere you can start.`}
        facts={[{ value: String(items.length), label: "anime to pick from" }, { value: String(items.filter((x) => x.hindi).length), label: "with a Hindi dub" }]}
        hue={300}
      />
      <MadeBy className="mt-4" method="The pool is the most-watched anime on AniList, trimmed to first seasons and standalone films; a tick marks the ones I have watched myself." />
      <section className="mt-8" aria-label="Random anime picker">
        <RandomPicker items={items} genres={genres} />
      </section>
      <p className="mt-6 text-sm text-muted">Want a guided pick instead? Try the <Link href="/quiz" className="text-violet hover:underline">30-second quiz</Link>, or browse the <Link href="/genre" className="text-violet hover:underline">best anime by genre</Link>.</p>
      <Faq title="Random anime generator FAQ" items={[
        { q: "Which anime can it pick?", a: `The ${items.length} most-watched anime on AniList that you can start from: first seasons and standalone films, never a sequel. Adult and ecchi titles are left out.` },
        { q: "How do the filters work?", a: "Genre uses AniList's genres; length counts TV episodes (movies separately); score is AniList's average; the Hindi option keeps only anime with an official Hindi dub on our checked list." },
        { q: "Can it pick anime for my mood?", a: "Yes. Feel-good picks comedy and slice of life, Something sad picks drama, Hype action picks action, Mind-bending picks psychological, mystery and thriller, Romance and Scary do what they say, and Cozy & short keeps to slice of life of 13 episodes or fewer." },
        { q: "Can I share what it picked?", a: "Yes: press Share after a pick to send a link that opens on the same anime." },
        { q: "Is it really random?", a: "Yes: every anime that matches your filters has the same chance, and it won't pick the same one twice in a row." },
      ]} />
    </div>
  );
}
