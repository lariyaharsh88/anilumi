"use client";
import Link from "@/components/Link";
import { useHype } from "./HypeButton";

/** "Fans are hyped for" leaderboard from the counts a surrounding HypeProvider loaded. Hidden until someone votes. */
export default function HypeBoard({ items, title = "Most hyped by fans" }: { items: { id: string; title: string; href: string }[]; title?: string }) {
  const ctx = useHype();
  const top = ctx?.hype ? items.map((i) => ({ ...i, n: ctx.hype!.counts[i.id] || 0 })).filter((i) => i.n > 0).sort((a, b) => b.n - a.n).slice(0, 5) : [];
  if (!top.length) return null;
  const max = top[0].n;
  return (
    <section className="card reveal mt-10 p-4 sm:p-5" aria-labelledby="hypeboard-h">
      <div className="flex items-baseline justify-between gap-3">
        <h2 id="hypeboard-h" className="font-semibold text-ink">🔥 {title}</h2>
        <Link href="/hype" className="text-sm text-violet hover:text-violet-2">All-time ranking →</Link>
      </div>
      <ol className="mt-3 space-y-2">
        {top.map((i, k) => (
          <li key={i.id} className="flex items-center gap-3 text-sm">
            <span className="w-4 text-right font-bold text-muted tabular-nums">{k + 1}</span>
            <span className="relative flex-1 overflow-hidden rounded-md bg-bg-2 px-2 py-1.5">
              <span aria-hidden className="absolute inset-y-0 left-0 bg-accent/20" style={{ width: `${(i.n / max) * 100}%` }} />
              <Link href={i.href} className="relative font-medium text-ink hover:text-violet-2">{i.title}</Link>
            </span>
            <span className="w-12 text-right tabular-nums text-muted">{i.n.toLocaleString()}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
