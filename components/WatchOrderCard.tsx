import Link from "@/components/Link";
import { animePath, orderWindow, subtypeLabel, fmtMinutes, type Anime, type Relation, type WatchOrder } from "@/lib/kitsu";

const year = (x: Anime) => x.startDate?.slice(0, 4) ?? null;
const meta = (x: Anime) => [subtypeLabel(x.subtype), year(x), x.subtype !== "movie" && x.episodeCount ? `${x.episodeCount} ep${x.episodeCount === 1 ? "" : "s"}` : null].filter(Boolean).join(" · ");

/**
 * "Where am I in the story?" at a glance, next to Where to watch: the main story in order with this entry
 * marked. Falls back to the direct prequel/sequel when the full order didn't load in time, and says so plainly
 * for standalone titles.
 */
export default function WatchOrderCard({ anime, order, relations, className = "" }: { anime: Anime; order: WatchOrder | null; relations: Relation[]; className?: string }) {
  const full = `/watch-order/${anime.slug}`;
  const prequel = relations.find((r) => r.role === "prequel")?.anime ?? null;
  const sequel = relations.find((r) => r.role === "sequel")?.anime ?? null;
  const mains = order?.entries.filter((e) => e.kind === "main").map((e) => e.anime) ?? [];
  const extras = order ? order.entries.length - mains.length : 0;
  const cur = mains.findIndex((m) => m.id === anime.id);
  // No prequel or sequel: one story, however many specials hang off it.
  const standalone = !prequel && !sequel;
  const optional = relations.length;
  // A movie or OVA in the franchise: say which part of the main story it belongs after.
  const self = order?.entries.find((e) => e.anime.id === anime.id);
  const after = self && self.kind !== "main" ? mains.find((m) => m.id === self.attachedTo) ?? null : null;

  let subtitle: string;
  if (standalone) subtitle = `Standalone: no prequels or sequels${optional ? ` · ${optional} optional extra${optional === 1 ? "" : "s"}` : ""}.`;
  else if (order) subtitle = `${mains.length} part${mains.length === 1 ? "" : "s"} in the main story${extras ? ` + ${extras} optional` : ""}${order.totalMinutes ? ` · ${fmtMinutes(order.totalMinutes)}` : ""}`;
  else subtitle = "Where this fits in the story.";

  const Row = ({ x, n }: { x: Anime; n: number }) => {
    const here = x.id === anime.id;
    return (
      <li>
        <Link href={animePath(x)} aria-current={here ? "page" : undefined} className={`group flex items-center gap-3 rounded-xl px-2 py-1.5 transition ${here ? "bg-violet/15 ring-1 ring-violet/50" : "hover:bg-white/5"}`}>
          <span className={`grid h-7 w-7 shrink-0 place-items-center rounded-full text-xs font-bold tabular-nums ${here ? "bg-violet text-snow" : "bg-white/10 text-ink"}`}>{n}</span>
          <span className="min-w-0 flex-1">
            <span className={`block truncate text-sm font-semibold ${here ? "text-ink" : "text-ink/85 group-hover:text-violet-2"}`}>{x.title}</span>
            <span className="block truncate text-[11px] text-muted">{meta(x)}</span>
          </span>
          {here ? <span className="shrink-0 rounded-full bg-violet px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-snow">You&apos;re here</span>
            : cur >= 0 && n === cur + 2 ? <span className="shrink-0 text-[11px] font-semibold text-violet-2">Watch next →</span> : null}
        </Link>
      </li>
    );
  };

  return (
    <section aria-labelledby="h-order-card" className={`rounded-2xl border-2 border-violet/40 bg-violet/[.06] p-4 backdrop-blur sm:p-5 ${className}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 id="h-order-card" className="flex items-center gap-2 text-lg font-bold text-ink"><span aria-hidden>📺</span> Watch order</h2>
          <p className="mt-0.5 text-xs text-muted">{subtitle}</p>
        </div>
        {(!standalone || optional > 0) && <Link href={full} className="btn-outline shrink-0 px-3 py-1.5 text-xs">Full order →</Link>}
      </div>

      {standalone ? (
        <p className="mt-3 text-sm text-ink/85">Just watch <strong>{anime.title}</strong> on its own; you don&apos;t need anything else first.{optional > 0 && " The extras (specials, movies, spin-offs) are optional."}</p>
      ) : mains.length > 1 || (mains.length === 1 && after) ? (
        <>
          {after && <p className="mt-3 text-sm text-ink/85">This {subtypeLabel(anime.subtype).toLowerCase()} is optional; watch it after <Link href={animePath(after)} className="font-semibold text-violet-2 hover:underline">{after.title}</Link>.</p>}
          <ol className="mt-3 space-y-1">
            {orderWindow(mains.length, cur).map((i, k) => (i === null ? <li key={`gap${k}`} className="pl-4 text-xs text-muted" aria-hidden>⋮</li> : <Row key={mains[i].id} x={mains[i]} n={i + 1} />))}
          </ol>
          {cur === 0 && <p className="mt-3 text-xs text-muted">✓ This is where the story starts.</p>}
        </>
      ) : (
        <ul className="mt-3 space-y-2 text-sm">
          {prequel && <li><span className="text-muted">Watch first:</span> <Link href={animePath(prequel)} className="font-semibold text-violet-2 hover:underline">{prequel.title}</Link></li>}
          {!prequel && <li className="text-ink/85">✓ No prequel: you can start here.</li>}
          {sequel && <li><span className="text-muted">Watch next:</span> <Link href={animePath(sequel)} className="font-semibold text-violet-2 hover:underline">{sequel.title}</Link></li>}
        </ul>
      )}
    </section>
  );
}
