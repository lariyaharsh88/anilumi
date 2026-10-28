import { guard, reply } from "@/lib/guard";
import { normalizeEmail, cleanText } from "@/lib/community";

const BUDGETS = ["", "Under $500", "$500–2,000", "$2,000–10,000", "$10,000+", "Not sure yet"];
const TYPES = ["", "Sponsorship / ads", "Affiliate partnership", "Merch or product placement", "Streaming / app promotion", "Other"];

/** Partner / advertising enquiry from /advertise. */
export async function POST(req: Request) {
  const g = await guard(req, "partner", 3);
  if (g instanceof Response) return g;
  const b = g.body;
  const email = normalizeEmail(b.email);
  const name = cleanText(b.name, 120);
  const message = cleanText(b.message, 3000);
  if (!email || !name || message.length < 10) return reply(g, { error: "Please add your name, a valid email and a short message." }, 400);
  if (b.consent !== true) return reply(g, { error: "Bad request" }, 400);
  await g.d.collection("partner_leads").insertOne({
    name, email, message,
    company: cleanText(b.company, 160),
    website: cleanText(b.site, 300),
    type: TYPES.includes(b.type as string) ? b.type : "",
    budget: BUDGETS.includes(b.budget as string) ? b.budget : "",
    status: "new",
    createdAt: new Date(),
  });
  return reply(g, { ok: true });
}
