import { NextResponse } from "next/server";
import { listAnime, animePath } from "@/lib/kitsu";
import { abs } from "@/lib/site";

export const dynamic = "force-dynamic";

/** GET /random[?genre=slug] → 307 to a random title among the 500 most followed (in that genre). */
export async function GET(req: Request) {
  const genre = (new URL(req.url).searchParams.get("genre") || "").replace(/[^a-z0-9-]/g, "").slice(0, 40);
  const filter: Record<string, string> = genre ? { categories: genre } : {};
  const offset = Math.floor(Math.random() * 25) * 20; // 25 cached pages of 20, so this costs no fresh upstream call
  let page = await listAnime({ sort: "-userCount", limit: 20, offset, filter, revalidate: 86400 });
  if (!page.items.length) page = await listAnime({ sort: "-userCount", limit: 20, filter, revalidate: 86400 });
  const out = page.items.filter((a) => a.status !== "upcoming" && a.status !== "unreleased");
  const pick = out[Math.floor(Math.random() * out.length)] || page.items[0];
  const res = NextResponse.redirect(abs(pick ? animePath(pick) : "/top/popular"), 307);
  res.headers.set("Cache-Control", "no-store");
  res.headers.set("X-Robots-Tag", "noindex");
  return res;
}
