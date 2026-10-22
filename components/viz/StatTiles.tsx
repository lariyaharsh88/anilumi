import CountUp from "../fx/CountUp";

export type Stat = { label: string; value: string; sub?: string };

/** KPI row. Values use proportional figures; labels are sentence case. */
const COLS: Record<number, string> = { 1: "sm:grid-cols-1", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4", 5: "sm:grid-cols-5" };

export default function StatTiles({ stats, className = "" }: { stats: Stat[]; className?: string }) {
  return (
    <dl className={`grid grid-cols-2 gap-3 ${COLS[Math.min(stats.length, 5)]} ${className}`}>
      {stats.map((s) => (
        <div key={s.label} className="card p-3 transition duration-300 hover:-translate-y-0.5 hover:border-white/15">
          <dt className="text-xs text-muted">{s.label}</dt>
          <dd className="mt-1 text-xl font-semibold text-ink"><CountUp text={s.value} /></dd>
          {s.sub && <dd className="mt-0.5 text-xs text-muted">{s.sub}</dd>}
        </div>
      ))}
    </dl>
  );
}
