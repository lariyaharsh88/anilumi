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
// One shared last good copy of each page for search engines, from any build (R2, under last/, overwritten in place, so
// bounded by the number of real pages; no lifecycle rule). Googlebot asks for long-tail pages a few times a month from
// whichever data centre, so the per-colo last copy and the per-build R2 copy were almost never there: each crawl was a
// full render, 2.4 s on average for HTML on 21 Nov 2026 (Search Console crawl stats), and Google crawls slow sites less.
const SHARED_PREFIX = "last/";
// Pages that change through the day get an hour; everything else a day. Build assets have hashed names.
const FRESH = new Set(["/", "/schedule", "/tonight", "/birthdays", "/sitemap.xml", "/feed.xml", "/news", "/hype"]);
const DAY = 86400;
// Served (and refreshed in the background past the page's TTL) for up to 90 days, so a page Google crawled once stays
// fast even if it comes back rarely (30 days sent those visits back to a full render).
const SHARED_MAX_AGE = 90 * DAY;
// Render free has 0.1 CPU: a dozen uncached pages at once take 5-12 s each, and Googlebot counts slow or failed
// fetches against the host ("server connectivity"). Past this budget a visitor gets the last good copy instead.
const ORIGIN_BUDGET_MS = 12_000;
const LAST_GOOD_TTL = 14 * DAY;
// With no copy to fall back on, how long a request waits for a render before getting a retryable 503 (the render
// carries on and is cached). Googlebot gives up at about 30 s; most renders take 2-7 s.
const NO_COPY_BUDGET_MS = 20_000;
let noCopyBudget = NO_COPY_BUDGET_MS; // env.NO_COPY_BUDGET_MS overrides it (tests)
// Generated Open Graph / Twitter cards. Their URLs carry a hash of the image route (`?6cf9…`), so they need no
// build in their key: they survive deploys, which would otherwise re-render every card.
const CARD = /\/(opengraph|twitter)-image(-[\w-]+)?$/;
// Routes with `revalidate = 604800` in the app (characters, watch orders, cast lists), and long-tail pages whose
// data changes monthly at most (people, birthdays, similar, an anime's guide subpages): a week here, not a day.
// Crawlers walk these by the thousand; each day of cache saved a re-render of every one (Workers CPU, Nov 2026).
const WEEKLY = /^\/(character\/[^/]+|watch-order\/[^/]+|staff\/[^/]+|voice-actor\/[^/]+|hindi-voice-artist\/[^/]+|similar\/[^/]+|birthdays\/[^/]+\/[^/]+|anime\/[^/]+\/(cast|characters|how-long-to-watch|parents-guide|openings-endings|manga|filler-list))\/?$/;
// Campaign and click tags: the page is the same with or without them, and analytics reads them from the visitor's
// address bar, not the server. Kept in the cache key, every tagged link (a channel post's utm_source=telegram) was a
// cold page of its own with no copy to fall back on, so link previews waited on a full render and often gave up.
const TRACKING = /^(utm_[a-z]+|fbclid|gclid|gbraid|wbraid|msclkid|igshid|mc_cid|mc_eid)$/i;
/**
 * Query parameters some page reads (server searchParams, next.config rewrites, RandomPicker's ?pick). A URL with any
 * other parameter still reaches the app but isn't cached here or in R2, so random ?x=1, ?x=2… can't fill the cache.
 */
const KNOWN_PARAMS = new Set(["_rsc", "a", "all", "b", "country", "done", "e", "genre", "id", "ids", "k", "max", "min", "minutes", "ok", "p", "page", "pick", "preset", "q", "retry", "s", "sort", "t", "title", "type", "u", "user"]);
/** Whether every parameter in `search` is one a page reads. Pure. */
export const knownSearch = (search) => [...new URLSearchParams(search).keys()].every((k) => KNOWN_PARAMS.has(k));
/** Search engines whose crawl rate follows our response time: they get, and keep, the shared last copy. */
const SEARCH_BOT = /googlebot|google-inspectiontool|bingbot/i;
export const isSearchBot = (ua) => SEARCH_BOT.test(ua || "");
/** scripts/warm-cache.mjs */
const WARMER = /AniLumi cache warmer/;
const CRAWLER = /googlebot|google-inspectiontool|googleother|adsbot-google|mediapartners-google|bingbot|duckduckbot|yandex|applebot|baiduspider|oai-searchbot|chatgpt-user|perplexitybot|claude-searchbot|claude-user|petalbot/i;

