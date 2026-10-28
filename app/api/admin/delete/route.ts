import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin";

/** Delete one lead or enquiry (spam, or a data-deletion request). Admin only, same-site form post. */
export async function POST(req: Request) {
  if (!(await isAdmin())) return new NextResponse("Not found", { status: 404 });
  const f = await req.formData();
  const id = String(f.get("id") || "");
  const col = f.get("type") === "partner" ? "partner_leads" : "leads";
  const d = await db();
  if (d && ObjectId.isValid(id)) await d.collection(col).deleteOne({ _id: new ObjectId(id) });
  return NextResponse.redirect(new URL("/admin", req.url), 303);
}
