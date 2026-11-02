/**
 * Batching for scripts/anilist-sync.mts: requests of one shape (same query text, different ids) sent to AniList as a
 * single aliased GraphQL query, so one rate-limited request answers several lookups. Pure.
 */
export type Job = { _id: string; op: string; query: string; variables: Record<string, unknown>; fails?: number };

/** "query($id:Int){Media(id:$id){…}}" → its variable list, its single root selection and the root field. */
export function shapeOf(query: string): { vars: string; inner: string; root: string } | null {
  const m = query.match(/^\s*query\s*\(([^)]*)\)\s*\{([\s\S]*)\}\s*$/);
  const root = m?.[2].match(/^\s*(\w+)/)?.[1];
  return m && root ? { vars: m[1], inner: m[2].trim(), root } : null;
}

/** Several jobs of one shape as one aliased query (q0: Media(id:$id_0){…} q1: …), or null if the shape is unknown. */
export function combine(jobs: Job[]): { query: string; variables: Record<string, unknown>; root: string } | null {
  const shape = jobs.length ? shapeOf(jobs[0].query) : null;
  if (!shape || jobs.some((j) => j.query !== jobs[0].query)) return null;
  const rename = (s: string, i: number) => s.replace(/\$(\w+)/g, (_, name: string) => `$${name}_${i}`);
  return {
    query: `query(${jobs.map((_, i) => rename(shape.vars, i)).join(",")}){${jobs.map((_, i) => `q${i}:${rename(shape.inner, i)}`).join(" ")}}`,
    variables: Object.fromEntries(jobs.flatMap((j, i) => Object.entries(j.variables).map(([k, v]) => [`${k}_${i}`, v]))),
    root: shape.root,
  };
}

/** Jobs grouped by query text, largest groups first. */
export function groupByQuery(jobs: Job[]): Job[][] {
  const groups = new Map<string, Job[]>();
  for (const j of jobs) groups.set(j.query, [...(groups.get(j.query) || []), j]);
  return [...groups.values()].sort((a, b) => b.length - a.length);
}
