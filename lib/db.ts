/**
 * MongoDB (Atlas) connection, shared by every route in the process. Everything that needs it checks
 * dbEnabled() first, so the site runs unchanged without MONGODB_URI. Server-only.
 */
import "server-only";
import { MongoClient, type Db } from "mongodb";
import type { RatingStats } from "./community";

const g = globalThis as unknown as { __mongo?: Promise<Db> };

export const dbEnabled = () => Boolean(process.env.MONGODB_URI);

export async function ensureIndexes(d: Db): Promise<void> {
  await Promise.all([
    d.collection("ratings").createIndex({ animeId: 1, vid: 1 }, { unique: true }),
    d.collection("reactions").createIndex({ key: 1, vid: 1 }, { unique: true }),
    d.collection("hype").createIndex({ animeId: 1, vid: 1 }, { unique: true }),
    d.collection("hype_stats").createIndex({ count: -1 }),
    d.collection("poll_votes").createIndex({ pollId: 1, vid: 1 }, { unique: true }),
    d.collection("leads").createIndex({ email: 1, kind: 1, animeId: 1 }, { unique: true }),
    d.collection("leads").createIndex({ createdAt: -1 }),
    d.collection("partner_leads").createIndex({ createdAt: -1 }),
    d.collection("rate_limits").createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]);
}

/** The database, or null when MONGODB_URI is unset. Throws if Atlas is unreachable (callers degrade). */
export async function db(): Promise<Db | null> {
  const uri = process.env.MONGODB_URI;
  if (!uri) return null;
  g.__mongo ??= (async () => {
    // Render's free instance has 512 MB: a small pool is plenty for this traffic.
    const client = await new MongoClient(uri, { maxPoolSize: 5, serverSelectionTimeoutMS: 6000, appName: "anilumi" }).connect();
    const d = client.db(process.env.MONGODB_DB || "anilumi");
    await ensureIndexes(d); // idempotent; once per process
    return d;
  })().catch((err) => {
    g.__mongo = undefined; // retry on the next request
    console.error("[db] connect failed:", (err as Error).name, String((err as Error).message).replace(/mongodb(\+srv)?:\/\/\S+/g, "<uri>").slice(0, 300));
    throw err;
  });
  return g.__mongo;
}

/** Rating totals for one anime, or null if the database is off or down. */
export async function ratingStats(animeId: string): Promise<RatingStats | null> {
  try {
    const d = await db();
    if (!d) return null;
    return await d.collection<RatingStats & { _id: string }>("rating_stats").findOne({ _id: animeId }, { projection: { _id: 0 } });
  } catch {
    return null;
  }
}
