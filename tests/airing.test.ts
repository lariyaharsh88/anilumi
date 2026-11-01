import { test } from "node:test";
import assert from "node:assert/strict";
import { indexAiring, upcomingOf, type AiringShow } from "../lib/airing";

const now = Date.parse("2026-11-02T00:00:00Z");
const show: AiringShow = { a: 1, k: "10", s: "show", t: "Show", p: 500, e: 12, n: [[5, now / 1000 - 3600], [6, now / 1000 + 86400], [7, now / 1000 + 8 * 86400]], d: "2026-10-01" };

test("upcomingOf drops aired episodes and keeps exact times", () => {
  assert.deepEqual(upcomingOf(show, now).map((u) => u.episode), [6, 7]);
  assert.equal(upcomingOf(show, now)[0].at, "2026-11-03T00:00:00.000Z");
  assert.deepEqual(upcomingOf(undefined, now), []);
});

test("indexAiring indexes fresh snapshots and ignores stale ones", () => {
  const fresh = indexAiring({ generated: new Date(now - 3600_000).toISOString(), shows: [show] }, now);
  assert.equal(fresh.byAniList.get(1)?.s, "show");
  assert.equal(fresh.byKitsu.get("10")?.a, 1);
  assert.equal(indexAiring({ generated: new Date(now - 13 * 3600_000).toISOString(), shows: [show] }, now).shows.length, 0);
  assert.equal(indexAiring(null, now).shows.length, 0);
});
