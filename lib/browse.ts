/**
 * Filter-and-sort for season charts and top lists (components/BrowseFilter.tsx, data from app/api/browse).
 * Pure; unit-tested.
 */
export type BrowseItem = {
  id: string; slug: string; title: string; poster: string | null; subtype: string | null; year: string | null;
  eps: number | null; rating: number | null; users: number; status: string; start: string | null; genres: string[]; services: string[];
};
export type BrowseSort = "popular" | "score" | "newest";
export type BrowseQuery = { format: string; genre: string; service: string; sort: BrowseSort };
export const NO_FILTER: BrowseQuery = { format: "", genre: "", service: "", sort: "popular" };

export const isFiltered = (q: BrowseQuery) => Boolean(q.format || q.genre || q.service) || q.sort !== "popular";

export function applyBrowse(items: BrowseItem[], q: BrowseQuery): BrowseItem[] {
  const out = items.filter((a) => (!q.format || a.subtype === q.format) && (!q.genre || a.genres.includes(q.genre)) && (!q.service || a.services.includes(q.service)));
  const by: Record<BrowseSort, (x: BrowseItem, y: BrowseItem) => number> = {
    popular: (x, y) => y.users - x.users,
    // Unrated titles last, then by popularity.
    score: (x, y) => (y.rating ?? -1) - (x.rating ?? -1) || y.users - x.users,
    newest: (x, y) => (y.start || "").localeCompare(x.start || "") || y.users - x.users,
  };
  return [...out].sort(by[q.sort]);
}

/** Options for a facet, with counts, most common first; values on fewer than `min` titles are left out. */
export function facet(items: BrowseItem[], key: "genres" | "services" | "subtype", min = 1): { value: string; n: number }[] {
  const count = new Map<string, number>();
  for (const a of items) for (const v of key === "subtype" ? (a.subtype ? [a.subtype] : []) : a[key]) count.set(v, (count.get(v) || 0) + 1);
  return [...count].filter(([, n]) => n >= min).map(([value, n]) => ({ value, n })).sort((a, b) => b.n - a.n || a.value.localeCompare(b.value));
}
