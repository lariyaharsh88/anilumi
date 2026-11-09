import { test } from "node:test";
import assert from "node:assert/strict";
import { dispatchDue, dueWorkflows } from "../edge/schedule.js";

const at = (iso: string) => dueWorkflows(new Date(iso)) as string[];

test("edge cron: alerts every tick, AniList hourly, airing every 3 h, warm-up every 6 h, health daily", () => {
  assert.deepEqual(at("2026-11-06T01:35:00Z"), ["alerts.yml"]);
  assert.deepEqual(at("2026-11-06T01:05:00Z"), ["alerts.yml", "anilist-sync.yml"]);
  assert.deepEqual(at("2026-11-06T03:05:00Z"), ["alerts.yml", "anilist-sync.yml", "airing.yml"]);
  assert.deepEqual(at("2026-11-06T06:35:00Z"), ["alerts.yml", "warm-cache.yml"]);
  assert.deepEqual(at("2026-11-06T05:35:00Z"), ["alerts.yml", "health.yml"]);
  assert.deepEqual(at("2026-11-06T06:05:00Z"), ["alerts.yml", "anilist-sync.yml", "airing.yml", "sitemap.yml"]);
  // Over a day: 48 alert runs, 24 AniList syncs, 8 airing snapshots, 4 warm-ups, 1 health check, 1 sitemap.
  const day = Array.from({ length: 48 }, (_, i) => at(new Date(Date.UTC(2026, 10, 6, Math.floor(i / 2), i % 2 ? 35 : 5)).toISOString())).flat();
  const n = (f: string) => day.filter((x) => x === f).length;
  assert.deepEqual([n("alerts.yml"), n("anilist-sync.yml"), n("airing.yml"), n("warm-cache.yml"), n("health.yml"), n("sitemap.yml")], [48, 24, 8, 4, 1, 1]);
});

test("edge cron: dispatches each due workflow on main, and nothing without a token", async () => {
  const calls: { url: string; body: string; auth: string }[] = [];
  const real = globalThis.fetch;
  globalThis.fetch = (async (url: string, init: RequestInit) => {
    calls.push({ url, body: String(init.body), auth: (init.headers as Record<string, string>).authorization });
    return new Response(null, { status: 204 });
  }) as typeof fetch;
  const log = console.log;
  console.log = () => {};
  try {
    await dispatchDue({}, new Date("2026-11-06T03:05:00Z"));
    assert.equal(calls.length, 0);
    await dispatchDue({ GH_DISPATCH_TOKEN: "t" }, new Date("2026-11-06T03:05:00Z"));
    assert.deepEqual(calls.map((c) => c.url.split("/workflows/")[1]), ["alerts.yml/dispatches", "anilist-sync.yml/dispatches", "airing.yml/dispatches"]);
    assert.ok(calls.every((c) => c.body === '{"ref":"main"}' && c.auth === "Bearer t" && c.url.includes("/repos/lariyaharsh88/anilumi/")));
  } finally {
    globalThis.fetch = real;
    console.log = log;
  }
});
