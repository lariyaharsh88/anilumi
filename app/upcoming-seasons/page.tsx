import type { Metadata } from "next";
import { listAnime, getRelations, uniqueById, animePath, posterUrl, fmtDate, type Anime } from "@/lib/kitsu";
import PageHero from "@/components/PageHero";
import ToolList, { type ToolRow } from "@/components/ToolList";

export const revalidate = 21600;
export const metadata: Metadata = {
  title: `Confirmed Anime Sequels & New Seasons (${new Date().getFullYear()}–${new Date().getFullYear() + 1})`,
  description: "Every announced season 2, season 3 and sequel of popular anime, with release dates where they're set, plus the new seasons airing right now. Updated every few hours.",
  alternates: { canonical: "/upcoming-seasons" },
};

// Kitsu often adds the prequel link late for fresh announcements, so the title is a second signal.
const SEQUEL_TITLE = /(season \d|\d+(st|nd|rd|th) season|part \d|\b(ii|iii|iv)\b|final season|第\d+期)/i;

/** Titles that continue an earlier anime, paired with the entry they follow when Kitsu knows it. */
async function sequelsOf(items: Anime[]): Promise<{ a: Anime; prequel: Anime | null }[]> {
  const rels = await Promise.all(items.map((a) => getRelations(a.id)));
  return items.flatMap((a, i) => {
    const prequel = rels[i].find((r) => r.role === "prequel")?.anime ?? null;
    return prequel || SEQUEL_TITLE.test(a.title) || SEQUEL_TITLE.test(a.slug.replace(/-/g, " ")) ? [{ a, prequel }] : [];
  });
}

export default async function UpcomingSeasons() {
  const [up1, up2, up3, airing] = await Promise.all([
    ...[0, 20, 40].map((offset) => listAnime({ sort: "-userCount", limit: 20, offset, filter: { status: "upcoming,unreleased" }, unrated: true, revalidate: 21600 })),
    listAnime({ sort: "-userCount", limit: 20, filter: { status: "current" }, unrated: true, revalidate: 21600 }),
  ]);
  const [upcoming, now] = await Promise.all([sequelsOf(uniqueById([...up1.items, ...up2.items, ...up3.items])), sequelsOf(airing.items)]);
  const dated = upcoming.filter((x) => x.a.startDate).sort((x, y) => x.a.startDate!.localeCompare(y.a.startDate!));
  const tba = upcoming.filter((x) => !x.a.startDate);
  const row = ({ a, prequel }: { a: Anime; prequel: Anime | null }, value: string): ToolRow => ({ a, href: prequel ? `${animePath(prequel)}/next-season` : animePath(a), value, sub: prequel ? `Sequel to ${prequel.title}` : "New season" });
  return (
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/upcoming-seasons", label: "Confirmed sequels" }]}
        eyebrow="📣 Season 2 tracker"
        title={<>Confirmed anime <span className="text-gradient">sequels</span></>}
        subtitle="Announced new seasons and sequels of popular anime, soonest first, and the follow-ups airing right now. Open any one for its season timeline and the typical wait between seasons."
        facts={[
          { value: String(upcoming.length), label: "sequels announced" },
          { value: String(dated.length), label: "with a release date" },
          { value: String(now.length), label: "new seasons airing now" },
        ]}
        hue={40}
        posters={[...dated, ...tba].slice(0, 3).map((x) => posterUrl(x.a, "medium"))}
      />
      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <ToolList title="Coming with a date" subtitle="Soonest first, Japan release dates." rows={dated.map((x) => row(x, fmtDate(x.a.startDate, { month: "short", day: "numeric", year: "numeric" }) || ""))} />
        <div className="space-y-8">
          <ToolList title="Announced, no date yet" subtitle="Confirmed by the studio; waiting on a date." rows={tba.map((x) => row(x, "TBA"))} />
          <ToolList title="New seasons airing now" subtitle="Already back this season." rows={now.map((x) => row(x, "Airing"))} />
        </div>
      </div>
    </div>
  );
}
