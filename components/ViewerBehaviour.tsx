import StatTiles from "./viz/StatTiles";
import StackedBar from "./viz/StackedBar";
import type { DropStats } from "@/lib/insights";

const k = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}K` : String(n));

/** "Do people finish it?" from AniList list statuses, benchmarked against the genre median. */
export default function ViewerBehaviour({ title, s, airing, genre, bench }: { title: string; s: DropStats; airing: boolean; genre: string | null; bench: number | null }) {
  const oneIn = s.dropped ? Math.round(s.started / s.dropped) : null;
  const ratio = bench ? s.dropRate / bench : null;
  const vs = ratio === null ? "" : ratio < 0.8 ? `, ${ratio < 0.5 ? "well " : ""}below the ${genre?.toLowerCase()} median of ${bench!.toFixed(1)}%` : ratio > 1.25 ? `, above the ${genre?.toLowerCase()} median of ${bench!.toFixed(1)}%` : `, about the ${genre?.toLowerCase()} median of ${bench!.toFixed(1)}%`;
  return (
    <section className="mt-8" aria-labelledby="finish-h">
      <h2 id="finish-h" className="h-section mb-1">Do people finish it?</h2>
      <p className="mb-3 text-sm text-muted">
        {oneIn ? `About 1 in ${oneIn} people who start ${title} drop it${airing ? " so far" : ""}${vs}.` : `Almost nobody who starts ${title} drops it.`} Based on {k(s.started)} AniList members who started it.
      </p>
      <StatTiles
        stats={[
          { label: airing ? "Dropped so far" : "Drop rate", value: `${s.dropRate.toFixed(1)}%`, sub: bench ? `${genre} median ${bench.toFixed(1)}%` : `${k(s.dropped)} people` },
          airing ? { label: "Watching now", value: k(s.watching), sub: "keeping up as it airs" } : { label: "Finished it", value: `${s.completionRate.toFixed(0)}%`, sub: `${k(s.completed)} people` },
          { label: "On hold", value: `${((s.paused / s.started) * 100).toFixed(1)}%`, sub: `${k(s.paused)} paused` },
          { label: "Plan to watch", value: k(s.planning), sub: "not started yet" },
        ]}
      />
      <div className="mt-3">
        <StackedBar
          title="What people who started it did"
          subtitle={`${k(s.started)} AniList members · plan-to-watch excluded`}
          unit="people"
          segments={[
            { key: "completed", label: "Finished", value: s.completed },
            { key: "watching", label: "Watching", value: s.watching },
            { key: "paused", label: "Paused", value: s.paused },
            { key: "dropped", label: "Dropped", value: s.dropped },
          ]}
        />
      </div>
    </section>
  );
}
