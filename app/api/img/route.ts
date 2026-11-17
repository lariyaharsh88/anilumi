/**
 * Same-origin image proxy for canvas exports (tier lists, Wrapped cards). Kitsu's CDN sends no CORS
 * headers, so drawing its posters would taint the canvas. Only known poster hosts are allowed.
 */
const HOSTS = new Set(["media.kitsu.app", "media.kitsu.io", "s4.anilist.co"]);

export async function GET(req: Request) {
  const raw = new URL(req.url).searchParams.get("u") || "";
  let u: URL;
  try { u = new URL(raw); } catch { return new Response("Bad url", { status: 400 }); }
  if (u.protocol !== "https:" || !HOSTS.has(u.hostname)) return new Response("Host not allowed", { status: 400 });
  const res = await fetch(u, { next: { revalidate: 86400 * 7 } }).catch(() => null);
  const type = res?.headers.get("content-type") || "";
  // Raster images only: an SVG served from anilumi.in could run script on the site.
  if (!res?.ok || !type.startsWith("image/") || type.includes("svg")) return new Response("Not found", { status: 404 });
  return new Response(res.body, { headers: { "Content-Type": type, "Cache-Control": "public, max-age=604800, s-maxage=2592000, immutable", "X-Robots-Tag": "noindex", "X-Content-Type-Options": "nosniff", "Content-Security-Policy": "default-src 'none'; sandbox" } });
}
