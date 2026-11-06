// AniLumi edge cache (Cloudflare Workers Free). Render hosts the app; Render serves custom domains through
// Cloudflare for SaaS, and a customer zone in front of that ("orange-to-orange") doesn't cache. So this Worker
// fetches from Render's own hostname and keeps pages in Cloudflare's cache itself, which keeps Render under its
// 5 GB/month free bandwidth. Pass-through only: ~1 ms of CPU per request.

import { dispatchDue } from "./schedule.js";

const ORIGIN = "https://anilumi.onrender.com";
const SITE = "anilumi.in";
// The app on Cloudflare Workers, through the service binding APP (edge/wrangler.toml) when configured: requests
// go to it directly, inside Cloudflare, addressed as anilumi.in. Without the binding the origin is Render.
let app = null;
const base = () => (app ? `https://${SITE}` : ORIGIN);
const upstream = (req) => (app ? app.fetch(req) : fetch(req));
// Pages that change through the day get an hour; everything else a day. Build assets have hashed names.
const FRESH = new Set(["/", "/schedule", "/tonight", "/birthdays", "/sitemap.xml", "/feed.xml", "/news", "/hype"]);
const DAY = 86400;
// Render free has 0.1 CPU: a dozen uncached pages at once take 5-12 s each, and Googlebot counts slow or failed
// fetches against the host ("server connectivity"). Past this budget a visitor gets the last good copy instead.
const ORIGIN_BUDGET_MS = 12_000;
const LAST_GOOD_TTL = 14 * DAY;
const CRAWLER = /googlebot|google-inspectiontool|googleother|adsbot-google|mediapartners-google|bingbot|duckduckbot|yandex|applebot|baiduspider/i;

function ttl(path) {
  if (path.startsWith("/_next/static/")) return 365 * DAY;
  if (FRESH.has(path) || path.startsWith("/season/") || path.startsWith("/news/")) return 3600;
  return DAY;
}

/**
 * The live build's commit, re-checked at most once a minute per Worker instance. It goes into page cache keys,
 * so a deploy starts a fresh cache by itself (old pages would point at JS chunks the new build no longer has).
 * Held in memory, not in the Cache API: the zone's cache rules override TTLs there (it stuck for a day). "0" if
 * unknown. Once known, the re-check runs in the background: Render can take seconds to answer, and no request,
 * cache hits included, should wait on it. Only a fresh instance waits, and at most 3 s.
 */
