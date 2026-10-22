"use client";
import StatTiles from "./viz/StatTiles";
import BarChart from "./viz/BarChart";
import type { WatchItem } from "@/lib/watchlist";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
const fmt = (min: number) => {
  const h = Math.floor(min / 60), m = Math.round(min % 60);
  return h >= 48 ? `${Math.floor(h / 24)}d ${h % 24}h` : h ? `${h}h${m ? ` ${m}m` : ""}` : `${m}m`;
};

/** Everything here is computed in the browser from the saved list; nothing is sent anywhere. */
export default function MyListStats({ items }: { items: WatchItem[] }) {
  const enriched = items.filter((i) => i.runtime !== undefined);
  if (items.length < 2 || !enriched.length) return null;

  const airing = items.filter((i) => i.status === "current");
  const known = enriched.filter((i) => (i.runtime || 0) > 0);
  const ongoing = enriched.filter((i) => !i.runtime && i.status === "current").length;
  // Time left: subtract episodes already watched when progress is known.
  const left = (i: WatchItem) => Math.max(0, (i.runtime || 0) - (i.progress || 0) * (i.episodeLength || (i.episodeCount ? (i.runtime || 0) / i.episodeCount : 0)));
  const total = known.reduce((n, i) => n + left(i), 0);
  const watchedAny = known.some((i) => (i.progress || 0) > 0);
  const days = Math.ceil(total / 120);
  const now = Date.now();
  const weekly = airing.filter((i) => i.nextRelease && new Date(i.nextRelease).getTime() - now < 7 * 86400000 && new Date(i.nextRelease).getTime() > now - 86400000);
  const onBreak = airing.filter((i) => i.nextRelease && new Date(i.nextRelease).getTime() - now >= 7 * 86400000).length;
  const today = new Date().toLocaleDateString("en-US", { weekday: "long" });
  const perDay = DAYS.map((d) => ({ d, n: weekly.filter((i) => new Date(i.nextRelease!).toLocaleDateString("en-US", { weekday: "long" }) === d).length }));
  const genreCount = new Map<string, number>();
  for (const i of enriched) for (const g of i.genres || []) genreCount.set(g, (genreCount.get(g) || 0) + 1);
  const genres = [...genreCount.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, 6);
  const topGenre = genres[0];

  return (
    <section className="mb-8 space-y-3" aria-label="Your list in numbers">
      <h2 className="h-section">Your list in numbers</h2>
      <StatTiles
        stats={[
          { label: "Saved shows", value: String(items.length), sub: `${airing.length} airing · ${items.length - airing.length} other` },
          { label: watchedAny ? "Time left to watch" : "Time to watch it all", value: total ? fmt(total) : "–", sub: ongoing ? `plus ${ongoing} ongoing series` : watchedAny ? "after the episodes you've watched" : `${known.length} shows with runtimes` },
          { label: "At 2 hours a day", value: total ? `${days} day${days === 1 ? "" : "s"}` : "–", sub: total ? `≈ ${Math.ceil(days / 7)} week${Math.ceil(days / 7) === 1 ? "" : "s"}` : undefined },
          { label: "Episodes in the next 7 days", value: String(weekly.length), sub: onBreak ? `${onBreak} airing show${onBreak === 1 ? " is" : "s are"} on a break` : weekly.length ? "from your airing shows" : "none airing right now" },
        ]}
      />
      <div className="grid gap-3 lg:grid-cols-2">
        {weekly.length > 0 && (
          <BarChart
            title="When your episodes land"
            subtitle={`Episodes airing in the next 7 days, by weekday in your time zone · today is ${today}`}
            valueHeading="Episodes"
            integer
            height={120}
            highlightKey={today}
            labelKeys={perDay.filter((p) => p.n > 0).map((p) => p.d)}
            data={perDay.map((p) => ({ key: p.d, label: p.d === today ? "Today" : p.d.slice(0, 3), value: p.n, display: `${p.n} episode${p.n === 1 ? "" : "s"}` }))}
          />
        )}
        {genres.length >= 2 && (
          <BarChart
            orientation="bar"
            title="Your genres"
            subtitle={topGenre ? `${topGenre[0]} shows up in ${topGenre[1]} of your ${enriched.length} shows` : undefined}
            valueHeading="Shows"
            data={genres.map(([g, n]) => ({ key: g, label: g, value: n, display: `${n} show${n === 1 ? "" : "s"}` }))}
          />
        )}
      </div>
    </section>
  );
}
