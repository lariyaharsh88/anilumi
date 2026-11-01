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
 * The live build's commit, re-checked at most once a minute per Worker instance. It goes into page cache keys,
 * so a deploy starts a fresh cache by itself (old pages would point at JS chunks the new build no longer has).
 * Held in memory, not in the Cache API: the zone's cache rules override TTLs there (it stuck for a day). "0" if
 * unknown.
 */
let gen = { value: "0", at: 0 };
async function generation() {
  if (Date.now() - gen.at < 60_000) return gen.value;
  const value = await fetch(`${ORIGIN}/api/version`, { cf: { cacheTtl: 0 } })
    .then((r) => r.json())
    .then((j) => String(j.commit || "0").slice(0, 12))
    .catch(() => gen.value);
  gen = { value, at: Date.now() };
  return value;
}

/**
 * GET pages, assets and Next.js navigation payloads; never APIs or admin. A navigation (RSC) request is cached
 * only with its `_rsc` parameter, which Next.js derives from the headers that shape the payload (router state,
 * prefetch kind), so the full URL identifies it. Page HTML is only cached for plain requests without `_rsc`.
 */
function cacheable(request, url) {
  if (request.method !== "GET") return false;
  if (url.pathname.startsWith("/api/") || url.pathname.startsWith("/admin")) return false;
  const rscRequest = request.headers.has("rsc") || request.headers.has("next-router-prefetch");
  return rscRequest === url.searchParams.has("_rsc");
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

/**
 * Cache key for a navigation (RSC) request, or null for a page request. Next.js puts a hash of the visitor's
 * router state in `_rsc`, so every from→to pair got its own entry and clicks rarely hit the cache. This app has
 * only the root layout, so the payload for a page depends on the destination, the prefetch kind and how many
 * leading path segments the previous page shares (the payload starts below them). If a cached payload ever
 * didn't fit, Next.js falls back to a full page load, which is cached too.
 */
function rscKey(request, url) {
  if (!url.searchParams.has("_rsc")) return null;
  const params = new URLSearchParams(url.search);
  params.delete("_rsc");
  const to = url.pathname.split("/").filter(Boolean);
  let from = [];
  try { from = new URL(request.headers.get("referer") || "").pathname.split("/").filter(Boolean); } catch { /* none */ }
  let depth = 0;
  while (depth < to.length && depth < from.length && to[depth] === from[depth]) depth++;
  const kind = request.headers.get("next-router-prefetch") ? "p" : "n";
  const rest = params.toString();
  return `?__rsc=${kind}${depth}${rest ? `&${rest}` : ""}`;
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
    const genq = url.pathname.startsWith("/_next/static/") ? "" : `${url.search ? "&" : "?"}__gen=${await generation()}`;
    const key = new Request(`https://${SITE}${url.pathname}${rscKey(request, url) ?? url.search}${genq}`, { method: "GET" });
    const hit = await cache.match(key);
    if (hit) {
      const out = new Response(hit.body, hit);
      out.headers.set("x-edge-cache", "HIT");
      if (genq) out.headers.set("x-edge-gen", genq.slice(genq.indexOf("=") + 1));
      return out;
    }

    const res = await toOrigin(request, url);
    const out = new Response(res.body, res);
    out.headers.set("x-edge-cache", "MISS");
    if (genq) out.headers.set("x-edge-gen", genq.slice(genq.indexOf("=") + 1));
    // Pages only from the live build: mid-deploy, the old instance can still answer and would be cached as new.
    const build = res.headers.get("x-build");
    const sameBuild = !genq || !build || genq.endsWith(`=${build}`);
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
