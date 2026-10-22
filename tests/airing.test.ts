import { test } from "node:test";
import assert from "node:assert/strict";
import { airingNotice } from "../lib/kitsu";

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
