import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/** The link in the confirmation email: marks the signup confirmed and shows /subscribed. */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const t = url.searchParams.get("t") || "";
  const to = (q: string) => NextResponse.redirect(new URL(`/subscribed?${q}`, url), 303);
  if (!/^[A-Za-z0-9_-]{20,40}$/.test(t)) return to("ok=0");
  let d;
  try { d = await db(); } catch { return to("ok=0&retry=1"); }
  if (!d) return to("ok=0");
  const lead = await d.collection("leads").findOneAndUpdate(
    { token: t, status: { $in: ["pending", "confirmed"] } },
    [{ $set: { status: "confirmed", confirmedAt: { $ifNull: ["$confirmedAt", "$$NOW"] } } }],
    { returnDocument: "after" },
  );
  if (!lead) return to("ok=0");
  const q = new URLSearchParams({ ok: "1", k: String(lead.kind) });
  if (lead.animeTitle) q.set("a", String(lead.animeTitle).slice(0, 120));
  if (lead.kind === "cheatsheet" && typeof lead.page === "string") q.set("p", lead.page.replace(/\/preview$/, "/cheatsheet"));
  return to(q.toString());
}
