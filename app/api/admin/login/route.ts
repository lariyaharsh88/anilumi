import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { ipHash, limited } from "@/lib/guard";
import { ADMIN_COOKIE, adminEnabled, checkPassword, sessionCookie } from "@/lib/admin";

/** Plain form post from /admin. Five attempts a minute per IP. */
export async function POST(req: Request) {
  if (!adminEnabled()) return new NextResponse("Not found", { status: 404 });
  const back = (q = "") => NextResponse.redirect(new URL(`/admin${q}`, req.url), 303);
  const d = await db().catch(() => null);
  if (d && (await limited(d, await ipHash(), "admin-login", 5))) return back("?e=slow");
  const pw = String((await req.formData()).get("password") || "");
  if (!checkPassword(pw)) return back("?e=wrong");
  const res = back();
  res.cookies.set(ADMIN_COOKIE, sessionCookie(), { httpOnly: true, sameSite: "strict", secure: process.env.NODE_ENV === "production", maxAge: 7 * 86400, path: "/" });
  return res;
}
