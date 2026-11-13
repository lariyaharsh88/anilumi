"use client";
import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "@/components/Link";
import type { CompareRow } from "@/lib/charcompare";

type SortKey = "favourites" | "height" | "age";
const SORTS: [SortKey, string][] = [["favourites", "Most popular"], ["height", "Tallest"], ["age", "Oldest"]];
const FATE: Record<string, string> = { alive: "Survives", dies: "Dies", revived: "Dies, comes back", unclear: "Unclear" };
const fmtK = (n: number) => (n >= 1000 ? `${(n / 1000).toFixed(n >= 10000 ? 0 : 1)}K` : String(n));

/**
 * Compare a character with others: pick the set (same series or similar characters from fan-recommended anime), tick
 * who to include, sort, and see the leader of each row highlighted. The fate and strength rows stay hidden until the
 * viewer turns spoilers on.
 */
export default function CharacterCompare({ self, sameSeries, similar }: { self: CompareRow; sameSeries: CompareRow[]; similar: CompareRow[] }) {
  const sets = [["same", "Same series", sameSeries], ["similar", "Similar from other anime", similar]] as const;
  const [set, setSet] = useState<"same" | "similar">(sameSeries.length ? "same" : "similar");
  const pool = set === "same" ? sameSeries : similar;
  const [off, setOff] = useState<Set<number>>(new Set());
  const [sort, setSort] = useState<SortKey>("favourites");
  const [spoilers, setSpoilers] = useState(false);

  const cols = useMemo(() => {
    const picked = [self, ...pool.filter((r) => !off.has(r.id))];
    const v = (r: CompareRow) => (sort === "favourites" ? r.favourites : sort === "height" ? r.heightCm ?? -1 : r.ageNum ?? -1);
    return [...picked].sort((a, b) => v(b) - v(a));
  }, [self, pool, off, sort]);
  const max = (f: (r: CompareRow) => number | null) => Math.max(...cols.map((r) => f(r) ?? -1));
  const topFav = max((r) => r.favourites), topH = max((r) => r.heightCm), topAge = max((r) => r.ageNum);
  const toggle = (id: number) => setOff((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const row = (label: string, cell: (r: CompareRow) => React.ReactNode, hidden = false) => (
    <tr className="border-t border-line/60">
      <th scope="row" className="sticky left-0 z-10 bg-bg-2 px-3 py-2 text-left text-xs font-semibold uppercase tracking-wide text-muted">{label}</th>
      {cols.map((r) => (
        <td key={r.id} className={`px-3 py-2 text-sm ${r.id === self.id ? "bg-violet/[.07]" : ""}`}>
          {hidden && !spoilers ? <span className="select-none text-muted blur-[3px]">hidden</span> : cell(r) ?? <span className="text-muted">–</span>}
        </td>
      ))}
    </tr>
  );
  const lead = (on: boolean, text: React.ReactNode) => <span className={on ? "font-bold text-accent-2" : "text-ink"}>{text}{on && cols.length > 1 ? " 👑" : ""}</span>;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2" role="tablist" aria-label="Compare with">
        {sets.map(([k, label, rows]) => rows.length > 0 && (
          <button key={k} type="button" role="tab" aria-selected={set === k} onClick={() => { setSet(k); setOff(new Set()); }} className={`chip ${set === k ? "chip-active" : ""}`}>{label}</button>
        ))}
        <label className="ml-auto flex items-center gap-2 text-sm text-muted">Sort
          <select value={sort} onChange={(e) => setSort(e.target.value as SortKey)} className="rounded-lg border border-line bg-white/[.04] px-2 py-1 text-sm text-ink">
            {SORTS.map(([k, l]) => <option key={k} value={k}>{l}</option>)}
          </select>
        </label>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5" aria-label="Characters to compare">
        {pool.map((r) => (
          <button key={r.id} type="button" onClick={() => toggle(r.id)} aria-pressed={!off.has(r.id)} className={`rounded-full border px-2.5 py-1 text-xs transition ${off.has(r.id) ? "border-line text-muted line-through" : "border-violet/50 bg-violet/10 text-ink"}`}>{r.name}</button>
        ))}
      </div>
      <div className="card mt-3 overflow-x-auto p-0">
        <table className="w-full min-w-[560px] border-collapse">
          <thead>
            <tr>
              <th className="sticky left-0 z-10 w-28 bg-bg-2" />
              {cols.map((r) => (
                <th key={r.id} scope="col" className={`px-3 pb-2 pt-3 text-left align-bottom ${r.id === self.id ? "bg-violet/[.07]" : ""}`}>
                  <span className="relative mb-1.5 block h-16 w-12 overflow-hidden rounded-lg bg-bg-2">{r.image && <Image src={r.image} alt={r.name} fill sizes="48px" className="object-cover object-top" />}</span>
                  {r.href && r.id !== self.id ? <Link href={r.href} className="text-sm font-semibold text-ink hover:text-violet-2">{r.name}</Link> : <span className="text-sm font-semibold text-ink">{r.name}</span>}
                  <span className="block max-w-[9rem] truncate text-[11px] font-normal text-muted">{r.series}</span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {row("Popularity", (r) => (
              <span className="block min-w-[5rem]">
                {lead(r.favourites === topFav, `${fmtK(r.favourites)} fans`)}
                <span className="mt-1 block h-1.5 rounded-full bg-white/10"><span className="block h-1.5 rounded-full bg-gradient-to-r from-accent to-violet" style={{ width: `${Math.max(4, (r.favourites / topFav) * 100)}%` }} /></span>
              </span>
            ))}
            {row("Role", (r) => (r.role ? (r.role === "main" ? "Main" : "Supporting") : null))}
            {row("Age", (r) => (r.age ? lead(r.ageNum === topAge, r.age) : null))}
            {row("Height", (r) => (r.heightCm ? lead(r.heightCm === topH, `${r.heightCm} cm`) : null))}
            {row("Birthday", (r) => (r.birthday ? <>{r.birthday}{r.sign ? <span className="block text-[11px] text-muted">{r.sign}</span> : null}</> : null))}
            {row("Blood type", (r) => r.bloodType)}
            {row("Japanese voice", (r) => r.jp)}
            {row("English voice", (r) => r.en)}
            {row("Hindi voice", (r) => r.hindi)}
            {row("Strength", (r) => r.strength, true)}
            {row("Survives the story?", (r) => (r.fate ? FATE[r.fate] : null), true)}
          </tbody>
        </table>
      </div>
      <label className="mt-3 inline-flex cursor-pointer items-center gap-2 text-sm text-ink">
        <input type="checkbox" checked={spoilers} onChange={(e) => setSpoilers(e.target.checked)} className="h-4 w-4 accent-violet" /> Show spoilers (strength and who survives)
      </label>
      <p className="mt-1 text-xs text-muted">Heights are the tallest listed (after any time skip). Popularity is AniList favourites. 👑 marks the highest in each row.</p>
    </div>
  );
}
