/**
 * Remembers upstream misses for a while in this data centre's Cache API. The fetch cache keeps only successful
 * responses, so an API that answers 404 for "no data" or 503 while it's down was asked again on every render
 * (AniSkip 41K 404s and AnimeThemes 11K 503s a day, Nov 2026). Outside Workers (tests, next dev) there is no
 * caches.default and nothing is remembered.
 */
const store = () => (globalThis as { caches?: { default?: Cache } }).caches?.default;
const keyFor = (name: string) => new Request(`https://anilumi.in/__miss/${encodeURIComponent(name)}`);

/** True when `name` was marked as a miss within its time to live. */
export async function isMiss(name: string): Promise<boolean> {
  try {
    return Boolean(await store()?.match(keyFor(name)));
  } catch {
    return false;
  }
}

/** Marks `name` as a miss for `ttlSec` seconds. */
export async function markMiss(name: string, ttlSec: number): Promise<void> {
  try {
    await store()?.put(keyFor(name), new Response("1", { headers: { "Cache-Control": `max-age=${ttlSec}` } }));
  } catch {
    /* only costs another upstream call */
  }
}
