/**
 * Alias search over data/aliases.json (popular Kitsu anime + synonyms from anime-offline-database,
 * ODbL 1.0 / DbCL 1.0). Finds "snk", "mha", "jjk" and typos like "one peice" that Kitsu's own text
 * search misses or ranks badly. Pure apart from the JSON import; unit-tested.
 */
import data from "@/data/aliases.json";

export type AliasEntry = { i: string; s: string; t: string; r: number; n: string[] };
export type AliasHit = { id: string; slug: string; title: string; kind: "exact" | "prefix" | "fuzzy" };

export const norm = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");

/** Edit distance (with adjacent swaps), giving up early once it exceeds `max`. */
export function editDistance(a: string, b: string, max: number): number {
  if (Math.abs(a.length - b.length) > max) return max + 1;
  let prev2: number[] = [];
  let prev = Array.from({ length: b.length + 1 }, (_, j) => j);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    let rowMin = i;
    for (let j = 1; j <= b.length; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      let v = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + cost);
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) v = Math.min(v, prev2[j - 2] + 1);
      cur.push(v);
      rowMin = Math.min(rowMin, v);
    }
    if (rowMin > max) return max + 1;
    prev2 = prev;
    prev = cur;
  }
  return prev[b.length];
}

type Index = { entries: AliasEntry[]; exact: Map<string, AliasEntry[]> };
let cached: Index | null = null;
export function buildIndex(entries: AliasEntry[]): Index {
  const exact = new Map<string, AliasEntry[]>();
  for (const e of entries) for (const n of e.n) {
    const list = exact.get(n);
    if (list) { if (!list.includes(e)) list.push(e); } else exact.set(n, [e]);
  }
  for (const list of exact.values()) list.sort((a, b) => a.r - b.r);
  return { entries, exact };
}
const index = () => (cached ??= buildIndex((data as { anime: AliasEntry[] }).anime));

const hit = (e: AliasEntry, kind: AliasHit["kind"]): AliasHit => ({ id: e.i, slug: e.s, title: e.t, kind });

/** Best alias matches for a query: exact alias, else title prefix, else close typo. Most popular first. */
export function aliasLookup(q: string, limit = 5, idx: Index = index()): AliasHit[] {
  const n = norm(q);
  if (n.length < 2) return [];
  const exact = idx.exact.get(n);
  if (exact?.length) return exact.slice(0, limit).map((e) => hit(e, "exact"));
  if (n.length >= 4) {
    const pre = idx.entries.filter((e) => e.n.some((x) => x.startsWith(n))).slice(0, limit);
    if (pre.length) return pre.map((e) => hit(e, "prefix"));
  }
  if (n.length < 5) return [];
  const max = n.length >= 9 ? 2 : 1;
  const scored: { e: AliasEntry; d: number }[] = [];
  for (const e of idx.entries) {
    let best = max + 1;
    for (const x of e.n) {
      if (Math.abs(x.length - n.length) > max) continue;
      best = Math.min(best, editDistance(n, x, max));
      if (best === 0) break;
    }
    if (best <= max) scored.push({ e, d: best });
  }
  return scored.sort((a, b) => a.d - b.d || a.e.r - b.e.r).slice(0, limit).map(({ e }) => hit(e, "fuzzy"));
}
