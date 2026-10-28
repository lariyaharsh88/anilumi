import { db } from "@/lib/db";
import { json, readVid } from "@/lib/guard";
import { summarize, isAnimeId, REACTIONS, type RatingStats } from "@/lib/community";

/**
 * Counts for the community widgets on one page, plus this visitor's own picks:
 * ?anime=ID (rating + hype), &ep=N (reactions), or ?hype=ID,ID,… (hype counts for a list).
 */
export async function GET(req: Request) {
  const q = new URL(req.url).searchParams;
  let d;
  try { d = await db(); } catch { return json({ error: "Temporarily unavailable" }, 503); }
  if (!d) return json({ enabled: false });
  const vid = await readVid();
  const anime = q.get("anime");
  const ep = Number(q.get("ep"));
  const hypeIds = (q.get("hype") || "").split(",").filter(isAnimeId).slice(0, 120);
  const out: Record<string, unknown> = { enabled: true };

  if (isAnimeId(anime)) {
    const [stats, mine, hype, myHype] = await Promise.all([
      d.collection<RatingStats & { _id: string }>("rating_stats").findOne({ _id: anime }),
      vid ? d.collection("ratings").findOne({ animeId: anime, vid }, { projection: { score: 1 } }) : null,
      d.collection<{ _id: string; count: number }>("hype_stats").findOne({ _id: anime }),
      vid ? d.collection("hype").findOne({ animeId: anime, vid }, { projection: { _id: 1 } }) : null,
    ]);
    out.rating = { ...summarize(stats), mine: (mine?.score as number) ?? null };
    out.hype = { count: hype?.count || 0, mine: Boolean(myHype) };
    if (Number.isInteger(ep) && ep > 0) {
      const key = `${anime}:${ep}`;
      const [rs, myR] = await Promise.all([
        d.collection<{ _id: string; counts: Record<string, number> }>("reaction_stats").findOne({ _id: key }),
        vid ? d.collection("reactions").findOne({ key, vid }, { projection: { emoji: 1 } }) : null,
      ]);
      out.reactions = { counts: Object.fromEntries(REACTIONS.map((r) => [r.key, Math.max(0, rs?.counts?.[r.key] || 0)])), mine: (myR?.emoji as string) ?? null };
    }
  }
  if (hypeIds.length) {
    const [rows, mine] = await Promise.all([
      d.collection<{ _id: string; count: number }>("hype_stats").find({ _id: { $in: hypeIds } }).toArray(),
      vid ? d.collection("hype").find({ vid, animeId: { $in: hypeIds } }, { projection: { animeId: 1 } }).toArray() : [],
    ]);
    out.hypeList = { counts: Object.fromEntries(rows.map((r) => [r._id, r.count])), mine: mine.map((m) => m.animeId) };
  }
  return json(out);
}
