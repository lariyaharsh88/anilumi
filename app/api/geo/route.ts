import { NextResponse } from "next/server";

/**
 * The visitor's country from Cloudflare (cf-ipcountry, passed through the edge Worker), for the analytics
 * consent banner (components/Analytics.tsx). Never cached; the browser remembers the answer for 30 days.
 */
export async function GET(req: Request) {
  let c = req.headers.get("cf-ipcountry");
  if (!c) {
    try {
      const { getCloudflareContext } = await import("@opennextjs/cloudflare");
      c = ((await getCloudflareContext({ async: true })).cf as { country?: string } | undefined)?.country ?? null;
    } catch { /* not on Workers (local dev) */ }
  }
  const country = c && /^[A-Z]{2}$/.test(c) && c !== "XX" && c !== "T1" ? c : null;
  return NextResponse.json({ c: country }, { headers: { "Cache-Control": "private, no-store" } });
}
