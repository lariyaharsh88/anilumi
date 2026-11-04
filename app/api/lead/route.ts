import { randomBytes } from "node:crypto";
import { guard, reply } from "@/lib/guard";
import { normalizeEmail, isSource, isAnimeId, cleanText, LEAD_KINDS, type LeadKind } from "@/lib/community";
import { emailEnabled, sendMail } from "@/lib/email";
import { confirmMail, type LeadDoc } from "@/lib/emails";
import { listIdOf } from "@/lib/listid";
import { normalizeCode } from "@/lib/syncmerge";

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
  // List alerts follow the visitor's synced list (app/api/sync), named by its sync code.
  const code = kind === "list" ? normalizeCode(b.code) : null;
  if (kind === "list" && !code) return reply(g, { error: "Bad request" }, 400);
  const listId = code ? listIdOf(code) : null;
  if (listId && !(await g.d.collection("lists").countDocuments({ _id: listId as never }, { limit: 1 }))) {
    return reply(g, { error: "Your list isn't synced yet. Open My list and try again." }, 400);
  }
  const key = { email, kind, animeId };
  const now = new Date();
  const utm = Object.fromEntries(["utm_source", "utm_medium", "utm_campaign"].map((k) => [k, cleanText((b.utm as Record<string, unknown> | undefined)?.[k], 80)]).filter(([, v]) => v));
  const leads = g.d.collection("leads");
  // A visitor who unsubscribed and signs up again starts over as pending.
  await leads.updateOne({ ...key, status: "unsubscribed" }, { $set: { status: "pending" }, $unset: { confirmSentAt: "" } });
  // One list subscription per email. Pointing it at a different list needs a fresh confirmation, so nobody can
  // send someone else's alerts to their own list's shows.
  if (listId) await leads.updateOne({ ...key, listId: { $ne: listId } }, { $set: { listId, status: "pending" }, $unset: { confirmSentAt: "" } });
  await leads.updateOne(
    key,
    {
      $setOnInsert: { ...key, ...(listId ? { listId } : {}), status: "pending", token: randomBytes(18).toString("base64url"), createdAt: now, consentAt: now },
      $set: { animeTitle: cleanText(b.animeTitle, 200) || null, source: b.source, page: cleanText(b.page, 300), utm, updatedAt: now },
    },
    { upsert: true },
  );
  if (emailEnabled()) {
    // Claim the send first, so two quick submits don't send two emails.
    const lead = await leads.findOneAndUpdate(
      { ...key, status: "pending", $or: [{ confirmSentAt: { $exists: false } }, { confirmSentAt: { $lt: new Date(now.getTime() - RESEND_AFTER_MS) } }] },
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
