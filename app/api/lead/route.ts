import { randomBytes } from "node:crypto";
import { guard, reply } from "@/lib/guard";
import { normalizeEmail, isSource, isAnimeId, cleanText, LEAD_KINDS, type LeadKind } from "@/lib/community";

/**
 * Email signup from any lead CTA. Stored as "pending" until the visitor confirms by email (Phase B).
 * A repeat signup is accepted quietly, so the form never reveals whether an address is already listed.
 */
export async function POST(req: Request) {
  const g = await guard(req, "lead", 5);
  if (g instanceof Response) return g;
  const b = g.body;
  const email = normalizeEmail(b.email);
  const kind = b.kind as LeadKind;
  if (!email) return reply(g, { error: "Please enter a valid email address." }, 400);
  if (!LEAD_KINDS.includes(kind) || !isSource(b.source) || b.consent !== true) return reply(g, { error: "Bad request" }, 400);
  const animeId = isAnimeId(b.animeId) ? b.animeId : null;
  const now = new Date();
  const utm = Object.fromEntries(["utm_source", "utm_medium", "utm_campaign"].map((k) => [k, cleanText((b.utm as Record<string, unknown> | undefined)?.[k], 80)]).filter(([, v]) => v));
  await g.d.collection("leads").updateOne(
    { email, kind, animeId },
    {
      $setOnInsert: { email, kind, animeId, status: "pending", token: randomBytes(18).toString("base64url"), createdAt: now, consentAt: now },
      $set: { animeTitle: cleanText(b.animeTitle, 200) || null, source: b.source, page: cleanText(b.page, 300), utm, updatedAt: now },
    },
    { upsert: true },
  );
  return reply(g, { ok: true });
}
