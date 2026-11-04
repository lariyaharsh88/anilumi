import { NextResponse } from "next/server";
import { db } from "@/lib/db";

/**
 * Unsubscribe by the token in every email. Two callers: the form on /unsubscribe, and mail apps' own one-click
 * button (RFC 8058: a POST of "List-Unsubscribe=One-Click" to the List-Unsubscribe URL). The token is the only
 * credential, so there's no same-origin check. all=1 unsubscribes every list that address is on.
 */
export async function POST(req: Request) {
  const url = new URL(req.url);
  const form = await req.formData().catch(() => null);
  const t = String(form?.get("t") || url.searchParams.get("t") || "");
  const all = form?.get("all") === "1";
  const oneClick = form?.get("List-Unsubscribe") === "One-Click";
  if (!/^[A-Za-z0-9_-]{20,40}$/.test(t)) return oneClick ? new NextResponse(null, { status: 400 }) : NextResponse.redirect(new URL("/unsubscribe?done=0", url), 303);
  let d;
  try { d = await db(); } catch { return new NextResponse("Temporarily unavailable", { status: 503 }); }
  if (!d) return new NextResponse("Not available", { status: 404 });
  const leads = d.collection("leads");
  const lead = await leads.findOne({ token: t }, { projection: { email: 1 } });
  if (lead) {
    const set = { $set: { status: "unsubscribed", unsubscribedAt: new Date() } };
    if (all) await leads.updateMany({ email: lead.email }, set);
    else await leads.updateOne({ token: t }, set);
  }
  if (oneClick) return new NextResponse(null, { status: 200 });
  return NextResponse.redirect(new URL(`/unsubscribe?done=${lead ? 1 : 0}${all ? "&all=1" : ""}`, url), 303);
}
