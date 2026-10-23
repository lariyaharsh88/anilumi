import ScoreRing from "./fx/ScoreRing";
import { agreement, type CombinedScore } from "@/lib/scores";

const compact = (n: number) => (n >= 1e6 ? `${(n / 1e6).toFixed(1)}M` : n >= 1e3 ? `${(n / 1e3).toFixed(n >= 1e4 ? 0 : 1)}K` : String(n));
// Fixed categorical hues from the validated viz palette, one per community.
const HUE = { kitsu: "var(--color-viz-1)", anilist: "var(--color-viz-3)", mal: "var(--color-viz-2)" } as const;

/** AniLumi score: the mean of Kitsu, AniList and MyAnimeList, with each source shown so the number is never a black box. */
export default function ScoreCard({ title, c }: { title: string; c: CombinedScore }) {
  return (
    <section className="card grid gap-5 p-5 sm:grid-cols-[auto_1fr] sm:items-center" aria-labelledby="score-h">
      <div className="flex items-center gap-4">
        <ScoreRing score={c.score} size={96} label="AniLumi score" />
        <div className="leading-tight">
          <h3 id="score-h" className="text-lg font-bold text-ink">AniLumi score</h3>
          <p className="mt-0.5 text-xs text-muted">Average of {c.sources.length} {c.sources.length === 1 ? "community" : "communities"}</p>
        </div>
      </div>
      <div>
        <ul className="space-y-2.5">
          {c.sources.map((s) => (
            <li key={s.key} className="grid grid-cols-[96px_1fr_auto] items-center gap-3 text-sm">
              {s.url ? <a href={s.url} rel="noopener" target="_blank" className="truncate text-ink/90 hover:text-ink hover:underline">{s.label}</a> : <span className="truncate text-ink/90">{s.label}</span>}
              <span className="relative h-2 overflow-hidden rounded-full bg-white/8" aria-hidden>
                <span className="grow-x absolute inset-y-0 left-0 rounded-full" style={{ width: `${(s.score / 10) * 100}%`, background: HUE[s.key] }} />
              </span>
              <span className="w-28 text-right tabular-nums">
                <strong className="text-ink">{s.score.toFixed(2)}</strong>
                {s.votes ? <span className="ml-1.5 text-xs text-muted">{compact(s.votes)} votes</span> : null}
              </span>
            </li>
          ))}
        </ul>
        <p className="mt-3 text-xs text-muted">{agreement(c)} Each site&apos;s score for {title}, out of 10, refreshed daily.</p>
      </div>
    </section>
  );
}
