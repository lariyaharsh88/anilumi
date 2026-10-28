/**
 * /admin access: one shared password (ADMIN_TOKEN, set in Render). The cookie holds an HMAC of it rather
 * than the password itself, and comparisons are constant-time. Admin is off entirely without ADMIN_TOKEN.
 */
import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "al_admin";
export const adminEnabled = () => (process.env.ADMIN_TOKEN || "").length >= 12;

const session = () => createHmac("sha256", process.env.ADMIN_TOKEN || "").update("anilumi-admin-v1").digest("hex");

function same(a: string, b: string): boolean {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && timingSafeEqual(x, y);
}

export const checkPassword = (pw: string) => adminEnabled() && same(pw, process.env.ADMIN_TOKEN!);
export const sessionCookie = () => session();

export async function isAdmin(): Promise<boolean> {
  if (!adminEnabled()) return false;
  const c = (await cookies()).get(ADMIN_COOKIE)?.value || "";
  return same(c, session());
}
