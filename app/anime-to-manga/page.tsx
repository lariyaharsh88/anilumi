import type { Metadata } from "next";
import { getAnimeBySlug, animePath, posterUrl, type Anime } from "@/lib/kitsu";
import { continuationFor, continuationSlugs } from "@/lib/filler";
import PageHero from "@/components/PageHero";
import ToolList from "@/components/ToolList";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Where Does the Anime End in the Manga? Chapter to Start Reading",
  description: "Finished the anime and can't wait for the next season? The manga chapter or light-novel volume to start from for Chainsaw Man, Frieren, Jujutsu Kaisen, Demon Slayer and more.",
  alternates: { canonical: "/anime-to-manga" },
};

export default async function AnimeToManga() {
  const found = await Promise.all(continuationSlugs().map((s) => getAnimeBySlug(s).catch(() => null)));
  const rows = found.filter((a): a is Anime => a !== null).sort((x, y) => y.userCount - x.userCount);
  return (
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/anime-to-manga", label: "Anime to manga" }]}
        eyebrow="📚 Keep reading"
        title={<>Where does the anime <span className="text-gradient">end in the manga?</span></>}
        subtitle="The chapter or volume to pick up after the latest season, so you can keep going without rereading what you've watched. These are drafts while we check each one against the books."
        facts={[{ value: String(rows.length), label: "anime covered" }]}
        hue={262}
        posters={rows.slice(0, 3).map((a) => posterUrl(a, "medium"))}
      />
      <div className="mt-10 max-w-3xl">
        <ToolList
          title="Continue the story"
          subtitle="Most-watched first."
          rows={rows.map((a) => {
            const c = continuationFor(a.slug)!;
            return { a, href: `${animePath(a)}/manga`, value: c.chapter ? `Ch. ${c.chapter}` : `Vol. ${c.volume}`, sub: c.medium === "manga" ? "Manga" : "Light novel" };
          })}
        />
      </div>
    </div>
  );
}
