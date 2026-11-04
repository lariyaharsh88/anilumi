import { test } from "node:test";
import assert from "node:assert/strict";
import { yourShows } from "../lib/yourshows";
import type { WatchItem } from "../lib/watchlist";

const now = Date.parse("2026-11-04T12:00:00Z");
const s = (iso: string) => Date.parse(iso) / 1000;
const item = (id: string, extra: Partial<WatchItem> = {}): WatchItem => ({ id, slug: `show-${id}`, title: `Show ${id}`, poster: null, status: "current", nextRelease: null, addedAt: 0, ...extra });

test("your shows: today's snapshot time wins over the date saved with the show, soonest first", () => {
  const times = { "1": [[6, s("2026-11-05T15:00:00Z")]] as [number, number][], "2": [[12, s("2026-11-04T18:00:00Z")]] as [number, number][] };
  const out = yourShows([item("1", { nextRelease: "2026-10-01T00:00:00Z" }), item("2")], times, now);
  assert.deepEqual(out.map((x) => [x.href, x.episode]), [["/anime/show-2", 12], ["/anime/show-1", 6]]);
  assert.equal(out[1].at, "2026-11-05T15:00:00.000Z");
});

test("your shows: an episode that aired under 2 hours ago stays; older ones give way to the next", () => {
  const times = { "1": [[5, s("2026-11-04T11:00:00Z")], [6, s("2026-11-11T11:00:00Z")]] as [number, number][], "2": [[3, s("2026-11-04T09:00:00Z")], [4, s("2026-11-11T09:00:00Z")]] as [number, number][] };
  const out = yourShows([item("1"), item("2")], times, now);
  assert.deepEqual(out.map((x) => x.episode), [5, 4]);
});

test("your shows: catch-up count from saved progress", () => {
  const times = { "1": [[8, s("2026-11-06T00:00:00Z")]] as [number, number][], "2": [[8, s("2026-11-04T11:30:00Z")]] as [number, number][] };
  const [a, b] = yourShows([item("1", { progress: 4 }), item("2", { progress: 8 })], times, now);
  assert.equal(b.behind, 3); // episodes 5-7 aired, 4 watched
  assert.equal(a.behind, undefined); // episode 8 out and watched
});

test("your shows: falls back to a future saved date; finished and stale shows are left out", () => {
  const out = yourShows([
    item("1", { nextRelease: "2026-11-06T00:00:00Z" }),
    item("2", { nextRelease: "2026-10-01T00:00:00Z" }),
    item("3", { status: "finished" }),
  ], {}, now);
  assert.deepEqual(out.map((x) => [x.href, x.episode]), [["/anime/show-1", 0]]);
});
