import { guard, reply } from "@/lib/guard";
import { isAnimeId, isEpisode, isReaction, REACTIONS } from "@/lib/community";

/** React to an episode with one emoji; picking another moves your reaction, picking the same one removes it. */
export async function POST(req: Request) {
  const g = await guard(req, "react", 30);
  if (g instanceof Response) return g;
  const { animeId, ep, emoji } = g.body;
  if (!isAnimeId(animeId) || !isEpisode(ep) || !isReaction(emoji)) return reply(g, { error: "Bad request" }, 400);
  const key = `${animeId}:${ep}`;
  const col = g.d.collection("reactions");
  const prev = await col.findOne({ key, vid: g.vid });
  const inc: Record<string, number> = {};
  let mine: string | null = emoji;
  if (prev?.emoji === emoji) {
    await col.deleteOne({ _id: prev._id });
    inc[`counts.${emoji}`] = -1;
    mine = null;
  } else {
    await col.updateOne({ key, vid: g.vid }, { $set: { emoji, animeId, ep, updatedAt: new Date() } }, { upsert: true });
    inc[`counts.${emoji}`] = 1;
    if (prev?.emoji) inc[`counts.${prev.emoji}`] = -1;
  }
  const s = await g.d.collection<{ _id: string; counts: Record<string, number> }>("reaction_stats").findOneAndUpdate({ _id: key }, { $inc: inc }, { upsert: true, returnDocument: "after" });
  return reply(g, { reactions: { counts: Object.fromEntries(REACTIONS.map((r) => [r.key, Math.max(0, s?.counts?.[r.key] || 0)])), mine } });
}
