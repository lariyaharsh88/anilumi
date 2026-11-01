// AniLumi edge cache (Cloudflare Workers Free). Render hosts the app; Render serves custom domains through
// Cloudflare for SaaS, and a customer zone in front of that ("orange-to-orange") doesn't cache. So this Worker
// fetches from Render's own hostname and keeps pages in Cloudflare's cache itself, which keeps Render under its
// 5 GB/month free bandwidth. Pass-through only: ~1 ms of CPU per request.

const ORIGIN = "https://anilumi.onrender.com";
const SITE = "anilumi.in";
// Pages that change through the day get an hour; everything else a day. Build assets have hashed names.
const FRESH = new Set(["/", "/schedule", "/tonight", "/birthdays", "/sitemap.xml", "/feed.xml", "/news", "/hype"]);
const DAY = 86400;

function ttl(path) {
  if (path.startsWith("/_next/static/")) return 365 * DAY;
  if (FRESH.has(path) || path.startsWith("/season/") || path.startsWith("/news/")) return 3600;
  return DAY;
}

/**
 * The live build's commit, cached for a minute per location. It goes into page cache keys, so a deploy starts a
 * fresh cache by itself (old pages would point at JS chunks the new build no longer has). "0" if unknown.
 */
async function generation(ctx) {
  const cache = caches.default;
  const key = new Request(`https://${SITE}/__edge/generation`);
  const hit = await cache.match(key);
  if (hit) return hit.text();
  const commit = await fetch(`${ORIGIN}/api/version`)
    .then((r) => r.json())
    .then((j) => String(j.commit || "0").slice(0, 12))
    .catch(() => "0");
  ctx.waitUntil(cache.put(key, new Response(commit, { headers: { "cache-control": "public, max-age=60" } })));
  return commit;
}

/** GET page/asset requests only: never APIs, admin, or Next.js client navigation payloads (RSC). */
function cacheable(request, url) {
  if (request.method !== "GET") return false;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin")) return false;
  if (url.searchParams.has("_rsc") || request.headers.has("rsc") || request.headers.has("next-router-prefetch")) return false;
  return true;
}

async function toOrigin(request, url) {
  const init = new Request(ORIGIN + url.pathname + url.search, request);
  const headers = new Headers(init.headers);
  // The app rate-limits by the visitor's IP (first X-Forwarded-For entry).
  const ip = request.headers.get("cf-connecting-ip");
  if (ip) headers.set("x-forwarded-for", ip);
  const res = await fetch(new Request(init, { headers, redirect: "manual" }));
  const location = res.headers.get("location");
  if (location && location.startsWith(ORIGIN)) {
    const out = new Response(res.body, res);
    out.headers.set("location", `https://${SITE}${location.slice(ORIGIN.length)}`);
    return out;
  }
  return res;
}

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.hostname === `www.${SITE}`) {
      url.hostname = SITE;
      return Response.redirect(url.toString(), 301);
    }
    if (!cacheable(request, url)) return toOrigin(request, url);

    const cache = caches.default;
    // Hashed build assets never change; pages are keyed by the live build too.
    const gen = url.pathname.startsWith("/_next/static/") ? "" : `${url.search ? "&" : "?"}__gen=${await generation(ctx)}`;
    const key = new Request(`https://${SITE}${url.pathname}${url.search}${gen}`, { method: "GET" });
    const hit = await cache.match(key);
    if (hit) {
      const out = new Response(hit.body, hit);
      out.headers.set("x-edge-cache", "HIT");
      if (gen) out.headers.set("x-edge-gen", gen.slice(gen.indexOf("=") + 1));
      return out;
    }

    const res = await toOrigin(request, url);
    const out = new Response(res.body, res);
    out.headers.set("x-edge-cache", "MISS");
    if (gen) out.headers.set("x-edge-gen", gen.slice(gen.indexOf("=") + 1));
    // Pages only from the live build: mid-deploy, the old instance can still answer and would be cached as new.
    const build = res.headers.get("x-build");
    const sameBuild = !gen || !build || gen.endsWith(`=${build}`);
    if (res.status === 200 && !res.headers.has("set-cookie") && sameBuild) {
      const stored = out.clone();
      stored.headers.set("cache-control", `public, max-age=${ttl(url.pathname)}`);
      stored.headers.delete("vary"); // the key already excludes RSC requests; Vary would split or block caching
      stored.headers.delete("x-edge-cache");
      ctx.waitUntil(cache.put(key, stored));
    }
    return out;
  },
};
