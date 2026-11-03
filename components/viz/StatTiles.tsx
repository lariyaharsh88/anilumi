import Link from "@/components/Link";
import CountUp from "../fx/CountUp";
import NavIcon, { type IconName } from "../NavIcon";

/**
 * `still`: show the value as-is (years and ranges shouldn't count up from zero).
 * Optional extras (used on the home page): `href` makes the whole tile a link, `icon` + `hue` add a tinted icon chip
 * and glow, `live` adds a pulsing dot for things happening right now.
 */
export type Stat = { label: string; value: string; sub?: string; still?: boolean; href?: string; icon?: IconName; hue?: number; live?: boolean };

/** KPI row. Values use proportional figures; labels are sentence case. */
const COLS: Record<number, string> = { 1: "sm:grid-cols-1", 2: "sm:grid-cols-2", 3: "sm:grid-cols-3", 4: "sm:grid-cols-4", 5: "sm:grid-cols-5" };

export default function StatTiles({ stats, className = "" }: { stats: Stat[]; className?: string }) {
  return (
    <dl className={`grid grid-cols-2 gap-3 ${COLS[Math.min(stats.length, 5)]} ${className}`}>
      {stats.map((s) => {
        const rich = Boolean(s.icon || s.href);
        return (
          <div
            key={s.label}
            className={`card relative transition duration-300 hover:-translate-y-0.5 hover:border-white/15 ${rich ? "genre-tile group p-4" : "p-3"}`}
            style={s.hue != null ? { ["--h" as string]: String(s.hue) } : undefined}
          >
            {rich ? (
              <>
                <div className="flex items-center justify-between gap-2">
                  {s.icon && <span className="genre-ico grid h-9 w-9 place-items-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6"><NavIcon name={s.icon} className="h-[18px] w-[18px]" /></span>}
                  {s.live && <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent-2"><span className="live-dot !bg-accent-2" aria-hidden />Live</span>}
                </div>
                <dt className="mt-3 text-xs font-medium text-muted">
                  {s.href ? (
                    // Stretched link: the whole tile is clickable, the markup stays a valid <dl>.
                    <Link href={s.href} className="after:absolute after:inset-0 after:rounded-[inherit] after:content-[''] focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-violet">{s.label}</Link>
                  ) : s.label}
                </dt>
                <dd className="mt-1 text-2xl font-bold tabular-nums tracking-tight text-ink sm:text-3xl">{s.still ? s.value : <CountUp text={s.value} />}</dd>
                {s.sub && (
                  <dd className="mt-0.5 flex items-center justify-between gap-2 text-xs text-muted">
                    <span>{s.sub}</span>
                    {s.href && <span aria-hidden className="text-violet opacity-0 transition duration-300 group-hover:translate-x-0.5 group-hover:opacity-100">→</span>}
                  </dd>
                )}
              </>
            ) : (
              <>
                <dt className="text-xs text-muted">{s.label}</dt>
                <dd className="mt-1 text-xl font-semibold text-ink">{s.still ? s.value : <CountUp text={s.value} />}</dd>
                {s.sub && <dd className="mt-0.5 text-xs text-muted">{s.sub}</dd>}
              </>
            )}
          </div>
        );
      })}
    </dl>
  );
}
