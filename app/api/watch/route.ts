import { NextResponse } from "next/server";
import { listAnime, getMappings } from "@/lib/kitsu";
import { tmdbConfigured, findTmdb, getProviders, providersFor } from "@/lib/tmdb";

/** Country from the host's geo header, then the browser language's region, then US. */
function detectCountry(req: Request): string {
  const h = req.headers;
  const geo = h.get("x-vercel-ip-country") || h.get("cf-ipcountry");
  if (geo && /^[A-Z]{2}$/.test(geo)) return geo;
  const m = (h.get("accept-language") || "").match(/[a-z]{2,3}-([A-Z]{2})\b/);
  return m ? m[1] : "US";
}

/** GET /api/watch?id=<kitsu id>[&country=XX] → providers for that country (TMDB / JustWatch). */
export async function GET(req: Request) {
  const url = new URL(req.url);
  const id = url.searchParams.get("id") || "";
  const param = (url.searchParams.get("country") || "").toUpperCase();
  if (!/^\d+$/.test(id)) return NextResponse.json({ error: "id required" }, { status: 400 });
  const explicit = /^[A-Z]{2}$/.test(param);
  const country = explicit ? param : detectCountry(req);
  // Responses that depend on request headers must not be shared through a CDN.
  const cache = explicit ? "public, max-age=0, s-maxage=21600, stale-while-revalidate=86400" : "private, no-store";
  if (!tmdbConfigured()) return NextResponse.json({ configured: false, country, detected: !explicit }, { headers: { "Cache-Control": cache } });

  const [{ items }, mappings] = await Promise.all([listAnime({ filter: { id }, limit: 1 }), getMappings(id)]);
  const a = items[0];
  const ref = a ? await findTmdb(a, mappings) : null;
  const payload = ref ? await getProviders(ref) : null;
  const { link, groups, countries } = providersFor(payload, country);
  return NextResponse.json({ configured: true, country, detected: !explicit, match: ref, link, groups, countries }, { headers: { "Cache-Control": cache } });
}
