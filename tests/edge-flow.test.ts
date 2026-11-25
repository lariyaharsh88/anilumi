import { test } from "node:test";
import assert from "node:assert/strict";
import worker from "../edge/worker.js";

/**
 * The edge Worker's request flow with stand-ins for the data-centre cache, R2 and the app (service binding):
 * search engines get their copy without waiting on the app, and a render with no copy to fall back on can't hold
 * the connection past the budget.
 */
const BUILD = "b2b2b2b2b2b2";
const OLD = "a1a1a1a1a1a1";

function fakeCache() {
  const m = new Map<string, { body: ArrayBuffer; init: ResponseInit }>();
  return {
    m,
    async match(req: Request) { const e = m.get(req.url); return e ? new Response(e.body.slice(0), e.init) : undefined; },
    async put(req: Request, res: Response) { m.set(req.url, { body: await res.arrayBuffer(), init: { status: res.status, headers: new Headers(res.headers) } }); },
    async delete(req: Request) { return m.delete(req.url); },
  };
}

function fakeR2() {
  const m = new Map<string, { body: ArrayBuffer; meta: Record<string, string>; uploaded: Date }>();
  return {
    m,
    async get(k: string) { const e = m.get(k); return e ? { body: new Response(e.body.slice(0)).body, customMetadata: e.meta, uploaded: e.uploaded } : null; },
    async put(k: string, body: ArrayBuffer, opts: { customMetadata: Record<string, string> }) { m.set(k, { body, meta: opts.customMetadata, uploaded: new Date() }); },
    async delete(k: string) { m.delete(k); },
    text(k: string) { const e = m.get(k); return e ? new TextDecoder().decode(e.body) : null; },
  };
}

const html = (body: string, build: string) => new Response(body, { status: 200, headers: { "content-type": "text/html; charset=utf-8", "x-build": build } });
const meta = (build: string) => ({ h: JSON.stringify([["content-type", "text/html; charset=utf-8"], ["x-build", build]]) });
const GOOGLEBOT = "Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)";

function setup(renderMs = 0) {
  const cache = fakeCache();
  (globalThis as unknown as { caches: unknown }).caches = { default: cache };
  const r2 = fakeR2();
  let renders = 0;
  const APP = {
    async fetch(req: Request) {
      const path = new URL(req.url).pathname;
      if (path === "/version.json") return new Response(JSON.stringify({ commit: BUILD }), { headers: { "content-type": "application/json" } });
      renders++;
      if (renderMs) await new Promise((r) => setTimeout(r, renderMs));
      return html(`fresh ${path}`, BUILD);
    },
  };
  const pending: Promise<unknown>[] = [];
  const ctx = { waitUntil: (p: Promise<unknown>) => { pending.push(p); } };
  const flush = async () => { while (pending.length) await Promise.allSettled(pending.splice(0)); };
  return { cache, r2, ctx, flush, renders: () => renders, env: { APP, PAGES: r2, NO_COPY_BUDGET_MS: "100" } };
}

test("Googlebot gets the shared copy at once; an old build's copy is then replaced from the warm-up's copy, no render", async () => {
  const s = setup();
  await s.r2.put("last/anime/some-show?__last=1", new TextEncoder().encode("old page").buffer as ArrayBuffer, { customMetadata: meta(OLD) });
  await s.r2.put(`edge/anime/some-show?__gen=${BUILD}`, new TextEncoder().encode("new page").buffer as ArrayBuffer, { customMetadata: meta(BUILD) });
  const res = await worker.fetch(new Request("https://anilumi.in/anime/some-show", { headers: { "user-agent": GOOGLEBOT } }), s.env, s.ctx);
  assert.equal(res.headers.get("x-edge-cache"), "STALE-SHARED");
  assert.equal(await res.text(), "old page");
  await s.flush();
  assert.equal(s.r2.text("last/anime/some-show?__last=1"), "new page");
  assert.equal(s.renders(), 0);
});

test("a render with no copy to fall back on answers 503 within the budget, then is cached for the next request", async () => {
  const s = setup(400);
  const t = Date.now();
  const res = await worker.fetch(new Request("https://anilumi.in/anime/slow-show", { headers: { "user-agent": "Mozilla/5.0 Safari/605.1.15", "sec-fetch-mode": "navigate" } }), s.env, s.ctx);
  assert.ok(Date.now() - t < 350, `waited ${Date.now() - t} ms`);
  assert.equal(res.status, 503);
  assert.equal(res.headers.get("x-edge-cache"), "ORIGIN-SLOW");
  await s.flush();
  const again = await worker.fetch(new Request("https://anilumi.in/anime/slow-show", { headers: { "user-agent": "Mozilla/5.0 Safari/605.1.15" } }), s.env, s.ctx);
  assert.equal(again.headers.get("x-edge-cache"), "HIT");
  assert.equal(await again.text(), "fresh /anime/slow-show");
  assert.equal(s.renders(), 1);
});

test("the warm-up's render becomes the search engines' shared copy", async () => {
  const s = setup();
  const res = await worker.fetch(new Request("https://anilumi.in/anime/warm-me", { headers: { "user-agent": "AniLumi cache warmer" } }), s.env, s.ctx);
  assert.equal(res.headers.get("x-edge-cache"), "MISS");
  await s.flush();
  assert.equal(s.r2.text("last/anime/warm-me?__last=1"), "fresh /anime/warm-me");
});

test("Googlebot on a current, unexpired copy: served, nothing re-rendered", async () => {
  const s = setup();
  await s.r2.put("last/anime/fresh-show?__last=1", new TextEncoder().encode("current page").buffer as ArrayBuffer, { customMetadata: meta(BUILD) });
  const res = await worker.fetch(new Request("https://anilumi.in/anime/fresh-show", { headers: { "user-agent": GOOGLEBOT } }), s.env, s.ctx);
  assert.equal(await res.text(), "current page");
  await s.flush();
  assert.equal(s.renders(), 0);
});

test("warm-up link pass: a page with a fresh shared copy is skipped, one with only a build copy is copied, one with neither is rendered", async () => {
  const s = setup();
  const warm = (path: string) => worker.fetch(new Request(`https://anilumi.in${path}`, { headers: { "user-agent": "AniLumi cache warmer", "x-warm-mode": "shared" } }), s.env, s.ctx);
  await s.r2.put("last/character/has-copy?__last=1", new TextEncoder().encode("copy").buffer as ArrayBuffer, { customMetadata: meta(BUILD) });
  await s.r2.put(`edge/character/build-only?__gen=${BUILD}`, new TextEncoder().encode("build copy").buffer as ArrayBuffer, { customMetadata: meta(BUILD) });
  const a = await warm("/character/has-copy");
  assert.equal(a.status, 204);
  assert.equal(a.headers.get("x-edge-cache"), "SHARED-FRESH");
  const b = await warm("/character/build-only");
  assert.equal(b.headers.get("x-edge-cache"), "SHARED-FROM-GLOBAL");
  assert.equal(s.r2.text("last/character/build-only?__last=1"), "build copy");
  const c = await warm("/character/no-copy");
  assert.equal(c.status, 200);
  await s.flush();
  assert.equal(s.r2.text("last/character/no-copy?__last=1"), "fresh /character/no-copy");
  assert.equal(s.renders(), 1);
});
