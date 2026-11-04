import type { StreamingLink } from "./kitsu";

/**
 * Which services carry how much of a franchise: for each streaming site, the number of the given entries it has
 * at least one link for, most first (ties by name). Kitsu's lists are incomplete, so this is "at least". Pure.
 */
export function streamCoverage(ids: string[], streams: Map<string, StreamingLink[]>): { site: string; n: number }[] {
  const count = new Map<string, number>();
  for (const id of new Set(ids)) for (const site of new Set((streams.get(id) || []).map((s) => s.site))) count.set(site, (count.get(site) || 0) + 1);
  return [...count].map(([site, n]) => ({ site, n })).sort((a, b) => b.n - a.n || a.site.localeCompare(b.site));
}

/** One link per site for an entry (Kitsu sometimes lists a site twice, e.g. sub and dub pages). Pure. */
export const oneLinkPerSite = (links: StreamingLink[]): StreamingLink[] => links.filter((s, i) => links.findIndex((x) => x.site === s.site) === i);
