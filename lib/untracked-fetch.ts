/**
 * fetch() past Next's data cache. A fetch with `next: { revalidate: n }` during a render also makes the whole page
 * expire after n seconds, so the 30-minute airing snapshot and the hourly news feeds made anime pages re-render
 * every half hour (and each Next.js navigation variant of the page re-rendered on its own). Callers of this keep
 * their own in-memory copy instead, and the page keeps the expiry of its slower data.
 */
export function untrackedFetch(input: string, init?: RequestInit): Promise<Response> {
  const patched = globalThis.fetch as typeof fetch & { _nextOriginalFetch?: typeof fetch };
  return (patched._nextOriginalFetch ?? patched)(input, init);
}
