import type { Metadata } from "next";
import Link from "@/components/Link";
import { getTrending, getCategories, posterUrl } from "@/lib/kitsu";
import PageHero from "@/components/PageHero";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Anime Lists – Best of Each Year, Short Binges, Similar Shows",
  description: "Curated-by-data anime lists: the best anime of every year, series you can finish in a weekend, and what to watch after your favourite show.",
  alternates: { canonical: "/lists" },
};

export default async function Lists() {
  const y = new Date().getFullYear();
  const [trending, genres] = await Promise.all([getTrending(12), getCategories(10)]);
  const years = Array.from({ length: y - 1999 }, (_, i) => y - i);
  return (
    <div className="container-x pb-8">
      <PageHero
        crumbs={[{ href: "/", label: "Home" }, { href: "/lists", label: "Lists" }]}
        eyebrow="Curated by data"
        title={<>Anime <span className="text-gradient">lists</span></>}
        subtitle="Generated from live data and refreshed daily. No one's opinion, just what fans actually rate and watch."
        hue={190}
        posters={trending.slice(0, 3).map((a) => posterUrl(a, "medium"))}
      />

      <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { href: "/tonight", icon: "🌙", t: "What to watch tonight", d: "Pick your free time; get complete shows that fit." },
          { href: "/compare", icon: "⚔️", t: "Compare two anime", d: "Scores, rating breakdowns, runtime and genres side by side." },
          { href: "/trends", icon: "📈", t: "Genre trends", d: "Which genres are growing and shrinking since 2000." },
          { href: "/short-anime", icon: "⏱️", t: "Short anime", d: "Complete series you can finish in a weekend." },
          { href: `/best/${y}`, icon: "🏆", t: `Best of ${y}`, d: "This year's top rated and most popular." },
          { href: "/watch-order", icon: "🧭", t: "Watch orders", d: "Every franchise in the right order, recaps flagged." },
          { href: "/how-long-to-watch", icon: "⏳", t: "How long to watch", d: "Runtime and binge time for every series." },
          { href: "/parents-guide", icon: "👪", t: "Best anime for kids", d: "Age ratings and viewer-rated parents' guides." },
          { href: "/upcoming-seasons", icon: "📣", t: "Confirmed sequels", d: "Every announced season 2, 3 and beyond." },
          { href: "/voice-actors", icon: "🎙️", t: "Voice actors", d: "Every role of the voices fans follow most." },
          { href: "/news", icon: "📰", t: "Anime news", d: "Announcements, trailers and casting, updated hourly." },
          { href: "/what-anime-is-this", icon: "🔍", t: "What anime is this?", d: "Find any anime, episode and moment from a screenshot." },
          { href: "/quiz", icon: "🎯", t: "What should I watch?", d: "Four questions, picks ranked by fans." },
          { href: "/tier-list", icon: "🏆", t: "Tier list maker", d: "Rank anime S to F and share the image." },
          { href: "/anime-openings", icon: "🎵", t: "Openings & endings", d: "Every theme song, artist and episode range." },
          { href: "/birthdays", icon: "🎂", t: "Character birthdays", d: "Who's celebrating today, and every date." },
          { href: "/my/wrapped", icon: "✨", t: "My anime Wrapped", d: "Your year in anime as a shareable card." },
          { href: "/random", icon: "🎲", t: "Random anime", d: "Can't decide? Let the dice pick." },
        ].map((c, i) => (
          <li key={c.href} className="reveal">
            <Link href={c.href} className="genre-tile card group flex h-full gap-3 p-4 transition duration-300 hover:-translate-y-0.5 hover:border-white/20" style={{ ["--h" as string]: String([262, 350, 190, 140, 40, 300, 220, 20, 40, 300, 20, 190, 262, 40, 330, 330, 300, 190][i]) }}>
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-white/5 text-xl" aria-hidden>{c.icon}</span>
              <span className="min-w-0">
                <span className="block font-semibold text-ink group-hover:text-violet-2">{c.t}</span>
                <span className="mt-0.5 block text-sm text-muted">{c.d}</span>
              </span>
            </Link>
          </li>
        ))}
      </ul>

      <section className="reveal mt-12">
        <h2 className="h-section mb-3">Finish it tonight</h2>
        <div className="flex flex-wrap gap-2">
          {[[30, "in 30 minutes"], [60, "in an hour"], [120, "in 2 hours"], [180, "in 3 hours"], [300, "in 5 hours"], [600, "in a day"]].map(([m, t]) => (
            <Link key={m} href={`/tonight${m !== 120 ? `?minutes=${m}` : ""}`} className="chip">Finish {t}</Link>
          ))}
        </div>
      </section>
      <section className="reveal mt-10">
        <h2 className="h-section mb-3">Best anime by year</h2>
        <div className="flex flex-wrap gap-2">{years.map((yy) => <Link key={yy} href={`/best/${yy}`} className="chip tabular-nums">{yy}</Link>)}</div>
      </section>
      <section className="reveal mt-10">
        <h2 className="h-section mb-3">Short anime by genre</h2>
        <div className="flex flex-wrap gap-2">
          <Link href="/short-anime" className="chip chip-active">All genres · ≤ 13 ep</Link>
          {genres.map((g) => <Link key={g.id} href={`/short-anime?genre=${g.slug}`} className="chip">Short {g.title.toLowerCase()}</Link>)}
          <Link href="/short-anime?max=26" className="chip">≤ 26 episodes</Link>
        </div>
      </section>
      <section className="reveal mt-10">
        <h2 className="h-section mb-3">What to watch next</h2>
        <div className="flex flex-wrap gap-2">{trending.map((a) => <Link key={a.id} href={`/similar/${a.slug}`} className="chip">Anime like {a.title}</Link>)}</div>
      </section>
    </div>
  );
}
