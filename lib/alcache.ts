/**
 * Durable copy of slow-changing AniList responses (cast, voice actors, staff, scores) in MongoDB. Next's fetch
 * cache lives on Render's disk and every deploy empties it, so crawls after a deploy re-asked AniList for
 * everything at 30 requests a minute; past the limit those pages returned 500s. Here a response is reused for a
 * week, and an older copy stands in whenever AniList refuses. Gzipped: Atlas M0 has 512 MB. Server-only; every
 * call fails soft (null), so a database outage only means asking AniList as before.
 */
import "server-only";
import { createHash } from "node:crypto";
import { gzipSync, gunzipSync } from "node:zlib";
import { Binary } from "mongodb";
import { db } from "./db";

export const AL_CACHE = "anilist_cache";
const FRESH_MS = 7 * 86400_000;
type Doc = { _id: string; op: string; at: Date; z: Binary };

export const cacheKey = (query: string, variables: Record<string, unknown>) => createHash("sha1").update(query).update(JSON.stringify(variables)).digest("hex");

/** The stored response and whether it is still fresh, or null (none stored, database off or slow). */
export async function readCached(key: string): Promise<{ data: unknown; fresh: boolean } | null> {
  try {
    const d = await db();
    if (!d) return null;
    const doc = await d.collection<Doc>(AL_CACHE).findOne({ _id: key }, { maxTimeMS: 1500 });
    if (!doc) return null;
    return { data: JSON.parse(gunzipSync(Buffer.from(doc.z.buffer)).toString("utf8")), fresh: Date.now() - doc.at.getTime() < FRESH_MS };
  } catch {
    return null;
  }
}

/** Store a response in the background; failures are ignored. */
export function writeCached(key: string, op: string, data: unknown): void {
  db()
    .then((d) => d?.collection<Doc>(AL_CACHE).updateOne({ _id: key }, { $set: { op, at: new Date(), z: new Binary(gzipSync(JSON.stringify(data))) } }, { upsert: true }))
    .catch(() => {});
}
