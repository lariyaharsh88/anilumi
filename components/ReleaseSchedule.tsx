import Link from "@/components/Link";
import SpoilerGate from "@/components/SpoilerGate";
import { getEpisodesAt, episodePath, fmtDate, type Anime } from "@/lib/kitsu";
import { airing } from "@/lib/airing";

const MAX = 40;
const at = (iso: string, timeZone: string, withDay = true) =>
  new Date(iso).toLocaleString("en-US", { ...(withDay ? { weekday: "short", month: "short", day: "numeric" } : {}), hour: "numeric", minute: "2-digit", timeZone });

/**
 * A season's episodes with their air dates and broadcast times in Japan, India and the US ("Black Clover season 2
 * episode 5 release date"): exact times from the airing snapshot (AniList), titles and past dates from Kitsu.
 * Seasons of up to 40 episodes only; long runners keep their episode list. Server component.
 */
export default async function ReleaseSchedule({ a, lastAired, current, id = "schedule", heading }: { a: Anime; lastAired: number; current?: number; id?: string; heading?: string }) {
  const show = (await airing()).byKitsu.get(a.id);
  const planned = a.episodeCount || show?.e || null;
  const times = new Map((show?.n ?? []).map(([ep, t]) => [ep, new Date(t * 1000).toISOString()]));
  const total = Math.max(planned ?? 0, lastAired, ...times.keys());
  if (!total || total > MAX) return null;
  const [p1, p2] = await Promise.all([getEpisodesAt(a.id, 0, 20), total > 20 ? getEpisodesAt(a.id, 20, 20) : Promise.resolve({ items: [] })]);
  const eps = new Map([...p1.items, ...p2.items].filter((e) => e.number).map((e) => [e.number!, e]));
  const now = Date.now();
  const rows = Array.from({ length: total }, (_, i) => {
    const n = i + 1, e = eps.get(n), time = times.get(n) ?? null;
    const iso = time ?? e?.airdate ?? null;
    const aired = n <= lastAired || (iso ? new Date(iso).getTime() <= now : false);
    return { n, title: e?.title ?? null, iso, timed: Boolean(time), aired };
  });
  const next = rows.find((r) => !r.aired);
  // Finished seasons have dates but no broadcast times: no empty India and US columns then.
  const timed = rows.some((r) => r.timed);
  if (!rows.some((r) => r.iso)) return null;
  const title = heading ?? `${a.title} episode release schedule`;

  return (
    <section id={id} data-section className="reveal pt-10" aria-labelledby={`${id}-h`}>
      <h2 id={`${id}-h`} className="h-section mb-1">{title}</h2>
      <p className="mb-3 text-sm text-muted">
        {planned ? `${planned} episodes` : `${total} episodes so far`}{a.status === "current" ? `, ${lastAired} aired` : ""}{next?.iso ? `; episode ${next.n} is next, on ${fmtDate(next.iso, { weekday: "long", month: "long", day: "numeric", ...(next.timed ? { timeZone: "Asia/Kolkata" } : {}) })}${next.timed ? ` at ${at(next.iso, "Asia/Kolkata", false)} IST` : ""}` : ""}. {timed ? "Times are the Japanese broadcast; streams usually follow within an hour or two." : ""}
      </p>
      <div className="card overflow-x-auto p-0">
        <table className={`w-full border-collapse text-sm ${timed ? "min-w-[560px]" : ""}`}>
          <thead>
            <tr className="text-left text-xs uppercase tracking-wide text-muted">
              <th scope="col" className="px-3 py-2">Ep</th>
              <th scope="col" className="px-3 py-2">Title</th>
              <th scope="col" className="px-3 py-2">{timed ? "Japan (JST)" : "Aired in Japan"}</th>
              {timed && <th scope="col" className="px-3 py-2">India (IST)</th>}
              {timed && <th scope="col" className="px-3 py-2">US (PT)</th>}
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => {
              const here = r.n === current, isNext = r === next;
              return (
                <tr key={r.n} className={`border-t border-line/60 ${here ? "bg-violet/10" : isNext ? "bg-accent/[.06]" : ""}`} aria-current={here ? "page" : undefined}>
                  <td className="px-3 py-2 font-semibold tabular-nums text-ink">{r.iso || r.aired ? <Link href={episodePath(a, r.n)} className="hover:text-violet-2">{r.n}</Link> : r.n}</td>
                  <td className="max-w-[16rem] truncate px-3 py-2 text-ink/90">
                    {isNext && <span className="mr-1.5 rounded bg-accent-strong px-1.5 py-0.5 text-[10px] font-bold uppercase text-snow">Next</span>}
                    {r.title ? <SpoilerGate inline animeId={a.id} ep={r.n}>{r.title}</SpoilerGate> : <span className="text-muted">{r.aired ? `Episode ${r.n}` : "Title not announced"}</span>}
                  </td>
                  <td className="whitespace-nowrap px-3 py-2 tabular-nums text-ink/90">{r.iso ? (r.timed ? at(r.iso, "Asia/Tokyo") : fmtDate(r.iso, { ...(timed ? { weekday: "short" } : {}), month: "short", day: "numeric", ...(timed ? {} : { year: "numeric" }) })) : <span className="text-muted">TBA</span>}</td>
                  {timed && <td className="whitespace-nowrap px-3 py-2 tabular-nums text-ink/90">{r.iso && r.timed ? at(r.iso, "Asia/Kolkata") : <span className="text-muted">–</span>}</td>}
                  {timed && <td className="whitespace-nowrap px-3 py-2 tabular-nums text-ink/90">{r.iso && r.timed ? at(r.iso, "America/Los_Angeles") : <span className="text-muted">–</span>}</td>}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
