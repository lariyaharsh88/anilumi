import Link from "@/components/Link";
import { platformFor } from "@/lib/hindidub";
import { airingLabel, andList, channelPremieres, channelRows, dateLabel, kidsShow, latestTimings, recentlyOnAir, showFilmsHref, showHref, streamsNow, type KidsChannel } from "@/lib/kidstv";

const host = (u: string) => new URL(u).hostname.replace(/^www\./, "");

/** Where a show streams in Hindi now, each linked to its platform page when there is one. */
export function StreamCell({ id }: { id: string }) {
  const streams = streamsNow(kidsShow(id));
  if (!streams.length) return <span className="text-muted">–</span>;
  return (
    <span className="flex flex-wrap gap-x-2 gap-y-0.5">
      {[...new Map(streams.map((p) => [p.name, p])).values()].map((p) => {
        const page = platformFor(p.name);
        const name = p.name.replace(/ \((YouTube|Prime Video channel)\)$/, "");
        return page ? <Link key={p.name} href={`/hindi-dub/${page.slug}`} title={p.scope} className="text-violet hover:underline">{name}</Link> : <span key={p.name} title={p.scope}>{name}</span>;
      })}
    </span>
  );
}

/** A channel's anime: since when, the latest dated report of it on air, and where it streams in Hindi now. */
export default function KidsShowTable({ channel }: { channel: KidsChannel }) {
  const rows = channelRows(channel);
  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-muted">
            <th scope="col" className="px-3 py-2">Anime</th>
            <th scope="col" className="px-3 py-2">On {channel.name} since</th>
            <th scope="col" className="px-3 py-2">Still airing?</th>
            <th scope="col" className="px-3 py-2">Stream in Hindi now</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => {
            const s = kidsShow(r.show);
            const href = showHref(s), films = showFilmsHref(s);
            return (
              <tr key={r.show} className="border-t border-line/60 align-top">
                <td className="px-3 py-2">
                  <p className="font-semibold text-ink">{href ? <Link href={href} className="hover:text-violet-2">{s.t}</Link> : s.t}</p>
                  <p className="mt-0.5 max-w-md text-xs leading-5 text-muted">
                    {r.note}{" "}
                    {r.sources.slice(0, 2).map((u, i) => <span key={u}>{i ? " · " : ""}<a href={u} target="_blank" rel="noopener nofollow" className="underline">{host(u)}</a></span>)}
                  </p>
                  {films && <p className="mt-1 text-xs"><Link href={films} className="text-violet hover:underline">{s.t} movies in Hindi →</Link></p>}
                </td>
                <td className="whitespace-nowrap px-3 py-2 tabular-nums text-ink/90">{r.since ?? "–"}</td>
                <td className={`whitespace-nowrap px-3 py-2 ${recentlyOnAir(r) ? "font-medium text-emerald-300" : "text-ink/80"}`}>{airingLabel(r)}</td>
                <td className="px-3 py-2"><StreamCell id={r.show} /></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}

/** Show name, linked to its Hindi dub page when we have one. */
function ShowName({ id }: { id: string }) {
  const s = kidsShow(id), href = showHref(s);
  return href ? <Link href={href} className="font-semibold text-ink hover:text-violet-2">{s.t}</Link> : <span className="font-semibold text-ink">{s.t}</span>;
}
const Sources = ({ urls }: { urls: string[] }) => <>{urls.slice(0, 2).map((u, i) => <span key={u}>{i ? " · " : ""}<a href={u} target="_blank" rel="noopener nofollow" className="underline">{host(u)}</a></span>)}</>;

/** The latest announced time slot of each show, dated and sourced (announcements, not a live schedule). */
export function KidsTimings({ channel }: { channel: KidsChannel }) {
  return (
    <div className="card overflow-x-auto p-0">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="text-left text-xs uppercase tracking-wide text-muted">
            <th scope="col" className="px-3 py-2">Anime</th>
            <th scope="col" className="px-3 py-2">Time (IST)</th>
            <th scope="col" className="px-3 py-2">Starting</th>
            <th scope="col" className="px-3 py-2">Announced for</th>
          </tr>
        </thead>
        <tbody>
          {latestTimings(channel).map((p) => (
            <tr key={p.show} className="border-t border-line/60 align-top">
              <td className="px-3 py-2"><ShowName id={p.show} /></td>
              <td className="whitespace-nowrap px-3 py-2 font-medium tabular-nums text-ink">{p.slot}</td>
              <td className="whitespace-nowrap px-3 py-2 tabular-nums text-ink/90">{dateLabel(p.date)}</td>
              <td className="px-3 py-2 text-xs leading-5 text-muted">{p.what}.{p.langs?.length ? ` In ${andList(p.langs)}.` : ""} <Sources urls={p.sources} /></td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** Every dated premiere, newest first. */
export function KidsPremieres({ channel }: { channel: KidsChannel }) {
  return (
    <ol className="card max-w-3xl divide-y divide-line/60 p-0 text-sm">
      {channelPremieres(channel).map((p) => (
        <li key={`${p.show}-${p.date}`} className="flex gap-3 px-4 py-2.5">
          <span className="w-24 shrink-0 tabular-nums text-muted">{dateLabel(p.date)}</span>
          <span className="leading-6">
            <ShowName id={p.show} />: {p.what}{p.slot ? `, ${p.slot}` : ""}.{p.langs?.length ? ` In ${andList(p.langs)}.` : ""}{" "}
            <span className="text-xs text-muted"><Sources urls={p.sources} /></span>
          </span>
        </li>
      ))}
    </ol>
  );
}
