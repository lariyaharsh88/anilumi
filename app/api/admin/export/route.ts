import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import { toCsv } from "@/lib/community";

/** CSV download of email leads (?type=leads) or partner enquiries (?type=partners). Admin only. */
export async function GET(req: Request) {
  if (!(await isAdmin())) return new Response("Not found", { status: 404 });
  const d = await db();
  if (!d) return new Response("Database not configured", { status: 503 });
  const type = new URL(req.url).searchParams.get("type");
  const date = new Date().toISOString().slice(0, 10);
  let csv: string;
  if (type === "partners") {
    const rows = await d.collection("partner_leads").find().sort({ createdAt: -1 }).toArray();
    csv = toCsv(["created", "name", "email", "company", "website", "type", "budget", "message", "status"], rows.map((r) => [r.createdAt, r.name, r.email, r.company, r.website, r.type, r.budget, r.message, r.status]));
  } else {
    const rows = await d.collection("leads").find().sort({ createdAt: -1 }).toArray();
    csv = toCsv(["created", "email", "kind", "anime", "anime_id", "source", "status", "page", "utm_source", "utm_medium", "utm_campaign"], rows.map((r) => [r.createdAt, r.email, r.kind, r.animeTitle, r.animeId, r.source, r.status, r.page, r.utm?.utm_source, r.utm?.utm_medium, r.utm?.utm_campaign]));
  }
  return new Response(`﻿${csv}`, {
    headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="anilumi-${type === "partners" ? "partners" : "leads"}-${date}.csv"`, "Cache-Control": "private, no-store" },
  });
}
