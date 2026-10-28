import { guard, reply } from "@/lib/guard";
import { isAnimeId } from "@/lib/community";

/** Toggle "I'm hyped" for an upcoming anime. Titles for the /hype ranking come from Kitsu, never from the client. */
export async function POST(req: Request) {
  const g = await guard(req, "hype", 40);
  if (g instanceof Response) return g;
  const { animeId } = g.body;
  if (!isAnimeId(animeId)) return reply(g, { error: "Bad request" }, 400);
  const col = g.d.collection("hype");
  const del = await col.deleteOne({ animeId, vid: g.vid });
  const on = del.deletedCount === 0;
  if (on) await col.insertOne({ animeId, vid: g.vid, createdAt: new Date() });
  const s = await g.d.collection<{ _id: string; count: number }>("hype_stats").findOneAndUpdate(
    { _id: animeId },
    { $inc: { count: on ? 1 : -1 }, $set: { updatedAt: new Date() } },
    { upsert: true, returnDocument: "after" },
  );
  return reply(g, { hype: { count: Math.max(0, s?.count || 0), mine: on } });
}