function ttl(path) {
  if (path.startsWith("/_next/static/")) return 365 * DAY;
  if (CARD.test(path)) return 7 * DAY; // the image routes' own revalidate
  if (WEEKLY.test(path)) return 7 * DAY; // pages whose own revalidate is a week: a day here only re-asked the app
  if (FRESH.has(path) || path.startsWith("/news/")) return 3600;
  if (path.startsWith("/season/")) return 6 * 3600; // the app re-renders season lists every 6 hours
  return DAY;
}

/**
 * The live build's commit, re-checked at most every 10 minutes per Worker instance (once a minute was ~100k app
 * invocations a day, for a value that changes with a release every 2 days), from a static file the app serves free. It goes into page cache keys,
 * so a deploy starts a fresh cache by itself (old pages would point at JS chunks the new build no longer has).
 * Held in memory, not in the Cache API: the zone's cache rules override TTLs there (it stuck for a day). "0" if
 * unknown. Once known, the re-check runs in the background: Render can take seconds to answer, and no request,
 * cache hits included, should wait on it. Only a fresh instance waits, and at most 3 s.
 */
const GEN_CHECK_MS = 10 * 60_000;
let gen = { value: "0", at: 0 };
let checking = null;
function refreshGeneration() {
  // /version.json is a static asset (no app CPU); /api/version for a build from before it existed.
  const ask = (path) => upstream(new Request(`${base()}${path}`, { cf: { cacheTtl: 0 }, signal: AbortSignal.timeout(3000) }));
  checking ??= ask("/version.json")
    .then((r) => (r.ok ? r : ask("/api/version")))
    .then((r) => r.json())
    .then((j) => String(j.commit || "0").slice(0, 12))
    .catch(() => gen.value)
    // An unknown build ("0") caches nothing, so retry it after 10 s rather than waiting the full interval.
    .then((value) => { gen = { value, at: value === "0" ? Date.now() - GEN_CHECK_MS + 10_000 : Date.now() }; checking = null; return value; });
  return checking;
}
async function generation(ctx) {
  if (Date.now() - gen.at < GEN_CHECK_MS) return gen.value;
  if (gen.value === "0") return refreshGeneration();
  ctx.waitUntil(refreshGeneration());
  return gen.value;
}

/**
 * GET pages, assets and Next.js navigation payloads; never APIs or admin. A navigation (RSC) request is cached
 * only with its `_rsc` parameter, which Next.js derives from the headers that shape the payload (router state,
 * prefetch kind), so the full URL identifies it. Page HTML is only cached for plain requests without `_rsc`.
 */
/** `search` without tracking tags, in the original order; "" when nothing else is left. Pure. */
export function cleanSearch(search) {
  const params = new URLSearchParams(search);
  for (const k of [...params.keys()]) if (TRACKING.test(k)) params.delete(k);
  const rest = params.toString();
  return rest ? `?${rest}` : "";
}

/** The path as the app will route it: "/%61dmin" is /admin. Pure. */
function routedPath(pathname) {
  try { return decodeURIComponent(pathname).toLowerCase(); } catch { return pathname.toLowerCase(); }
}

