import { FILLER, CONTINUE, type FillerEntry, type ContinueEntry } from "@/data/filler";

/** "26, 97, 101-106" → Set {26, 97, 101..106}. Pure. */
export function parseRanges(spec: string | undefined): Set<number> {
  const out = new Set<number>();
  for (const part of (spec || "").split(",").map((x) => x.trim()).filter(Boolean)) {
    const m = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m) continue;
    const a = Number(m[1]), b = m[2] ? Number(m[2]) : a;
    for (let n = Math.min(a, b); n <= Math.max(a, b); n++) out.add(n);
  }
  return out;
}

/** Compress a set back to "1-3, 7" form for display. Pure. */
export function formatRanges(nums: Iterable<number>): string {
  const xs = [...nums].sort((a, b) => a - b);
  const out: string[] = [];
  for (let i = 0; i < xs.length; i++) {
    let j = i;
    while (j + 1 < xs.length && xs[j + 1] === xs[j] + 1) j++;
    out.push(i === j ? `${xs[i]}` : `${xs[i]}–${xs[j]}`);
    i = j;
  }
  return out.join(", ");
}

export type FillerInfo = { entry: FillerEntry; filler: Set<number>; mixed: Set<number>; total: number; count: number; share: number; nextCanon: (n: number) => number | null };

/** Filler info for a series, limited to episodes that exist (total = episode count or last aired). */
export function fillerFor(slug: string, total: number | null): FillerInfo | null {
  const entry = FILLER[slug];
  if (!entry) return null;
  const all = parseRanges(entry.filler);
  const cap = total && total > 0 ? total : Math.max(...all);
  const filler = new Set([...all].filter((n) => n <= cap));
  const mixed = new Set([...parseRanges(entry.mixed)].filter((n) => n <= cap));
  const nextCanon = (n: number) => { for (let k = n + 1; k <= cap; k++) if (!filler.has(k)) return k; return null; };
  return { entry, filler, mixed, total: cap, count: filler.size, share: cap ? (filler.size / cap) * 100 : 0, nextCanon };
}

export const continuationFor = (slug: string): ContinueEntry | null => CONTINUE[slug] ?? null;
