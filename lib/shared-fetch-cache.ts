import { createHash } from "node:crypto";
import type { CacheEntryType, CacheValue, IncrementalCache, WithLastModified } from "@opennextjs/aws/types/overrides.js";
import { getCloudflareContext } from "@opennextjs/cloudflare";
import r2IncrementalCache from "@opennextjs/cloudflare/overrides/incremental-cache/r2-incremental-cache";
import { withRegionalCache } from "@opennextjs/cloudflare/overrides/incremental-cache/regional-cache";

/**
 * Incremental cache for OpenNext (open-next.config.ts). Rendered pages stay per build, as before (R2 behind the
 * regional cache). Fetch results (Kitsu, AniList, Jikan…) are kept under one key space shared by every build:
 * OpenNext prefixes all keys with the build id, so each deploy started with no cached API responses and every
 * first visit rendered against the live APIs (2-10 s, and AniList's rate limit). The cached value is the raw
 * response with its own revalidate time, which doesn't depend on the build. No unstable_cache in this app, so
 * every "fetch" entry is a plain fetch().
 */
type Bucket = {
  get(key: string): Promise<{ json<T>(): Promise<T>; uploaded: Date } | null>;
  put(key: string, value: string): Promise<unknown>;
};

const pages = withRegionalCache(r2IncrementalCache, { mode: "long-lived" });

function env() {
  return getCloudflareContext().env as unknown as { NEXT_INC_CACHE_R2_BUCKET?: Bucket; NEXT_INC_CACHE_R2_PREFIX?: string };
}

export function sharedFetchKey(key: string, prefix = "incremental-cache"): string {
  return `${prefix}/shared/${createHash("sha256").update(key).digest("hex")}.fetch`;
}

const cache: IncrementalCache = {
  name: "anilumi-shared-fetch",
  async get<T extends CacheEntryType = "cache">(key: string, cacheType?: T): Promise<WithLastModified<CacheValue<T>> | null> {
    if (cacheType !== "fetch") return pages.get(key, cacheType);
    const { NEXT_INC_CACHE_R2_BUCKET: r2, NEXT_INC_CACHE_R2_PREFIX: prefix } = env();
    if (!r2) return null;
    try {
      const obj = await r2.get(sharedFetchKey(key, prefix || undefined));
      return obj ? { value: await obj.json<CacheValue<T>>(), lastModified: obj.uploaded.getTime() } : null;
    } catch {
      return null;
    }
  },
  async set<T extends CacheEntryType = "cache">(key: string, value: CacheValue<T>, cacheType?: T): Promise<void> {
    if (cacheType !== "fetch") return pages.set(key, value, cacheType);
    const { NEXT_INC_CACHE_R2_BUCKET: r2, NEXT_INC_CACHE_R2_PREFIX: prefix } = env();
    try {
      await r2?.put(sharedFetchKey(key, prefix || undefined), JSON.stringify(value));
    } catch {
      /* a failed write only costs a refetch */
    }
  },
  delete: (key) => pages.delete(key),
};

export default cache;
