import { test } from "node:test";
import assert from "node:assert/strict";
import { fmtMinutes, shiftSeason, seasonOf, uniqueById, stableUrl, isFuture, weekdayOf, fmtDate } from "../lib/kitsu";

test("fmtMinutes formats hours, minutes and days", () => {
  assert.equal(fmtMinutes(0), "–");
  assert.equal(fmtMinutes(45), "45m");
  assert.equal(fmtMinutes(600), "10h");
  assert.equal(fmtMinutes(606), "10h 6m");
  assert.equal(fmtMinutes(60 * 50), "2d 2h");
});

test("shiftSeason wraps across years", () => {
  assert.deepEqual(shiftSeason("winter", 2026, -1), { season: "fall", year: 2025 });
  assert.deepEqual(shiftSeason("fall", 2026, 1), { season: "winter", year: 2027 });
  assert.deepEqual(shiftSeason("spring", 2026, 5), { season: "summer", year: 2027 });
});

test("seasonOf maps months to seasons", () => {
  assert.equal(seasonOf(new Date("2026-01-15T00:00:00Z")).season, "winter");
  assert.equal(seasonOf(new Date("2026-04-01T00:00:00Z")).season, "spring");
  assert.equal(seasonOf(new Date("2026-08-31T00:00:00Z")).season, "summer");
  assert.equal(seasonOf(new Date("2026-10-21T00:00:00Z")).season, "fall");
});

test("uniqueById keeps first occurrence", () => {
  assert.deepEqual(uniqueById([{ id: "1", v: 1 }, { id: "2", v: 2 }, { id: "1", v: 3 }]).map((x) => x.v), [1, 2]);
});

test("stableUrl rewrites signed Backblaze URLs and strips query strings", () => {
  assert.equal(stableUrl("https://kitsu-production-media.s3.us-west-002.backblazeb2.com/anime/1/poster_image/abc.jpg?X-Amz-Signature=zzz"), "https://media.kitsu.app/anime/1/poster_image/abc.jpg");
  assert.equal(stableUrl("https://media.kitsu.app/x.jpg?v=1"), "https://media.kitsu.app/x.jpg");
  assert.equal(stableUrl(null), undefined);
});

test("isFuture handles date-only and datetime strings", () => {
  assert.equal(isFuture("1999-10-20"), false);
  assert.equal(isFuture("2999-01-01"), true);
  assert.equal(isFuture("2999-01-01T09:30:00.000+09:00"), true);
  assert.equal(isFuture(null), false);
});

test("weekdayOf and fmtDate use Tokyo / UTC consistently", () => {
  assert.equal(weekdayOf("2026-10-25T09:30:00.000+09:00"), "Sunday");
  assert.equal(fmtDate("2013-04-06"), "Apr 6, 2013");
});
