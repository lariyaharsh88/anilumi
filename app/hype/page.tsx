import type { Metadata } from "next";
import Link from "@/components/Link";
import { db } from "@/lib/db";
import { listAnime, animePath, posterUrl, fmtDate, type Anime } from "@/lib/kitsu";
import PageHero from "@/components/PageHero";
import ToolList from "@/components/ToolList";
import HypeButton, { HypeProvider } from "@/components/HypeButton";

export const revalidate = 600;
export const metadata: Metadata = {
  title: "Most Hyped Upcoming Anime, Voted by Fans",
  description: "The upcoming anime AniLumi fans are most excited for, ranked by hype votes. Add your vote on any upcoming show.",
  alternates: { canonical: "/hype" },
};

/** Top hype counts, with titles and posters from Kitsu (never from user input). */
async function mostHyped(limit = 40): Promise<{ a: Anime; count: number }[]> {
  try {
    const d = await db();
    if (!d) return [];
    const rows = await d.collection<{ _id: string; count: number }>("hype_stats").find({ count: { $gt: 0 } }).sort({ count: -1 }).limit(limit).toArray();
    if (!rows.length) return [];
    const ids = rows.map((r) => r._id);
    const pages = await Promise.all([0, 20].filter((o) => o < ids.length).map((o) => listAnime({ filter: { id: ids.slice(o, o + 20).join(",") }, limit: 20, unrated: true, revalidate: 86400 })));
    const byId = new Map(pages.flatMap((p) => p.items).map((a) => [a.id, a]));
    return rows.flatMap((r) => { const a = byId.get(r._id); return a && a.status !== "finished" ? [{ a, count: r.count }] : []; });
  } catch {
    return [];
  }
}

export default async function Hype() {
  const rows = await mostHyped();
  const upcoming = (await listAnime({ filter: { status: "upcoming,unreleased" }, sort: "-userCount", limit: 20, unrated: true, revalidate: 21600 })).items;
  return (
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/hype", label: "Most hyped" }]}
        eyebrow="🔥 Hype meter"
        title={<>Most hyped <span className="text-gradient">upcoming anime</span></>}
        subtitle="Ranked by AniLumi fans' hype votes. Tap 🔥 on any upcoming show to add yours; the ranking refreshes every few minutes."
        facts={[{ value: rows.reduce((n, r) => n + r.count, 0).toLocaleString(), label: "hype votes" }]}
        hue={20}
        posters={rows.slice(0, 3).map((r) => posterUrl(r.a, "medium"))}
      />
      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        {rows.length > 0 ? (
          <ToolList title="Fan ranking" subtitle="By hype votes." rows={rows.map(({ a, count }) => ({ a, href: animePath(a), value: `🔥 ${count.toLocaleString()}`, sub: a.startDate ? fmtDate(a.startDate, { month: "short", day: "numeric", year: "numeric" }) || undefined : "Date TBA" }))} />
        ) : (
          <p className="card p-4 text-sm text-muted">No votes yet. Be the first: pick a show on the right.</p>
        )}
        <section>
          <h2 className="h-section">Vote on upcoming shows</h2>
          <p className="mt-1 text-sm text-muted">Most-followed upcoming titles on Kitsu.</p>
          <HypeProvider ids={upcoming.map((a) => a.id)}>
            <ul className="card mt-3 divide-y divide-line">
              {upcoming.map((a) => (
                <li key={a.id} className="flex items-center justify-between gap-3 p-3">
                  <Link href={animePath(a)} className="min-w-0 truncate font-semibold text-ink hover:text-violet-2">{a.title}</Link>
                  <HypeButton animeId={a.id} compact />
                </li>
              ))}
            </ul>
          </HypeProvider>
        </section>
      </div>
    </div>
  );
}
