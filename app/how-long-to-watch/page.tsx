import type { Metadata } from "next";
import { listAnime, uniqueById, animePath, posterUrl, runtimeMinutes, getLastAiredBest, primeAniList } from "@/lib/kitsu";
import { humanDays, fmtRun } from "@/lib/binge";
import PageHero from "@/components/PageHero";
import ToolList from "@/components/ToolList";
import BarChart from "@/components/viz/BarChart";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "How Long to Watch Anime – Longest & Shortest Popular Series by Runtime",
  description: "Total runtime and binge time for the 100 most popular anime series: the longest commitments, the quickest binges, and a calculator for every title.",
  alternates: { canonical: "/how-long-to-watch" },
};

export default async function HowLongHub() {
  const pages = await Promise.all([0, 20, 40, 60, 80].map((offset) => listAnime({ sort: "-userCount", limit: 20, offset, filter: { subtype: "TV" }, revalidate: 86400 })));
  const all = uniqueById(pages.flatMap((p) => p.items));
  // Airing shows: Kitsu's stored total can run ahead of reality, so count aired episodes (one batched AniList call).
  const live = all.filter((a) => a.status === "current" && a.episodeLength);
  await primeAniList(live.map((a) => a.id));
  const aired = new Map(await Promise.all(live.map(async (a) => [a.id, (await getLastAiredBest(a.id)).lastAired * a.episodeLength!] as const)));
  const timed = all.map((a) => ({ a, m: aired.get(a.id) ?? runtimeMinutes(a) })).filter((x) => x.m > 0);
  const longest = [...timed].sort((x, y) => y.m - x.m);
  const shortest = [...timed].sort((x, y) => x.m - y.m);
  const median = longest[Math.floor(longest.length / 2)]?.m || 0;
  const row = (x: { a: (typeof timed)[number]["a"]; m: number }) => ({
    a: x.a,
    href: `${animePath(x.a)}/how-long-to-watch`,
    value: fmtRun(x.m),
    sub: `${aired.has(x.a.id) ? "Still airing · " : x.a.episodeCount ? `${x.a.episodeCount} ep · ` : ""}${humanDays(Math.ceil(x.m / 120))} at 2 h a day`,
  });
  return (
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/how-long-to-watch", label: "How long to watch" }]}
        eyebrow="⏳ Binge-time calculator"
        title={<>How long to watch <span className="text-gradient">anime</span></>}
        subtitle="Total runtime for the most popular series, with how many days each takes at your pace. Every anime page has its own calculator with filler skips and the whole franchise."
        facts={[
          { value: String(timed.length), label: "popular series timed" },
          { value: fmtRun(median), label: "typical runtime" },
          ...(longest[0] ? [{ value: fmtRun(longest[0].m), label: `longest: ${longest[0].a.title}` }] : []),
        ]}
        hue={190}
        posters={longest.slice(0, 3).map((x) => posterUrl(x.a, "medium"))}
      />
      {longest.length > 2 && (
        <section className="reveal mt-10">
          <BarChart
            orientation="bar"
            title="The biggest commitments"
            subtitle="Hours to watch, among the 100 most popular series"
            valueHeading="Hours"
            data={longest.slice(0, 10).map((x) => ({ key: x.a.id, label: x.a.title, value: Math.round(x.m / 60), display: fmtRun(x.m), mark: `${Math.round(x.m / 60)} h`, href: `${animePath(x.a)}/how-long-to-watch` }))}
          />
        </section>
      )}
      <div className="mt-10 grid gap-8 lg:grid-cols-2">
        <ToolList title="Longest popular anime" subtitle="Clear your calendar." rows={longest.slice(0, 15).map(row)} />
        <ToolList title="Quickest popular binges" subtitle="Done in a weekend or two." rows={shortest.slice(0, 15).map(row)} />
      </div>
    </div>
  );
}
