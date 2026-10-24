import type { Metadata } from "next";
import Link from "next/link";
import { listAnime, getSeason, seasonOf, uniqueById, posterUrl, cap, type Anime } from "@/lib/kitsu";
import { decodeTiers } from "@/lib/tierlist";
import PageHero from "@/components/PageHero";
import TierMaker, { type TierItem } from "@/components/TierMaker";

export const metadata: Metadata = {
  title: "Anime Tier List Maker – Rank Anime and Share the Image",
  description: "Make an anime tier list in seconds: start from the most popular, this season or the top rated, add any title, then download a shareable image or link.",
  alternates: { canonical: "/tier-list" },
};

type Props = { searchParams: Promise<{ preset?: string; s?: string; title?: string }> };
const toItem = (a: Anime): TierItem => ({ id: a.id, slug: a.slug, title: a.title, poster: posterUrl(a, "small") });

export default async function TierListPage({ searchParams }: Props) {
  const { preset = "popular", s, title } = await searchParams;
  const now = seasonOf();
  const tiers = decodeTiers(s);
  const placed = Object.values(tiers).flat();
  const [base, placedItems] = await Promise.all([
    preset === "season" ? getSeason(now.year, now.season, 1, 20).then(async (p1) => [...p1.items, ...(await getSeason(now.year, now.season, 2, 20)).items])
    : preset === "rated" ? Promise.all([0, 20].map((offset) => listAnime({ sort: "-averageRating", limit: 20, offset, filter: { subtype: "TV" }, revalidate: 86400 }))).then((ps) => ps.flatMap((p) => p.items))
    : Promise.all([0, 20].map((offset) => listAnime({ sort: "-userCount", limit: 20, offset, filter: { subtype: "TV" }, revalidate: 86400 }))).then((ps) => ps.flatMap((p) => p.items)),
    placed.length ? Promise.all([0, 20, 40].map((i) => placed.slice(i, i + 20)).filter((c) => c.length).map((c) => listAnime({ filter: { id: c.join(",") }, limit: 20, revalidate: 86400 }))).then((ps) => ps.flatMap((p) => p.items)) : Promise.resolve([] as Anime[]),
  ]);
  const items = uniqueById([...placedItems, ...(s ? [] : base)]).map(toItem);
  const presets: [string, string][] = [["popular", "Most popular"], ["season", `${cap(now.season)} ${now.year}`], ["rated", "Top rated"]];
  return (
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/tier-list", label: "Tier list maker" }]}
        eyebrow="🏆 Tier list maker"
        title={s ? <span className="text-gradient">{(title || "Anime tier list").slice(0, 60)}</span> : <>Make an anime <span className="text-gradient">tier list</span></>}
        subtitle={s ? "Someone shared their ranking. Change anything you disagree with and share your own." : "Pick a starting set, rank by tapping or dragging, add any title, then download the image or share the link."}
        hue={40}
        posters={items.slice(0, 3).map((i) => i.poster)}
      >
        <div className="flex flex-wrap gap-2">{presets.map(([k, l]) => <Link key={k} href={`/tier-list?preset=${k}`} className={`chip ${!s && preset === k ? "chip-active" : ""}`}>{l}</Link>)}</div>
      </PageHero>
      <TierMaker key={`${preset}|${s || ""}`} items={items} initialTiers={tiers} initialTitle={title?.slice(0, 60) || ""} />
    </div>
  );
}
