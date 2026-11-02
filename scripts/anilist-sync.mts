/**
 * Background AniList sync for the MongoDB cache (lib/alcache.ts). AniList refuses Cloudflare's network (where the
 * site runs) and allows ~30 requests a minute elsewhere, so pages never ask it live. This works through:
 *   1. the queue of requests pages couldn't get (most-asked first), then
 *   2. stored answers older than 6 days, oldest first, so pages always find them fresh (they reuse a week).
 * Requests of the same shape (same query, different ids) go to AniList together as one aliased GraphQL query, so
 * one request answers up to 10 lookups; the pace follows AniList's X-RateLimit headers. It runs from GitHub's
 * network. .github/workflows/anilist-sync.yml starts it hourly and the run re-dispatches itself while work is left.
 * By hand: MONGODB_URI=… npx tsx scripts/anilist-sync.mts   (MINUTES=50, MONGODB_DB defaults to "anilumi")
 * Writes `more=true|false` to $GITHUB_OUTPUT: whether another run is worth starting.
 */
import { appendFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { MongoClient, Binary, type AnyBulkWriteOperation } from "mongodb";
import { combine, groupByQuery, type Job } from "../lib/algraphql";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.log("MONGODB_URI is not set: nothing to sync.");
  process.exit(0);
}
const DEADLINE = Date.now() + (Number(process.env.MINUTES) || 50) * 60_000;
const STALE_MS = 6 * 86400_000;
const MAX_BATCH = 10;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const left = () => Date.now() < DEADLINE;

// Pace from AniList's headers: spread the remaining allowance over what's left of the minute.
let gap = 2400;
async function post(query: string, variables: Record<string, unknown>) {
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(30_000),
    }).catch(() => null);
    const limit = Number(res?.headers.get("x-ratelimit-limit")) || 30;
    const remaining = Number(res?.headers.get("x-ratelimit-remaining"));
    gap = Math.max(60_000 / limit, 1000) * (remaining <= 3 ? 2 : 1.1);
    if (res?.status === 429) {
      const wait = (Number(res.headers.get("retry-after")) || 60) * 1000;
      console.warn(`rate limited, waiting ${wait / 1000}s`);
      await sleep(wait);
      continue;
    }
    if (!res) { await sleep(5000 * (attempt + 1)); continue; }
    const body = (await res.json().catch(() => null)) as { data?: Record<string, unknown> | null; errors?: { status?: number; message?: string; path?: (string | number)[] }[] } | null;
    if (res.status >= 500 || !body) { await sleep(5000 * (attempt + 1)); continue; }
    return { status: res.status, body };
  }
  return null;
}

const client = await new MongoClient(uri, { appName: "anilist-sync" }).connect();
const d = client.db(process.env.MONGODB_DB || "anilumi");
const queue = d.collection<Job & { asks: number; at: Date }>("anilist_queue");
const cache = d.collection<{ _id: string }>("anilist_cache");
const tally = { fetched: 0, refreshed: 0, gone: 0, failed: 0, requests: 0 };
const batchFor = new Map<string, number>(); // per query shape; halves when AniList finds a batch too complex

/** Fetch one group of same-shape jobs, splitting it if AniList rejects the size. */
async function runGroup(jobs: Job[], kind: "fetched" | "refreshed"): Promise<void> {
  const shapeKey = jobs[0].query;
  for (let i = 0; i < jobs.length && left(); ) {
    const size = Math.min(batchFor.get(shapeKey) ?? MAX_BATCH, jobs.length - i);
    const part = jobs.slice(i, i + size);
    const q = combine(part);
    if (!q) { tally.failed += part.length; i += size; continue; }
    const res = await post(q.query, q.variables);
    tally.requests++;
    await sleep(gap);
    if (!res) { tally.failed += part.length; return; } // AniList down: leave the rest for the next run
    // Whole request rejected (too complex, bad query): try smaller batches, then give the job up after 3 tries.
    if (!res.body.data && res.status === 400 && size > 1) { batchFor.set(shapeKey, Math.max(1, Math.floor(size / 2))); continue; }
    const saves: AnyBulkWriteOperation<{ _id: string }>[] = [];
    const done: string[] = [];
    const retry: string[] = [];
    part.forEach((job, n) => {
      const value = res.body.data?.[`q${n}`];
      const err = res.body.errors?.find((e) => e.path?.[0] === `q${n}`) ?? (res.body.data ? undefined : res.body.errors?.[0]);
      if (value) {
        saves.push({ updateOne: { filter: { _id: job._id }, update: { $set: { op: job.op, at: new Date(), z: new Binary(gzipSync(JSON.stringify({ [q.root]: value }))), query: job.query, variables: job.variables } }, upsert: true } });
        done.push(job._id);
        tally[kind]++;
      } else if (err?.status === 404 || (res.status === 404) || (!err && res.body.data)) {
        done.push(job._id); // not on AniList (or null): nothing to store
        tally.gone++;
      } else {
        retry.push(job._id);
        tally.failed++;
      }
    });
    if (saves.length) await cache.bulkWrite(saves, { ordered: false });
    if (kind === "fetched") {
      if (done.length) await queue.deleteMany({ _id: { $in: done } });
      if (retry.length) {
        await queue.updateMany({ _id: { $in: retry } }, { $inc: { fails: 1 } });
        await queue.deleteMany({ _id: { $in: retry }, fails: { $gte: 3 } });
      }
    }
    i += size;
  }
}

const byShape = groupByQuery;

// 1) What pages asked for and didn't get, most-asked first.
while (left() && tally.failed < 200) {
  const jobs = await queue.find({}, { projection: { op: 1, query: 1, variables: 1, fails: 1 } }).sort({ asks: -1, at: 1 }).limit(200).toArray();
  if (!jobs.length) break;
  const before = tally.fetched + tally.gone;
  for (const group of byShape(jobs)) if (left()) await runGroup(group, "fetched");
  if (tally.fetched + tally.gone === before) break; // nothing moved: AniList is refusing everything
}
// 2) Keep stored answers fresh, oldest first.
while (left() && tally.failed < 200) {
  const stale = (await cache
    .find({ at: { $lt: new Date(Date.now() - STALE_MS) }, query: { $exists: true } }, { projection: { op: 1, query: 1, variables: 1 } })
    .sort({ at: 1 })
    .limit(200)
    .toArray()) as unknown as Job[];
  if (!stale.length) break;
  const before = tally.refreshed;
  for (const group of byShape(stale)) if (left()) await runGroup(group, "refreshed");
  if (tally.refreshed === before) break;
}

const queued = await queue.countDocuments();
const stale = await cache.countDocuments({ at: { $lt: new Date(Date.now() - STALE_MS) }, query: { $exists: true } });
console.log(`anilist-sync: ${tally.fetched} fetched, ${tally.refreshed} refreshed, ${tally.gone} not on AniList, ${tally.failed} failed in ${tally.requests} requests; ${queued} still queued, ${stale} stale, ${await cache.countDocuments()} stored`);
// Chain another run only while there is work and this one made progress (AniList down → wait for the schedule).
const more = (queued > 0 || stale > 0) && tally.fetched + tally.refreshed + tally.gone > 0;
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `more=${more}\n`);
await client.close();
