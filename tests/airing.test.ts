import { test } from "node:test";
import assert from "node:assert/strict";
import { airingNotice } from "../lib/kitsu";
import { indexAiring, upcomingOf, type AiringShow } from "../lib/airing";

const now = new Date("2026-10-22T12:00:00Z").getTime();

test("normal week: AniList time, no break, sources agree", () => {
  const n = airingNotice("2026-10-24T09:00:00.000+09:00", "2026-10-24T00:00:00.000Z", now);
  assert.equal(n.source, "AniList");
  assert.equal(n.onBreak, false);
  assert.equal(n.disagree, null);
});

test("One Piece case: AniList says January, Kitsu says Sunday -> break and disagreement", () => {
  const n = airingNotice("2026-10-25T09:30:00.000+09:00", "2027-01-03T14:16:00.000Z", now);
  assert.equal(n.onBreak, true);
  assert.equal(n.breakDays, 73);
  assert.deepEqual(n.disagree, { aniList: "2027-01-03T14:16:00.000Z", kitsu: "2026-10-25T09:30:00.000+09:00" });
});

test("Kitsu-only and no data", () => {
  assert.equal(airingNotice("2026-10-24T09:00:00.000+09:00", null, now).source, "Kitsu");
  assert.equal(airingNotice(null, undefined, now).next, null);
});


const snapNow = Date.parse("2026-11-02T00:00:00Z");
const show: AiringShow = { a: 1, k: "10", s: "show", t: "Show", p: 500, e: 12, n: [[5, snapNow / 1000 - 3600], [6, snapNow / 1000 + 86400], [7, snapNow / 1000 + 8 * 86400]], d: "2026-10-01" };

test("upcomingOf drops aired episodes and keeps exact times", () => {
  assert.deepEqual(upcomingOf(show, snapNow).map((u) => u.episode), [6, 7]);
  assert.equal(upcomingOf(show, snapNow)[0].at, "2026-11-03T00:00:00.000Z");
  assert.deepEqual(upcomingOf(undefined, snapNow), []);
});

test("indexAiring indexes fresh snapshots and ignores stale ones", () => {
  const fresh = indexAiring({ generated: new Date(snapNow - 3600_000).toISOString(), shows: [show] }, snapNow);
  assert.equal(fresh.byAniList.get(1)?.s, "show");
  assert.equal(fresh.byKitsu.get("10")?.a, 1);
  assert.equal(indexAiring({ generated: new Date(snapNow - 13 * 3600_000).toISOString(), shows: [show] }, snapNow).shows.length, 0);
  assert.equal(indexAiring(null, snapNow).shows.length, 0);
});
