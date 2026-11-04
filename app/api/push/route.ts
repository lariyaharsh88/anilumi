import { createHash } from "node:crypto";
import { guard, reply } from "@/lib/guard";
import { cleanSub, isTopic, MAX_TOPICS } from "@/lib/push";

/**
 * Turn one push alert on or off for this browser: { sub: PushSubscription JSON, topic, on }. One document per
 * subscription (keyed by a hash of its endpoint) with the topics it follows; scripts/send-alerts.mts sends them.
 */
export async function POST(req: Request) {
  const g = await guard(req, "push", 20);
  if (g instanceof Response) return g;
  const sub = cleanSub(g.body.sub);
  const topic = g.body.topic;
  if (!sub || !isTopic(topic) || typeof g.body.on !== "boolean") return reply(g, { error: "Bad request" }, 400);
  const _id = createHash("sha256").update(sub.endpoint).digest("hex").slice(0, 40);
  const subs = g.d.collection<{ _id: string; topics: string[] }>("push_subs");
  const now = new Date();
  if (g.body.on) {
    const cur = await subs.findOne({ _id }, { projection: { topics: 1 } });
    if (cur && cur.topics.length >= MAX_TOPICS && !cur.topics.includes(topic)) return reply(g, { error: `You can follow up to ${MAX_TOPICS} alerts.` }, 400);
    await subs.updateOne({ _id }, { $set: { endpoint: sub.endpoint, keys: sub.keys, updatedAt: now }, $setOnInsert: { createdAt: now }, $addToSet: { topics: topic } }, { upsert: true });
  } else {
    await subs.updateOne({ _id }, { $pull: { topics: topic }, $set: { updatedAt: now } });
  }
  return reply(g, { ok: true });
}
