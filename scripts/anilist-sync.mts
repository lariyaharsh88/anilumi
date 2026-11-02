/**
 * Background AniList sync for the MongoDB cache (lib/alcache.ts). AniList allows ~30 requests a minute, and pages
 * that asked it live failed once crawlers fetched a few at once. This works through, at ~25 a minute:
 *   1. the queue of requests AniList refused while a page was rendering (most-asked first), then
 *   2. stored responses older than 6 days, oldest first, so pages find them fresh (they reuse a week).
 * It runs from GitHub's network, not Render's, so it doesn't eat into the site's own AniList allowance.
 * Every 30 minutes in .github/workflows/anilist-sync.yml (needs the MONGODB_URI secret); by hand:
 *   MONGODB_URI=… npx tsx scripts/anilist-sync.mts   (MINUTES=25, MONGODB_DB defaults to "anilumi")
 */
import { gzipSync } from "node:zlib";
import { MongoClient, Binary } from "mongodb";

const uri = process.env.MONGODB_URI;
if (!uri) {
  console.log("MONGODB_URI is not set: nothing to sync.");
  process.exit(0);
}
const DEADLINE = Date.now() + (Number(process.env.MINUTES) || 25) * 60_000;
const GAP_MS = 2400; // ~25 requests a minute
const STALE_MS = 6 * 86400_000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Job = { _id: string; op: string; query: string; variables: Record<string, unknown> };
type Answer = { data: unknown } | "gone" | "failed";

/** One AniList request: data, "gone" (404: nothing to store) or "failed" (left for the next run). */
async function ask(query: string, variables: Record<string, unknown>): Promise<Answer> {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query, variables }),
      signal: AbortSignal.timeout(20_000),
    }).catch(() => null);
    if (res?.status === 429) {
      const wait = (Number(res.headers.get("retry-after")) || 60) * 1000;
      console.warn(`rate limited, waiting ${wait / 1000}s`);
      await sleep(wait);
      continue;
    }
    if (res?.status === 404) return "gone";
    if (res?.ok) {
      const j = (await res.json().catch(() => null)) as { data?: unknown; errors?: { status?: number }[] } | null;
      if (j?.errors?.some((e) => e.status === 404)) return "gone";
      if (j?.data) return { data: j.data };
    }
    await sleep(5000 * (attempt + 1));
  }
  return "failed";
}

const client = await new MongoClient(uri, { appName: "anilist-sync" }).connect();
const d = client.db(process.env.MONGODB_DB || "anilumi");
const queue = d.collection<Job & { asks: number; at: Date }>("anilist_queue");
const cache = d.collection<{ _id: string }>("anilist_cache");
const tally = { queued: 0, refreshed: 0, gone: 0, failed: 0 };

async function run(job: Job, kind: "queued" | "refreshed"): Promise<void> {
  const answer = await ask(job.query, job.variables);
  if (answer === "failed") tally.failed++;
  else {
    if (answer === "gone") tally.gone++;
    else {
      await cache.updateOne(
        { _id: job._id },
        { $set: { op: job.op, at: new Date(), z: new Binary(gzipSync(JSON.stringify(answer.data))), query: job.query, variables: job.variables } },
        { upsert: true },
      );
      tally[kind]++;
    }
    if (kind === "queued") await queue.deleteOne({ _id: job._id });
  }
  await sleep(GAP_MS);
}

const left = () => Date.now() < DEADLINE;
// 1) What pages asked for and didn't get.
while (left()) {
  const jobs = await queue.find({}, { projection: { op: 1, query: 1, variables: 1 } }).sort({ asks: -1, at: 1 }).limit(25).toArray();
  if (!jobs.length) break;
  for (const job of jobs) {
    if (!left()) break;
    await run(job, "queued");
  }
  if (tally.failed > 20) break; // AniList is down: stop rather than burn the run
}
// 2) Keep stored answers fresh, oldest first.
while (left() && tally.failed <= 20) {
  const stale = await cache
    .find({ at: { $lt: new Date(Date.now() - STALE_MS) }, query: { $exists: true } }, { projection: { op: 1, query: 1, variables: 1 } })
    .sort({ at: 1 })
    .limit(25)
    .toArray() as unknown as Job[];
  if (!stale.length) break;
  for (const job of stale) {
    if (!left()) break;
    await run(job, "refreshed");
  }
}

console.log(`anilist-sync: ${tally.queued} queued fetched, ${tally.refreshed} refreshed, ${tally.gone} not on AniList, ${tally.failed} failed; ${await queue.countDocuments()} still queued, ${await cache.countDocuments()} stored`);
await client.close();
