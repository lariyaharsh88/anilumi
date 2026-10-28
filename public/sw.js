/* AniLumi service worker: makes the site installable and keeps My list (and recently viewed pages) usable offline.
 * Pages: network first, falling back to the last copy, then /offline. Hashed build files: cache first.
 * Posters: cache first, capped low (Kitsu sends no CORS headers, so they are opaque and browsers count each
 * one generously against storage quota). Nothing else (API calls, analytics, other sites) is touched. */
const VERSION = "v1";
const PAGES = `pages-${VERSION}`, STATIC = `static-${VERSION}`, IMG = `img-${VERSION}`;
const PRECACHE = ["/my", "/offline"];
const IMG_HOSTS = ["media.kitsu.app", "media.kitsu.io", "s4.anilist.co"];

async function trim(name, max) {
  const c = await caches.open(name);
  const keys = await c.keys();
  for (const k of keys.slice(0, Math.max(0, keys.length - max))) await c.delete(k);
}

self.addEventListener("install", (e) => {
  e.waitUntil((async () => {
    const pages = await caches.open(PAGES), statics = await caches.open(STATIC);
    for (const url of PRECACHE) {
      const res = await fetch(url, { cache: "no-cache" });
      if (!res.ok) continue;
      // Also fetch the page's own scripts and styles, so it can start without a network.
      const html = await res.clone().text();
      const assets = [...new Set(html.match(/\/_next\/static\/[^"'\s)]+/g) || [])];
      await pages.put(url, res);
      await Promise.all(assets.map((a) => statics.add(a).catch(() => {})));
    }
    await self.skipWaiting();
  })());
});

self.addEventListener("activate", (e) => {
  e.waitUntil((async () => {
    for (const k of await caches.keys()) if (![PAGES, STATIC, IMG].includes(k)) await caches.delete(k);
    await self.clients.claim();
  })());
});

self.addEventListener("fetch", (e) => {
  const req = e.request;
  if (req.method !== "GET") return;
  const url = new URL(req.url);

  if (url.origin === location.origin && req.mode === "navigate") {
    e.respondWith((async () => {
      try {
        const res = await fetch(req);
        if (res.ok && !url.search) {
          const c = await caches.open(PAGES);
          await c.put(url.pathname, res.clone());
          trim(PAGES, 60);
        }
        return res;
      } catch {
        return (await caches.match(url.pathname, { cacheName: PAGES })) || (await caches.match("/offline", { cacheName: PAGES })) || Response.error();
      }
    })());
    return;
  }

  if (url.origin === location.origin && url.pathname.startsWith("/_next/static/")) {
    e.respondWith((async () => {
      const hit = await caches.match(req, { cacheName: STATIC });
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok) { const c = await caches.open(STATIC); await c.put(req, res.clone()); trim(STATIC, 400); }
      return res;
    })());
    return;
  }

  if (req.destination === "image" && IMG_HOSTS.includes(url.hostname)) {
    e.respondWith((async () => {
      const hit = await caches.match(req, { cacheName: IMG });
      if (hit) return hit;
      const res = await fetch(req);
      if (res.ok || res.type === "opaque") { const c = await caches.open(IMG); await c.put(req, res.clone()); trim(IMG, 80); }
      return res;
    })());
  }
});
