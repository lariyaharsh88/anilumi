/** Which commit is live (Render sets RENDER_GIT_COMMIT). Used by the cache-warming workflow to wait for a deploy. */
export const dynamic = "force-dynamic";
export function GET() {
  return Response.json({ commit: process.env.RENDER_GIT_COMMIT || null }, { headers: { "Cache-Control": "no-store" } });
}
