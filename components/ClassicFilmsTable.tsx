import Link from "@/components/Link";
import { REGIONS, streams, rentOnly, whereNames, hindiIn, type ClassicFilm } from "@/lib/classicfilms";

const FLAG = { US: "🇺🇸 US", IN: "🇮🇳 India", GB: "🇬🇧 UK" } as const;

/** Each film's legal streams in the US, India and the UK, with rent-only and Hindi audio marked. */
export default function ClassicFilmsTable({ films }: { films: ClassicFilm[] }) {
  return (
    <div className="-mx-4 overflow-x-auto px-4">
      <table className="w-full min-w-[680px] text-left text-sm">
        <thead className="text-xs uppercase tracking-wide text-muted">
          <tr className="border-b border-line"><th className="py-2 pr-3 font-semibold">Film</th>{REGIONS.map((r) => <th key={r} className="py-2 pr-3 font-semibold">{FLAG[r]}</th>)}</tr>
        </thead>
        <tbody>
          {films.map((f) => (
            <tr key={f.t} className="border-b border-line/50 align-top">
              <td className="py-2.5 pr-3"><Link href={`/anime/${f.kitsu}`} className="font-medium text-ink hover:text-violet-2">{f.t}</Link><span className="block text-xs text-muted">{f.year} · {f.director}</span></td>
              {REGIONS.map((r) => {
                const s = streams(f, r);
                return (
                  <td key={r} className="py-2.5 pr-3 text-ink/85">
                    {s.length ? whereNames(s).join(", ") : rentOnly(f, r) ? <span className="text-muted">Rent or buy</span> : <span className="text-muted">Not streaming</span>}
                    {r === "IN" && hindiIn(f).length > 0 && <span className="ml-1 rounded-full bg-orange-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-orange-300">Hindi</span>}
                    {s.some((x) => x.kind === "free") && <span className="ml-1 rounded-full bg-emerald-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-300">Free</span>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
