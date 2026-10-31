/** Which commit is live (BUILD_COMMIT, baked in at build), plus the last AniList failure. Used by the cache-warming workflow to wait for a deploy. */
import { anilistHealth } from "@/lib/anilist";

export const dynamic = "force-dynamic";
export function GET() {
  return Response.json({ commit: process.env.BUILD_COMMIT || process.env.RENDER_GIT_COMMIT || null, anilist: anilistHealth }, { headers: { "Cache-Control": "no-store" } });
}
