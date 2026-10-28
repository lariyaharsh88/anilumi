/**
 * Shared checks for every community/lead write endpoint: database on, same-origin, small JSON body,
 * honeypot empty, per-IP rate limit. Also hands out the anonymous visitor id cookie (al_vid). Server-only.
 * IPs are never stored: only a SHA-256 of the IP with a daily-rotating salt, kept for a few minutes.
 */
import "server-only";
import { createHash, randomUUID } from "node:crypto";
import { cookies, headers } from "next/headers";
import { NextResponse } from "next/server";
import type { Db } from "mongodb";
import { db } from "./db";
import { site } from "./site";

export const VID_COOKIE = "al_vid";
const MAX_BODY = 4096;

export const json = (body: unknown, status = 200) => NextResponse.json(body, { status, headers: { "Cache-Control": "private, no-store" } });

export async function ipHash(): Promise<string> {
  const h = await headers();
  const ip = (h.get("x-forwarded-for") || "").split(",")[0].trim() || h.get("x-real-ip") || "local";
  const salt = `${process.env.IP_SALT || process.env.ADMIN_TOKEN || "anilumi"}:${new Date().toISOString().slice(0, 10)}`;
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

/** The visitor's anonymous id, if the browser already has one. */
export async function readVid(): Promise<string | null> {
  const v = (await cookies()).get(VID_COOKIE)?.value;
  return v && /^[a-f0-9-]{36}$/.test(v) ? v : null;
}

/** Same site only: blocks other sites from posting votes or signups through a visitor's browser. */
async function sameOrigin(): Promise<boolean> {
  const h = await headers();
  const origin = h.get("origin");
  if (!origin) return false;
  const host = new URL(origin).host;
  return host === new URL(site.url).host || host === h.get("host") || (process.env.NODE_ENV !== "production" && /^localhost(:\d+)?$/.test(host));
}

/** Fixed-window counter per IP hash, route and minute; documents expire on their own (TTL index). */
export async function limited(d: Db, ip: string, route: string, perMinute: number): Promise<boolean> {
  const minute = Math.floor(Date.now() / 60000);
  const r = await d.collection<{ _id: string; n: number; expiresAt: Date }>("rate_limits").findOneAndUpdate(
    { _id: `${ip}:${route}:${minute}` },
    { $inc: { n: 1 }, $setOnInsert: { expiresAt: new Date((minute + 2) * 60000) } },
    { upsert: true, returnDocument: "after" },
  );
  return (r?.n || 0) > perMinute;
}

export type Guarded = { d: Db; body: Record<string, unknown>; vid: string; newVid: boolean; ip: string };

/**
 * Run the checks; returns either the parsed request context or an error response to send as-is.
 * `website` is a honeypot field: hidden from people, filled in by bots.
 */
export async function guard(req: Request, route: string, perMinute: number): Promise<Guarded | Response> {
  let d: Db | null;
  try { d = await db(); } catch { return json({ error: "Temporarily unavailable" }, 503); }
  if (!d) return json({ error: "Not available" }, 404);
  if (!(await sameOrigin())) return json({ error: "Forbidden" }, 403);
  const text = await req.text();
  if (text.length > MAX_BODY) return json({ error: "Too large" }, 413);
  let body: Record<string, unknown>;
  try { body = JSON.parse(text || "{}"); } catch { return json({ error: "Bad request" }, 400); }
  if (typeof body !== "object" || body === null || Array.isArray(body)) return json({ error: "Bad request" }, 400);
  const ip = await ipHash();
  if (body.website) return json({ ok: true }); // bot: pretend it worked
  if (await limited(d, ip, route, perMinute)) return json({ error: "Too many requests, try again in a minute" }, 429);
  const existing = await readVid();
  return { d, body, vid: existing || randomUUID(), newVid: !existing, ip };
}

/** JSON response that also sets the visitor cookie when this request created one. */
export function reply(g: Guarded, body: unknown, status = 200): NextResponse {
  const res = json(body, status);
  if (g.newVid) res.cookies.set(VID_COOKIE, g.vid, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", maxAge: 60 * 60 * 24 * 365, path: "/" });
  return res;
}
