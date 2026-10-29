import { createHash, randomBytes } from "node:crypto";
import { guard, reply } from "@/lib/guard";
import { cleanDoc, formatCode, mergeLists, normalizeCode, type SyncDoc } from "@/lib/syncmerge";

/**
 * My list sync by private code (no accounts). Only a SHA-256 of the code is stored, so the database alone
 * can't be used to open anyone's list. Actions: create, pull, push (server-side merge), delete.
 */
type Stored = SyncDoc & { _id: string; rev: number; createdAt: Date; updatedAt: Date };
const idOf = (code: string) => createHash("sha256").update(`anilumi-sync:${code}`).digest("hex");
const MAX = 600_000; // ~3,000 shows

export async function POST(req: Request) {
  const g = await guard(req, "sync", 30, MAX);
  if (g instanceof Response) return g;
  const col = g.d.collection<Stored>("lists");
  const action = g.body.action;

  if (action === "create") {
    const doc = cleanDoc(g.body);
    if (!doc) return reply(g, { error: "Bad request" }, 400);
    const code = formatCode(randomBytes(16));
    const now = new Date();
    await col.insertOne({ _id: idOf(code), ...doc, rev: 1, createdAt: now, updatedAt: now });
    return reply(g, { code, rev: 1, ...doc });
  }

  const code = normalizeCode(g.body.code);
  if (!code) return reply(g, { error: "That doesn't look like a sync code. It has 16 letters and numbers, like K7QM-2XRA-9FHC-P4TB." }, 400);
  const _id = idOf(code);

  if (action === "delete") {
    await col.deleteOne({ _id });
    return reply(g, { ok: true });
  }

  if (action === "pull") {
    const doc = await col.findOne({ _id });
    if (!doc) return reply(g, { error: "No list uses that code. Check it, or turn sync on again to get a new one." }, 404);
    return reply(g, { code, rev: doc.rev, items: doc.items, removed: doc.removed });
  }

  if (action === "push") {
    const incoming = cleanDoc(g.body);
    if (!incoming) return reply(g, { error: "Bad request" }, 400);
    // Optimistic concurrency: merge into the stored copy and save only if nobody saved in between.
    for (let attempt = 0; attempt < 4; attempt++) {
      const cur = await col.findOne({ _id });
      if (!cur) return reply(g, { error: "This sync code was deleted on another device." }, 404);
      const merged = mergeLists(cur, incoming);
      const r = await col.updateOne({ _id, rev: cur.rev }, { $set: { items: merged.items, removed: merged.removed, updatedAt: new Date() }, $inc: { rev: 1 } });
      if (r.modifiedCount === 1) return reply(g, { code, rev: cur.rev + 1, ...merged });
    }
    return reply(g, { error: "Busy, try again." }, 409);
  }

  return reply(g, { error: "Bad request" }, 400);
}