let gen = { value: "0", at: 0 };
let checking = null;
function refreshGeneration() {
  checking ??= upstream(new Request(`${base()}/api/version`, { cf: { cacheTtl: 0 }, signal: AbortSignal.timeout(3000) }))
    .then((r) => r.json())
    .then((j) => String(j.commit || "0").slice(0, 12))
    .catch(() => gen.value)
    // An unknown build ("0") caches nothing, so retry it after 10 s rather than a minute.
    .then((value) => { gen = { value, at: value === "0" ? Date.now() - 50_000 : Date.now() }; checking = null; return value; });
  return checking;
}
async function generation(ctx) {
  if (Date.now() - gen.at < 60_000) return gen.value;
  if (gen.value === "0") return refreshGeneration();
  ctx.waitUntil(refreshGeneration());
  return gen.value;
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

async function toOrigin(request, url, budgetMs = 0) {
  const init = new Request(base() + url.pathname + url.search, request);
  const headers = new Headers(init.headers);
  // The app rate-limits by the visitor's IP (first X-Forwarded-For entry).
  const ip = request.headers.get("cf-connecting-ip");
  if (ip) headers.set("x-forwarded-for", ip);
  const res = await upstream(new Request(init, { headers, redirect: "manual", ...(budgetMs ? { signal: AbortSignal.timeout(budgetMs) } : {}) }));
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
    app = env.APP || null;
    const url = new URL(request.url);
    if (url.hostname === `www.${SITE}`) {
      url.hostname = SITE;
      return Response.redirect(url.toString(), 301);
    }
    if (!cacheable(request, url)) return toOrigin(request, url);

    const cache = caches.default;
    // Hashed build assets never change; pages are keyed by the live build too.
    const genq = url.pathname.startsWith("/_next/static/") ? "" : `${url.search ? "&" : "?"}__gen=${await generation(ctx)}`;
    const key = new Request(`https://${SITE}${url.pathname}${rscKey(request, url) ?? url.search}${genq}`, { method: "GET" });
    const hit = await cache.match(key);
    if (hit) {
      const out = new Response(hit.body, hit);
      out.headers.set("x-edge-cache", "HIT");
      if (genq) out.headers.set("x-edge-gen", genq.slice(genq.indexOf("=") + 1));
      return out;
    }

    // Last good copy of a page, from any build: survives deploys, which otherwise send every crawler request to
    // Render at once. Only plain page HTML (an RSC payload from another build would make Next.js hard-reload).
    const lastKey = genq && !url.searchParams.has("_rsc") ? new Request(`https://${SITE}${url.pathname}${url.search}${url.search ? "&" : "?"}__last=1`, { method: "GET" }) : null;
    const last = lastKey ? await cache.match(lastKey) : null;
    const stale = (why) => {
      const out = new Response(last.body, last);
      out.headers.set("x-edge-cache", why);
      return out;
    };

    // Crawlers get the last good copy straight away; the current build's copy is fetched in the background. So does
    // everyone else when that copy is from the live build (its hour or day ran out, or this colo evicted the key):
    // same build, same JS chunks, so it's safe to show while the fresh one renders.
    const lastBuild = last?.headers.get("x-build");
    const sameBuild = Boolean(lastBuild) && genq.endsWith(`=${lastBuild}`);
    if (last && (sameBuild || CRAWLER.test(request.headers.get("user-agent") || ""))) {
      ctx.waitUntil(toOrigin(request, url, 30_000).then((res) => store(res, url, genq, key, lastKey)).catch(() => {}));
      return stale("STALE");
    }

    let res;
    try {
      res = await toOrigin(request, url, last ? ORIGIN_BUDGET_MS : 0); // no fallback: wait as long as the app needs
    } catch {
      // Timed out or unreachable: the last good copy, else a retryable 503 (never a hung connection).
      if (last) return stale("STALE-TIMEOUT");
      return new Response("AniLumi is busy, please retry in a minute.", { status: 503, headers: { "retry-after": "60", "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" } });
    }
    // Render's own Cloudflare sometimes challenges our requests ("Just a moment…", 403/429 + cf-mitigated). That
    // page is useless to visitors and crawlers alike: treat it as the origin being down.
    const blocked = res.headers.get("cf-mitigated") === "challenge" || res.status === 429 || res.status === 403;
    if ((res.status >= 500 || blocked) && last) return stale(blocked ? "STALE-BLOCKED" : "STALE-ERROR");
    if (blocked) {
      return new Response("AniLumi is busy, please retry in a few minutes.", { status: 503, headers: { "retry-after": "300", "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-edge-cache": "ORIGIN-BLOCKED" } });
    }
    if (res.status >= 500) {
      // No copy to fall back on: say "temporarily unavailable, retry" (503 + Retry-After), which crawlers treat as
      // transient, rather than passing on a 500.
      const out = new Response(res.body, { status: 503, headers: new Headers(res.headers) });
      out.headers.set("retry-after", "300");
      out.headers.set("cache-control", "no-store");
      out.headers.set("x-edge-cache", `ORIGIN-${res.status}`);
      return out;
    }

    const out = new Response(res.body, res);
    out.headers.set("x-edge-cache", "MISS");
    if (genq) out.headers.set("x-edge-gen", genq.slice(genq.indexOf("=") + 1));
    ctx.waitUntil(store(out, url, genq, key, lastKey));
    return out;
  },

  // Cron triggers (edge/wrangler.toml): start the GitHub workflows on time (edge/schedule.js).
  async scheduled(event, env, ctx) {
    ctx.waitUntil(dispatchDue(env, new Date(event.scheduledTime)));
  },
};

/** Cache a 200 page from the live build under its build key, and as the page's last good copy. Resolves when stored. */
async function store(res, url, genq, key, lastKey) {
  // Pages only from the live build: mid-deploy, the old instance can still answer and would be cached as new.
  const build = res.headers.get("x-build");
  const sameBuild = !genq || !build || genq.endsWith(`=${build}`);
  if (res.status !== 200 || res.headers.has("set-cookie") || !sameBuild) return;
  const puts = [];
  const stored = new Response(res.clone().body, res); // own copy: headers from fetch() are immutable
  stored.headers.set("cache-control", `public, max-age=${ttl(url.pathname)}`);
  stored.headers.delete("vary"); // the key already excludes RSC requests; Vary would split or block caching
  stored.headers.delete("x-edge-cache");
  puts.push(caches.default.put(key, stored));
  if (lastKey) {
    const kept = new Response(res.clone().body, res);
    kept.headers.set("cache-control", `public, max-age=${LAST_GOOD_TTL}`);
    kept.headers.delete("vary");
    kept.headers.delete("x-edge-cache");
    puts.push(caches.default.put(lastKey, kept));
  }
  await Promise.all(puts);
}

