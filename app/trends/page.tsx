import type { Metadata } from "next";
import Link from "next/link";
import { countAnime, TREND_GENRES } from "@/lib/kitsu";
import Breadcrumbs from "@/components/Breadcrumbs";

export const revalidate = 86400;
export const metadata: Metadata = {
  title: "Anime Genre Trends – Which Genres Are Growing and Shrinking",
  description: "Every major anime genre ranked by how its share of new TV anime has changed over the past decade, with year-by-year charts for each.",
  alternates: { canonical: "/trends" },
};

export default async function TrendsIndex() {
  const lastFull = new Date().getUTCFullYear() - 1;
  const then = lastFull - 10;
  const [tThen, tNow, ...counts] = await Promise.all([
    countAnime({ seasonYear: String(then), subtype: "TV" }, 86400),
    countAnime({ seasonYear: String(lastFull), subtype: "TV" }, 86400),
    ...TREND_GENRES.flatMap(([g]) => [countAnime({ seasonYear: String(then), subtype: "TV", categories: g }, 86400), countAnime({ seasonYear: String(lastFull), subtype: "TV", categories: g }, 86400)]),
  ]);
  const rows = TREND_GENRES.map(([slug, name], i) => {
    const a = tThen ? (counts[i * 2] / tThen) * 100 : 0, b = tNow ? (counts[i * 2 + 1] / tNow) * 100 : 0;
    return { slug, name, then: a, now: b, delta: b - a };
  }).sort((x, y) => y.delta - x.delta);
  const maxAbs = Math.max(...rows.map((r) => Math.abs(r.delta)), 1);
  return (
    <div className="container-x py-8">
      <Breadcrumbs items={[{ href: "/", label: "Home" }, { href: "/trends", label: "Genre trends" }]} />
      <h1 className="text-3xl font-extrabold tracking-tight">Anime genre trends</h1>
      <p className="mt-2 max-w-2xl text-muted">How each genre&apos;s share of new TV anime changed from {then} to {lastFull}. Genres above the line grew, those below shrank. Open any genre for the full year-by-year chart.</p>

      <figure className="card mt-6 p-4">
        <figcaption>
          <h2 className="font-semibold text-ink">Change in share of new TV anime, {then} → {lastFull}</h2>
          <p className="mt-0.5 text-xs text-muted">Percentage points · blue = grew, red = shrank, gray center line = no change</p>
        </figcaption>
        <ul className="mt-4 space-y-1.5">
          {rows.map((r) => {
            const w = (Math.abs(r.delta) / maxAbs) * 50;
            return (
              <li key={r.slug}>
                <Link href={`/trends/${r.slug}`} className="group grid grid-cols-[7rem_1fr] items-center gap-2 rounded hover:bg-white/[0.03] sm:grid-cols-[9rem_1fr]" aria-label={`${r.name}: ${r.delta >= 0 ? "up" : "down"} ${Math.abs(r.delta).toFixed(1)} percentage points, from ${r.then.toFixed(1)}% to ${r.now.toFixed(1)}%`}>
                  <span className="truncate text-xs text-ink/90 group-hover:text-violet">{r.name}</span>
                  <span className="relative flex h-6 items-center">
                    <span className="absolute inset-y-0 left-1/2 w-px bg-[#383835]" aria-hidden />
                    {r.delta >= 0 ? (
                      <>
                        <span className="absolute left-1/2 h-3.5 rounded-r-[4px] bg-viz-1" style={{ width: `${w}%` }} />
                        <span className="absolute text-[11px] tabular-nums text-muted" style={{ left: `calc(50% + ${w}% + 6px)` }}>{Math.abs(r.delta) < 0.05 ? "0.0" : `+${r.delta.toFixed(1)}`}</span>
                      </>
                    ) : (
                      <>
                        <span className="absolute right-1/2 h-3.5 rounded-l-[4px] bg-[#e66767]" style={{ width: `${w}%` }} />
                        <span className="absolute text-[11px] tabular-nums text-muted" style={{ right: `calc(50% + ${w}% + 6px)` }}>−{Math.abs(r.delta).toFixed(1)}</span>
                      </>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
        <details className="mt-3 text-xs text-muted">
          <summary className="cursor-pointer select-none hover:text-ink">Show as table</summary>
          <table className="mt-2 w-full border-collapse">
            <thead><tr><th className="border-b border-line py-1 text-left font-medium">Genre</th><th className="border-b border-line py-1 text-right font-medium">{then}</th><th className="border-b border-line py-1 text-right font-medium">{lastFull}</th><th className="border-b border-line py-1 text-right font-medium">Change</th></tr></thead>
            <tbody>{rows.map((r) => <tr key={r.slug}><td className="border-b border-line/50 py-1 text-ink/90">{r.name}</td><td className="border-b border-line/50 py-1 text-right tabular-nums">{r.then.toFixed(1)}%</td><td className="border-b border-line/50 py-1 text-right tabular-nums">{r.now.toFixed(1)}%</td><td className="border-b border-line/50 py-1 text-right tabular-nums text-ink/90">{Math.abs(r.delta) < 0.05 ? "" : r.delta > 0 ? "+" : "−"}{Math.abs(r.delta).toFixed(1)} pts</td></tr>)}</tbody>
          </table>
        </details>
      </figure>
      <p className="mt-4 text-xs text-muted">Based on TV series listed on Kitsu by premiere year. Tags overlap, and Kitsu&apos;s tagging has grown more thorough over time, so some of the change reflects better tagging rather than more shows. Each genre page explains the method.</p>
    </div>
  );
}
