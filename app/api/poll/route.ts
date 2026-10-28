import { db } from "@/lib/db";
import { guard, reply, json, readVid } from "@/lib/guard";
import { POLLS } from "@/data/polls";

type Stats = { _id: string; counts: Record<string, number> };
const tally = (p: (typeof POLLS)[number], s: Stats | null) => p.options.map((_, i) => Math.max(0, s?.counts?.[i] || 0));

/** Poll results and this visitor's vote: ?id=… */
export async function GET(req: Request) {
  const p = POLLS.find((x) => x.id === new URL(req.url).searchParams.get("id"));
  if (!p) return json({ error: "Not found" }, 404);
  let d;
  try { d = await db(); } catch { return json({ error: "Temporarily unavailable" }, 503); }
  if (!d) return json({ enabled: false });
  const vid = await readVid();
  const [s, mine] = await Promise.all([
    d.collection<Stats>("poll_stats").findOne({ _id: p.id }),
    vid ? d.collection("poll_votes").findOne({ pollId: p.id, vid }) : null,
  ]);
  return json({ enabled: true, counts: tally(p, s), mine: (mine?.option as number) ?? null });
}

/** Vote once per poll; you can change your answer. */
export async function POST(req: Request) {
  const g = await guard(req, "poll", 20);
  if (g instanceof Response) return g;
  const p = POLLS.find((x) => x.id === g.body.pollId);
  const option = g.body.option;
  if (!p || !Number.isInteger(option) || (option as number) < 0 || (option as number) >= p.options.length) return reply(g, { error: "Bad request" }, 400);
  const prev = await g.d.collection("poll_votes").findOneAndUpdate({ pollId: p.id, vid: g.vid }, { $set: { option, at: new Date() } }, { upsert: true, returnDocument: "before" });
  const inc: Record<string, number> = {};
  if (prev?.option !== option) {
    inc[`counts.${option}`] = 1;
    if (prev) inc[`counts.${prev.option}`] = -1;
  }
  const s = Object.keys(inc).length
    ? await g.d.collection<Stats>("poll_stats").findOneAndUpdate({ _id: p.id }, { $inc: inc }, { upsert: true, returnDocument: "after" })
    : await g.d.collection<Stats>("poll_stats").findOne({ _id: p.id });
  return reply(g, { counts: tally(p, s), mine: option });
}
