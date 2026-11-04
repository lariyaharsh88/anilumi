import { randomBytes } from "node:crypto";
import { guard, reply } from "@/lib/guard";
import { normalizeEmail, isSource, isAnimeId, cleanText, LEAD_KINDS, type LeadKind } from "@/lib/community";
import { emailEnabled, sendMail } from "@/lib/email";
import { confirmMail, type LeadDoc } from "@/lib/emails";

/** A repeat signup re-sends the confirmation at most this often. */
const RESEND_AFTER_MS = 10 * 60_000;

/**
 * Email signup from any lead CTA. Stored as "pending" and sent a confirmation link (double opt-in, through
 * Resend); nothing else is emailed until it's used. A repeat signup is accepted quietly, so the form never
 * reveals whether an address is already listed.
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
  const leads = g.d.collection("leads");
  // A visitor who unsubscribed and signs up again starts over as pending.
  await leads.updateOne({ email, kind, animeId, status: "unsubscribed" }, { $set: { status: "pending" }, $unset: { confirmSentAt: "" } });
  await leads.updateOne(
    { email, kind, animeId },
    {
      $setOnInsert: { email, kind, animeId, status: "pending", token: randomBytes(18).toString("base64url"), createdAt: now, consentAt: now },
      $set: { animeTitle: cleanText(b.animeTitle, 200) || null, source: b.source, page: cleanText(b.page, 300), utm, updatedAt: now },
    },
    { upsert: true },
  );
  if (emailEnabled()) {
    // Claim the send first, so two quick submits don't send two emails.
    const lead = await leads.findOneAndUpdate(
      { email, kind, animeId, status: "pending", $or: [{ confirmSentAt: { $exists: false } }, { confirmSentAt: { $lt: new Date(now.getTime() - RESEND_AFTER_MS) } }] },
      { $set: { confirmSentAt: now } },
      { returnDocument: "after" },
    );
    if (lead) {
      const r = await sendMail(confirmMail(lead as unknown as LeadDoc));
      if (!r.ok) {
        console.error("[lead] confirmation email failed:", r.error);
        await leads.updateOne({ _id: lead._id }, { $unset: { confirmSentAt: "" } });
      }
    }
  }
  return reply(g, { ok: true, confirm: emailEnabled() });
}
