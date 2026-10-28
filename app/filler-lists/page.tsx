import type { Metadata } from "next";
import { getAnimeBySlug, animePath, posterUrl, type Anime } from "@/lib/kitsu";
import { fillerFor, fillerSlugs } from "@/lib/filler";
import PageHero from "@/components/PageHero";
import ToolList from "@/components/ToolList";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Anime Filler Lists: Which Episodes to Skip",
  description: "Filler lists for Naruto, One Piece, Bleach, Fairy Tail, Black Clover and more long-running anime: every filler, recap and mixed episode, and how much time skipping saves.",
  alternates: { canonical: "/filler-lists" },
};

export default async function FillerLists() {
  const found = await Promise.all(fillerSlugs().map((s) => getAnimeBySlug(s).catch(() => null)));
  const rows = found
    .filter((a): a is Anime => a !== null)
    .flatMap((a) => {
      const f = fillerFor(a.slug, a.episodeCount);
      return f && f.count + f.recap.size > 0 ? [{ a, f }] : [];
    })
    .sort((x, y) => y.a.userCount - x.a.userCount);
  const skip = rows.reduce((n, r) => n + r.f.count + r.f.recap.size, 0);
  return (
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/filler-lists", label: "Filler lists" }]}
        eyebrow="⏭ Skip guide"
        title={<>Anime <span className="text-gradient">filler lists</span></>}
        subtitle="Long-running shows pad the story with episodes the manga never had. Open a series for its full episode map, the longest filler runs and a filler-free watch order."
        facts={[
          { value: String(rows.length), label: "series covered" },
          { value: skip.toLocaleString("en-US"), label: "skippable episodes listed" },
        ]}
        hue={350}
        posters={rows.slice(0, 3).map((r) => posterUrl(r.a, "medium"))}
      />
      <div className="mt-10 max-w-3xl">
        <ToolList
          title="Series with filler"
          subtitle="Most-watched first. The figure is the share of episodes that are filler."
          rows={rows.map(({ a, f }) => ({ a, href: `${animePath(a)}/filler-list`, value: `${f.share.toFixed(0)}%`, sub: `${f.count} filler${f.recap.size ? ` + ${f.recap.size} recap` : ""} of ${f.total} episodes` }))}
        />
      </div>
    </div>
  );
}
