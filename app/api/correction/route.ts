import { guard, reply } from "@/lib/guard";
import { normalizeEmail, cleanText } from "@/lib/community";

/**
 * "Spotted a mistake?" reports and contact messages. Stored for the admin page; the email is optional and only
 * used to reply. Same guard as every community write (same-origin, honeypot, per-IP limit).
 */
export async function POST(req: Request) {
  const g = await guard(req, "correction", 3);
  if (g instanceof Response) return g;
  const b = g.body;
  const message = cleanText(b.message, 1500);
  const page = cleanText(b.page, 300);
  if (message.length < 10) return reply(g, { error: "Please describe the problem in a sentence or two." }, 400);
  if (!page.startsWith("/")) return reply(g, { error: "Bad request" }, 400);
  const email = b.email ? normalizeEmail(b.email) : null;
  if (b.email && !email) return reply(g, { error: "That email address doesn't look right (or leave it empty)." }, 400);
  await g.d.collection("corrections").insertOne({ page, message, email, kind: b.kind === "contact" ? "contact" : "correction", status: "new", createdAt: new Date() });
  return reply(g, { ok: true });
}
