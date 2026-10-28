import { guard, reply } from "@/lib/guard";
import { isAnimeId, isScore, ratingDelta, summarize, type RatingStats } from "@/lib/community";

/** Rate an anime 1–10, or change your rating. One rating per visitor per anime. */
export async function POST(req: Request) {
  const g = await guard(req, "rate", 20);
  if (g instanceof Response) return g;
  const { animeId, score } = g.body;
  if (!isAnimeId(animeId) || !isScore(score)) return reply(g, { error: "Bad request" }, 400);
  const now = new Date();
  const prev = await g.d.collection("ratings").findOneAndUpdate(
    { animeId, vid: g.vid },
    { $set: { score, updatedAt: now }, $setOnInsert: { createdAt: now } },
    { upsert: true, returnDocument: "before" },
  );
  // `dist` is stored as an object keyed "0"–"9" ($inc on a missing path creates fields, not array slots).
  const inc = ratingDelta(score, (prev?.score as number) ?? null);
  const stats = Object.keys(inc).length
    ? await g.d.collection<RatingStats & { _id: string }>("rating_stats").findOneAndUpdate({ _id: animeId }, { $inc: inc }, { upsert: true, returnDocument: "after" })
    : await g.d.collection<RatingStats & { _id: string }>("rating_stats").findOne({ _id: animeId });
  return reply(g, { rating: { ...summarize(stats), mine: score } });
}
