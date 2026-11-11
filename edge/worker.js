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
// Global copy of every cached page in R2 (binding PAGES, edge/wrangler.toml). caches.default is per data centre, so
// with visitors and crawlers spread over dozens of them nearly every request reached the app; R2 is one store for
// all of them, so a page renders once per build (or per TTL), wherever it is asked for. Optional: without the
// binding the edge works as before.
let pages = null;
const R2_PREFIX = "edge/";
// Pages that change through the day get an hour; everything else a day. Build assets have hashed names.
const FRESH = new Set(["/", "/schedule", "/tonight", "/birthdays", "/sitemap.xml", "/feed.xml", "/news", "/hype"]);
const DAY = 86400;
// Render free has 0.1 CPU: a dozen uncached pages at once take 5-12 s each, and Googlebot counts slow or failed
// fetches against the host ("server connectivity"). Past this budget a visitor gets the last good copy instead.
const ORIGIN_BUDGET_MS = 12_000;
const LAST_GOOD_TTL = 14 * DAY;
// Generated Open Graph / Twitter cards. Their URLs carry a hash of the image route (`?6cf9…`), so they need no
// build in their key: they survive deploys, which would otherwise re-render every card.
const CARD = /\/(opengraph|twitter)-image(-[\w-]+)?$/;
// Routes with `revalidate = 604800` in the app (characters, watch orders, cast lists): no data on them changes daily.
const WEEKLY = /^\/(character\/[^/]+|watch-order\/[^/]+|anime\/[^/]+\/(cast|characters))\/?$/;
const CRAWLER = /googlebot|google-inspectiontool|googleother|adsbot-google|mediapartners-google|bingbot|duckduckbot|yandex|applebot|baiduspider/i;

function ttl(path) {
  if (path.startsWith("/_next/static/")) return 365 * DAY;
  if (CARD.test(path)) return 7 * DAY; // the image routes' own revalidate
  if (WEEKLY.test(path)) return 7 * DAY; // pages whose own revalidate is a week: a day here only re-asked the app
  if (FRESH.has(path) || path.startsWith("/news/")) return 3600;
  if (path.startsWith("/season/")) return 6 * 3600; // the app re-renders season lists every 6 hours
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
    pages = env.PAGES || null;
    const url = new URL(request.url);
    if (url.hostname === `www.${SITE}`) {
      url.hostname = SITE;
      return Response.redirect(url.toString(), 301);
    }
    if (!cacheable(request, url)) return toOrigin(request, url);

    const cache = caches.default;
    // Hashed build assets and cards never change; pages are keyed by the live build too.
    const genq = url.pathname.startsWith("/_next/static/") || CARD.test(url.pathname) ? "" : `${url.search ? "&" : "?"}__gen=${await generation(ctx)}`;
    const key = new Request(`https://${SITE}${url.pathname}${rscKey(request, url) ?? url.search}${genq}`, { method: "GET" });
    const hit = await cache.match(key);
    if (hit) {
      const out = new Response(hit.body, hit);
      out.headers.set("x-edge-cache", "HIT");
      if (genq) out.headers.set("x-edge-gen", genq.slice(genq.indexOf("=") + 1));
      return out;
    }

    // Not in this data centre: the global copy, if another one has it. Within its TTL it is served as a hit; past
    // it, it is still from the live build (the key says so), so it is served while a fresh one renders.
    const global = url.pathname.startsWith("/_next/static/") ? null : await globalMatch(key);
    if (global) {
      const age = (Date.now() - global.uploaded) / 1000;
      const fresh = age < ttl(url.pathname);
      // Keep it here too: for the rest of its TTL, or a minute when stale so this colo refreshes it at most that often.
      ctx.waitUntil(cache.put(key, withMaxAge(global.response.clone(), fresh ? Math.ceil(ttl(url.pathname) - age) : 60)));
      if (!fresh) ctx.waitUntil(toOrigin(request, url, 30_000).then((res) => store(res, url, genq, key, lastKeyFor(url, genq))).catch(() => {}));
      const out = new Response(global.response.body, global.response);
      out.headers.set("x-edge-cache", fresh ? "GLOBAL-HIT" : "GLOBAL-STALE");
      if (genq) out.headers.set("x-edge-gen", genq.slice(genq.indexOf("=") + 1));
      return out;
    }

    // Last good copy of a page, from any build: survives deploys, which otherwise send every crawler request to
    // Render at once. Only plain page HTML (an RSC payload from another build would make Next.js hard-reload).
    const lastKey = lastKeyFor(url, genq);
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

function lastKeyFor(url, genq) {
  if (!genq || url.searchParams.has("_rsc")) return null;
  return new Request(`https://${SITE}${url.pathname}${url.search}${url.search ? "&" : "?"}__last=1`, { method: "GET" });
}

function withMaxAge(res, seconds) {
  const out = new Response(res.body, res);
  out.headers.set("cache-control", `public, max-age=${seconds}`);
  return out;
}

// Headers kept with a global copy (R2 custom metadata, 2 KB in all): the page's own, not per-response ones.
const DROP = new Set(["date", "cache-control", "vary", "set-cookie", "content-length", "content-encoding", "etag", "nel", "report-to", "server", "cf-ray", "cf-placement", "alt-svc", "x-opennext-cache", "x-edge-cache", "x-edge-gen"]);
const r2Key = (key) => R2_PREFIX + key.url.slice(`https://${SITE}/`.length);

/** The global copy of a cache key, with when it was stored, or null (none, no binding, or R2 unreachable). */
async function globalMatch(key) {
  if (!pages) return null;
  try {
    const obj = await pages.get(r2Key(key));
    if (!obj) return null;
    const headers = new Headers(JSON.parse(obj.customMetadata?.h || "{}"));
    return { response: new Response(obj.body, { status: 200, headers }), uploaded: obj.uploaded.getTime() };
  } catch {
    return null;
  }
}

async function storeGlobal(res, key) {
  const h = [...res.headers].filter(([name]) => !DROP.has(name));
  const meta = JSON.stringify(h);
  if (meta.length > 1800) return; // over R2's metadata limit: this colo's copy will do
  const body = await res.arrayBuffer(); // R2 needs a known length
  await pages.put(r2Key(key), body, { customMetadata: { h: meta } });
}

/** Cache a 200 page from the live build under its build key (here and globally), and as the page's last good copy. */
async function store(res, url, genq, key, lastKey) {
  // Pages only from the live build: mid-deploy, the old instance can still answer and would be cached as new.
  const build = res.headers.get("x-build");
  const sameBuild = !genq || !build || genq.endsWith(`=${build}`);
  if (res.status !== 200 || res.headers.has("set-cookie") || !sameBuild) return;
  const puts = [];
  // Build assets stay out of R2: the app serves them from static assets, which costs no Worker time.
  if (pages && !url.pathname.startsWith("/_next/static/")) puts.push(storeGlobal(res.clone(), key).catch((err) => console.error("r2 store failed", key.url, String(err))));
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

