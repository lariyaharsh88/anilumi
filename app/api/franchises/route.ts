import { NextResponse } from "next/server";
import { bingeFranchises } from "@/lib/franchiselist";

/** Every multi-part franchise for the home page's "Plan your binge" search, fetched when the box is first used. */
export const dynamic = "force-static";

export function GET() {
  return NextResponse.json({ franchises: bingeFranchises() }, { headers: { "Cache-Control": "public, max-age=3600, s-maxage=86400" } });
}