function cacheable(request, url) {
  if (request.method !== "GET") return false;
  const path = routedPath(url.pathname);
  if (path.startsWith("/api/") || path.startsWith("/admin")) return false;
  // A signed-in admin sees lead emails; whatever URL they open, their copy must never become everyone's.
  if (/(?:^|;\s*)al_admin=/.test(request.headers.get("cookie") || "")) return false;
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

/** The Hindi guides (/hi, /hi/…) are Hindi pages under a root layout that says lang="en" for the whole app. */
export const isHindiPath = (pathname) => pathname === "/hi" || pathname.startsWith("/hi/");

/** Hindi pages: lang="hi" on <html> and a Content-Language header, so search engines don't read them as English. */
function localize(res, url) {
  if (!isHindiPath(url.pathname) || !(res.headers.get("content-type") || "").includes("text/html")) return res;
  const out = new HTMLRewriter().on("html", { element: (el) => el.setAttribute("lang", "hi") }).transform(res);
  const headers = new Headers(out.headers);
  headers.set("content-language", "hi");
  return new Response(out.body, { status: out.status, statusText: out.statusText, headers });
}

export default {
  async fetch(request, env, ctx) {
    return localize(await handle(request, env, ctx), new URL(request.url));
  },

  // Cron triggers (edge/wrangler.toml): start the GitHub workflows on time (edge/schedule.js).
  async scheduled(event, env, ctx) {
    ctx.waitUntil(dispatchDue(env, new Date(event.scheduledTime)));
  },
};

async function handle(request, env, ctx) {
  app = env.APP || null;
  pages = env.PAGES || null;
  noCopyBudget = Number(env.NO_COPY_BUDGET_MS) || NO_COPY_BUDGET_MS;
  const url = new URL(request.url);
  if (url.hostname === `www.${SITE}`) {
    url.hostname = SITE;
    return Response.redirect(url.toString(), 301);
  }
  // Two API calls answered here, without waking the app (each wake-up costs a cold start; 27 Nov sample: /api/search
  // ~780 ms of CPU, /api/geo ~80 ms, on every search and every new visitor).
  if (request.method === "GET" && url.pathname === "/api/geo") return geoAnswer(request);
  if (request.method === "GET" && url.pathname === "/api/search") return cachedSearch(request, url, ctx);
  if (!cacheable(request, url)) return toOrigin(request, url);
  // From here on, a tagged link is the same page as the untagged one: one cache entry, one render.
  if (url.search) url.search = cleanSearch(url.search);
  // Preview images carry a version hash (opengraph-image?d53d2c13…) and build files their own: both are cached as is.
  if (url.search && !CARD.test(url.pathname) && !url.pathname.startsWith("/_next/") && !knownSearch(url.search)) return toOrigin(request, url);

  // The warm-up's link pass (scripts/warm-cache.mjs, x-warm-mode: shared) only needs a search engines' copy to exist.
  if (WARMER.test(request.headers.get("user-agent") || "") && request.headers.get("x-warm-mode") === "shared") {
    const done = await warmSharedCopy(url, ctx);
    if (done) return done;
  }
  // Search engines straight to their copy of the page: no wait for the live build's number (on a fresh Worker
  // instance that was an app call of up to a second, and Googlebot's sparse requests nearly always land on one) and
  // no R2 lookup of the build copy. The build check and any refresh happen after the answer is sent.
  const fast = await searchBotCopy(request, url, ctx);
  if (fast) return fast;

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
    if (!fresh) { const ua = request.headers.get("user-agent") || ""; ctx.waitUntil(toOrigin(request, url, 30_000).then((res) => store(res, url, genq, key, lastKeyFor(url, genq), !CRAWLER.test(ua), isSearchBot(ua))).catch(() => {})); }
    const out = new Response(global.response.body, global.response);
    out.headers.set("x-edge-cache", fresh ? "GLOBAL-HIT" : "GLOBAL-STALE");
    if (genq) out.headers.set("x-edge-gen", genq.slice(genq.indexOf("=") + 1));
    return out;
  }

  // Last good copy of a page, from any build: survives deploys, which otherwise send every crawler request to
  // Render at once. Only plain page HTML (an RSC payload from another build would make Next.js hard-reload).
  const lastKey = lastKeyFor(url, genq);
  const ua = request.headers.get("user-agent") || "";
  const search = isSearchBot(ua);
  // The post-release warm-up's renders replace the search engines' shared copies too, so Googlebot's first visit
  // after a release already gets the new build's page.
  const shareRender = search || WARMER.test(ua);
  let last = lastKey ? await cache.match(lastKey) : null;
  // Nothing in this data centre: a search engine gets the shared copy (any build, up to 30 days old), kept here too.
  let shared = false;
  if (!last && search && lastKey) {
    last = await sharedMatch(lastKey);
    if (last) { shared = true; ctx.waitUntil(cache.put(lastKey, withMaxAge(last.clone(), LAST_GOOD_TTL)).catch(() => {})); }
  }
  const stale = (why) => {
    const out = new Response(last.body, last);
    out.headers.set("x-edge-cache", shared ? `${why}-SHARED` : why);
    return out;
  };

  // Crawlers get the last good copy straight away; the current build's copy is fetched in the background. So does
  // everyone else when that copy is from the live build (its hour or day ran out, or this colo evicted the key):
  // same build, same JS chunks, so it's safe to show while the fresh one renders.
  // Global (R2) copies are paid per write and only save a render when another data centre asks for the same page:
  // visitors' popular pages do, crawlers' long tail (each page once per TTL) mostly doesn't. Copies only for visitors.
  const crawler = CRAWLER.test(ua);
  const lastBuild = last?.headers.get("x-build");
  const sameBuild = Boolean(lastBuild) && genq.endsWith(`=${lastBuild}`);
  if (last && (sameBuild || crawler)) {
    // Re-render in the background only once the copy is past its TTL. Every hit used to, so after each release
    // every crawler request still cost a render (most of the Workers CPU bill, Nov 2026).
    if (copyAge(last) > ttl(url.pathname)) ctx.waitUntil(toOrigin(request, url, 30_000).then((res) => store(res, url, genq, key, lastKey, !crawler, shareRender)).catch(() => {}));
    return stale("STALE");
  }

  let res;
  try {
    if (last) res = await toOrigin(request, url, ORIGIN_BUDGET_MS);
    else {
      // No copy to fall back on: wait up to NO_COPY_BUDGET_MS, then answer "retry soon" while the render goes on in
      // the background and is cached for the next request. Before, a render stuck on a slow upstream held the
      // connection for minutes (Googlebot logged "page could not be reached" and slowed its crawl, Nov 2026).
      const render = toOrigin(request, url);
      const timer = new Promise((r) => setTimeout(() => r(null), noCopyBudget));
      res = await Promise.race([render, timer]);
      if (!res) {
        ctx.waitUntil(render.then((r) => store(r, url, genq, key, lastKey, !crawler, shareRender)).catch(() => {}));
        return new Response("AniLumi is busy, please retry in a minute.", { status: 503, headers: { "retry-after": "60", "content-type": "text/plain; charset=utf-8", "cache-control": "no-store", "x-edge-cache": "ORIGIN-SLOW" } });
      }
    }
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
  ctx.waitUntil(store(out, url, genq, key, lastKey, !crawler, shareRender));
  return out;
}

/**
 * For Googlebot and Bingbot on a page (not build files, cards or navigation payloads): the page's last good copy
 * (this data centre, else the shared R2 one), or null to take the normal path. Search engines' crawl rate follows
 * response time, and this answers from cache without first learning the live build. Afterwards, in the background:
 * a copy from an older build is replaced by the current build's global copy when the warm-up made one (no render),
 * else re-rendered; a current copy is re-rendered only past its TTL, as before.
 */
async function searchBotCopy(request, url, ctx) {
  const ua = request.headers.get("user-agent") || "";
  if (!isSearchBot(ua) || url.pathname.startsWith("/_next/") || CARD.test(url.pathname) || url.searchParams.has("_rsc")) return null;
  const lastKey = lastKeyFor(url, "?__gen=any"); // the last-copy key doesn't depend on the build
  if (!lastKey) return null;
  const cache = caches.default;
  let last = await cache.match(lastKey);
  let shared = false;
  if (!last) {
    last = await sharedMatch(lastKey);
    if (!last) return null;
    shared = true;
    ctx.waitUntil(cache.put(lastKey, withMaxAge(last.clone(), LAST_GOOD_TTL)).catch(() => {}));
  }
  const copyBuild = last.headers.get("x-build");
  const expired = copyAge(last) > ttl(url.pathname);
  ctx.waitUntil((async () => {
    const g = await generation(ctx);
    if (g === "0") return;
    const genq = `${url.search ? "&" : "?"}__gen=${g}`;
    const key = new Request(`https://${SITE}${url.pathname}${url.search}${genq}`, { method: "GET" });
    if (copyBuild && copyBuild !== g) {
      const global = await globalMatch(key);
      if (global) return refreshLastCopy(global.response, lastKey, global.uploaded);
    } else if (!expired) return;
    const res = await toOrigin(request, url, 30_000);
    await store(res, url, genq, key, lastKey, false, true);
  })().catch(() => {}));
  const out = new Response(last.body, last);
  out.headers.set("x-edge-cache", shared ? "STALE-SHARED" : "STALE");
  return out;
}

/**
 * The warm-up's link pass: 204 when the page already has a search engines' copy within its TTL, or when the live
 * build's global copy could be made into one (no render). Null means render it (the normal path; the warm-up's
 * renders become the shared copy).
 */
async function warmSharedCopy(url, ctx) {
  const lastKey = lastKeyFor(url, "?__gen=any");
  if (!lastKey || !pages) return null;
  const done = (why) => new Response(null, { status: 204, headers: { "x-edge-cache": why } });
  const shared = await sharedMatch(lastKey);
  if (shared && copyAge(shared) <= ttl(url.pathname)) { await shared.body?.cancel?.(); return done("SHARED-FRESH"); }
  await shared?.body?.cancel?.();
  const g = await generation(ctx);
  if (g === "0") return null;
  const key = new Request(`https://${SITE}${url.pathname}${url.search}${url.search ? "&" : "?"}__gen=${g}`, { method: "GET" });
  // This data centre's copy of the live build (cached within its TTL), else the global one.
  const local = await caches.default.match(key);
  if (local) { await refreshLastCopy(local, lastKey, Date.now()); return done("SHARED-FROM-LOCAL"); }
  const global = await globalMatch(key);
  if (!global || Date.now() - global.uploaded > ttl(url.pathname) * 1000) { await global?.response.body?.cancel?.(); return null; }
  await refreshLastCopy(global.response, lastKey, global.uploaded);
  return done("SHARED-FROM-GLOBAL");
}

/** Make a page from the current build (an R2 build copy) the last good copy, here and shared. */
async function refreshLastCopy(res, lastKey, storedAt) {
  if (!(res.headers.get("content-type") || "").includes("text/html")) return;
  const kept = new Response(res.clone().body, res);
  kept.headers.set("cache-control", `public, max-age=${LAST_GOOD_TTL}`);
  kept.headers.set("x-stored-at", String(storedAt));
  await Promise.all([caches.default.put(lastKey, kept), pages ? storeShared(res, lastKey) : null].map((p) => Promise.resolve(p).catch(() => {})));
}

/** The visitor's country for the consent banner, as /api/geo answers it (app/api/geo/route.ts), from Cloudflare's
 *  own geolocation: no app call. */
function geoAnswer(request) {
  const c = request.headers.get("cf-ipcountry") || request.cf?.country || null;
  const country = c && /^[A-Z]{2}$/.test(c) && c !== "XX" && c !== "T1" ? c : null;
  return new Response(JSON.stringify({ c: country }), { headers: { "content-type": "application/json", "cache-control": "private, no-store" } });
}

const SEARCH_TTL = 3600; // the route's own s-maxage
/** Search results by query, cached in this data centre for an hour (the route marks them public for that long).
 *  The query is trimmed and lower-cased for the key, so "Naruto" and "naruto " share one entry. Pure lookups only. */
export function searchKey(url) {
  const sp = new URLSearchParams(url.search);
  const out = new URLSearchParams();
  for (const k of ["q", "limit", "anime"]) {
    const v = sp.get(k);
    if (v != null) out.set(k, k === "q" ? v.trim().toLowerCase().replace(/\s+/g, " ") : v);
  }
  out.sort();
  return `https://${SITE}/__edge/search?${out}`;
}
async function cachedSearch(request, url, ctx) {
  const key = new Request(searchKey(url), { method: "GET" });
  const hit = await caches.default.match(key);
  if (hit) { const out = new Response(hit.body, hit); out.headers.set("x-edge-cache", "HIT"); return out; }
  const res = await toOrigin(request, url);
  if (res.status === 200 && !res.headers.has("set-cookie")) {
    const body = await res.clone().text();
    // An empty answer may be a lookup that failed upstream; keep it only briefly so a real result shows soon.
    const ttl = body.includes('"items":[]') ? 300 : SEARCH_TTL;
    const stored = new Response(body, res);
    stored.headers.set("cache-control", `public, max-age=${ttl}`);
    stored.headers.delete("vary");
    ctx.waitUntil(caches.default.put(key, stored).catch(() => {}));
  }
  const out = new Response(res.body, res);
  out.headers.set("x-edge-cache", "MISS");
  return out;
}

/** Seconds since a last-good copy was stored (x-stored-at); copies from before the stamp count as expired. Pure. */
export function copyAge(res, now = Date.now()) {
  const at = Number(res.headers.get("x-stored-at"));
  return at > 0 ? (now - at) / 1000 : Infinity;
}

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

const sharedKey = (lastKey) => SHARED_PREFIX + lastKey.url.slice(`https://${SITE}/`.length);

/** Whether a shared copy uploaded at `uploadedMs` may still be served to a search engine. Pure. */
export const sharedUsable = (uploadedMs, now = Date.now()) => now - uploadedMs < SHARED_MAX_AGE * 1000;

/** The shared last copy of a page, stamped with its upload time (x-stored-at), or null (none, too old, no R2). */
async function sharedMatch(lastKey) {
  if (!pages) return null;
  try {
    const obj = await pages.get(sharedKey(lastKey));
    if (!obj) return null;
    if (!sharedUsable(obj.uploaded.getTime())) { await obj.body?.cancel?.(); return null; }
    const headers = new Headers(JSON.parse(obj.customMetadata?.h || "{}"));
    headers.set("x-stored-at", String(obj.uploaded.getTime()));
    return new Response(obj.body, { status: 200, headers });
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

async function storeShared(res, lastKey) {
  const h = [...res.headers].filter(([name]) => !DROP.has(name));
  const meta = JSON.stringify(h);
  if (meta.length > 1800) return;
  await pages.put(sharedKey(lastKey), await res.arrayBuffer(), { customMetadata: { h: meta } });
}

/**
 * Cache a 200 page from the live build under its build key (here, and globally when `global`), and as the page's
 * last good copy.
 */
async function store(res, url, genq, key, lastKey, global = true, shared = false) {
  // A page that's gone: drop its last copies, or search engines would keep getting it.
  if ((res.status === 404 || res.status === 410) && lastKey) {
    await Promise.all([caches.default.delete(lastKey), caches.default.delete(key), pages ? pages.delete(sharedKey(lastKey)) : null, pages ? pages.delete(r2Key(key)) : null].map((p) => Promise.resolve(p).catch(() => {})));
    return;
  }
  // Pages only from the live build: mid-deploy, the old instance can still answer and would be cached as new.
  const build = res.headers.get("x-build");
  const sameBuild = !genq || !build || genq.endsWith(`=${build}`);
  if (res.status !== 200 || res.headers.has("set-cookie") || !sameBuild) return;
  const puts = [];
  // A search engine's render becomes the shared last copy (a few writes a day: Googlebot asks for ~70 pages).
  if (pages && shared && lastKey && (res.headers.get("content-type") || "").includes("text/html")) puts.push(storeShared(res.clone(), lastKey).catch((err) => console.error("r2 shared store failed", lastKey.url, String(err))));
  // Build assets stay out of R2: the app serves them from static assets, which costs no Worker time.
  if (pages && global && !url.pathname.startsWith("/_next/static/")) puts.push(storeGlobal(res.clone(), key).catch((err) => console.error("r2 store failed", key.url, String(err))));
  const stored = new Response(res.clone().body, res); // own copy: headers from fetch() are immutable
  stored.headers.set("cache-control", `public, max-age=${ttl(url.pathname)}`);
  stored.headers.delete("vary"); // the key already excludes RSC requests; Vary would split or block caching
  stored.headers.delete("x-edge-cache");
  puts.push(caches.default.put(key, stored));
  if (lastKey) {
    const kept = new Response(res.clone().body, res);
    kept.headers.set("cache-control", `public, max-age=${LAST_GOOD_TTL}`);
    kept.headers.set("x-stored-at", String(Date.now()));
    kept.headers.delete("vary");
    kept.headers.delete("x-edge-cache");
    puts.push(caches.default.put(lastKey, kept));
  }
  await Promise.all(puts);
}

