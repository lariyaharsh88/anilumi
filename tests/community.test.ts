import { test } from "node:test";
import assert from "node:assert/strict";
import { normalizeEmail, cleanText, summarize, ratingDelta, aggregateRating, csvCell, toCsv, isAnimeId, isScore, isReaction, isSource, RATING_SNIPPET_MIN } from "../lib/community";
import { currentPoll, POLLS } from "../data/polls";

test("normalizeEmail trims, lower-cases and rejects junk", () => {
  assert.equal(normalizeEmail("  Fan@Example.COM "), "fan@example.com");
  for (const bad of ["", "fan", "fan@", "fan@x", "a b@c.de", 42, null, `${"a".repeat(250)}@x.com`]) assert.equal(normalizeEmail(bad), null, String(bad));
});

test("validators", () => {
  assert.ok(isAnimeId("7442") && !isAnimeId("74a") && !isAnimeId(7442) && !isAnimeId("1".repeat(10)));
  assert.ok(isScore(1) && isScore(10) && !isScore(0) && !isScore(11) && !isScore(7.5) && !isScore("7"));
  assert.ok(isReaction("love") && !isReaction("hate"));
  assert.ok(isSource("anime-alert") && !isSource("Anime Alert") && !isSource("x"));
  assert.equal(cleanText("  hi\u0000 there\u0007 ", 50), "hi there");
  assert.equal(cleanText("abcdef", 3), "abc");
});

test("ratingDelta: first vote, changed vote, same vote", () => {
  assert.deepEqual(ratingDelta(8, null), { sum: 8, "dist.7": 1, count: 1 });
  assert.deepEqual(ratingDelta(6, 8), { sum: -2, "dist.5": 1, "dist.7": -1 });
  assert.deepEqual(ratingDelta(8, 8), {});
});

test("summarize handles missing data and object-shaped dist; snippet only past the threshold", () => {
  assert.deepEqual(summarize(null), { count: 0, avg: null, dist: Array(10).fill(0) });
  const s = summarize({ count: 3, sum: 25, dist: { 7: 1, 8: 2 } as unknown as number[] });
  assert.equal(s.avg, 8.3);
  assert.equal(s.dist[8], 2);
  assert.equal(aggregateRating(s), undefined);
  const many = summarize({ count: RATING_SNIPPET_MIN, sum: RATING_SNIPPET_MIN * 7, dist: [] });
  assert.deepEqual(aggregateRating(many), { "@type": "AggregateRating", ratingValue: 7, bestRating: 10, worstRating: 1, ratingCount: RATING_SNIPPET_MIN });
});

test("CSV cells are quoted and formula-safe", () => {
  assert.equal(csvCell('say "hi"'), '"say ""hi"""');
  assert.equal(csvCell("=HYPERLINK(1)"), `"'=HYPERLINK(1)"`);
  assert.equal(csvCell(null), '""');
  assert.equal(toCsv(["a", "b"], [[1, "-2"]]), `"a","b"\r\n"1","'-2"`);
});

test("currentPoll picks the newest poll that has started", () => {
  const polls = [{ ...POLLS[0], id: "a", from: "2026-10-01" }, { ...POLLS[0], id: "b", from: "2026-10-20" }, { ...POLLS[0], id: "c", from: "2026-12-01" }];
  assert.equal(currentPoll("2026-10-25", polls)?.id, "b");
  assert.equal(currentPoll("2026-09-01", polls), null);
  for (const p of POLLS) assert.ok(p.options.length >= 2 && p.options.length <= 6, p.id);
  assert.equal(new Set(POLLS.map((p) => p.id)).size, POLLS.length);
});
