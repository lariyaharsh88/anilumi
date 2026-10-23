import type { Metadata } from "next";
import { listAnime, animePath, posterUrl, franchiseRoot, type Anime } from "@/lib/kitsu";
import PageHero from "@/components/PageHero";
import ToolList from "@/components/ToolList";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Best Anime for Kids & Families – Parents' Guides and Age Ratings",
  description: "Popular anime rated G and PG for kids and families, plus the popular shows that are best kept for older teens, each with a viewer-rated parents' guide.",
  alternates: { canonical: "/parents-guide" },
};

/** Keep the most popular entry of each franchise, so one series doesn't fill a list with its sequels. */
function oneFranchiseEach(items: Anime[]): Anime[] {
  const seen = new Set<string>();
  return items.filter((a) => { const k = franchiseRoot(a.title); if (seen.has(k)) return false; seen.add(k); return true; });
}

export default async function ParentsGuideHub() {
  const [kids, family, older] = await Promise.all(
    ["G", "PG", "R"].map((r) =>
      Promise.all([0, 20].map((offset) => listAnime({ sort: "-userCount", limit: 20, offset, filter: { ageRating: r }, revalidate: 86400 })))
        .then((ps) => oneFranchiseEach(ps.flatMap((p) => p.items)).slice(0, 15)),
    ),
  );
  const row = (a: (typeof kids)[number]) => ({
    a,
    href: `${animePath(a)}/parents-guide`,
    value: a.ageRating || "",
    sub: [a.ageRatingGuide, a.startDate?.slice(0, 4), a.rating ? `★ ${(a.rating / 10).toFixed(1)}` : null].filter(Boolean).join(" · "),
  });
  return (
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/parents-guide", label: "Parents' guides" }]}
        eyebrow="👪 Parents' guides"
        title={<>Best anime for <span className="text-gradient">kids &amp; families</span></>}
        subtitle="Popular anime by official age rating. Open any title for a viewer-rated guide to violence, language, sexual content and frightening themes, with spoilers hidden."
        hue={140}
        posters={kids.slice(0, 3).map((a) => posterUrl(a, "medium"))}
      />
      <div className="mt-10 grid gap-8 lg:grid-cols-3">
        <ToolList title="For all ages (G)" subtitle="Safe for young children." rows={kids.map(row)} />
        <ToolList title="Family-friendly (PG)" subtitle="Fine for most kids; some action or peril." rows={family.map(row)} />
        <ToolList title="Older teens and up (R)" subtitle="Popular, but not for younger kids." rows={older.map(row)} />
      </div>
    </div>
  );
}
