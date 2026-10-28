import { test } from "node:test";
import assert from "node:assert/strict";
import { timecode, toMatches, traceError, CONFIDENT, type TraceHit } from "../lib/scene";
import { pickRecs } from "../lib/anilist";

const hit = (id: number, ep: number | string | null, sim: number, adult = false, from = 272.19): TraceHit => ({
  anilist: { id, idMal: null, isAdult: adult, title: { native: "ネイティブ", romaji: `Romaji ${id}`, english: id === 1 ? "English One" : null } },
  episode: ep, from, to: from + 10, similarity: sim, video: "https://v/x?t=1", image: "https://i/x?t=1",
});

test("timecode formats minutes and hours", () => {
  assert.equal(timecode(272.19), "4:32");
  assert.equal(timecode(5), "0:05");
  assert.equal(timecode(3725), "1:02:05");
  assert.equal(timecode(-3), "0:00");
});

test("toMatches hides adult titles, dedupes per episode and sorts by similarity", () => {
  const { matches, hiddenAdult } = toMatches([hit(1, 1, 0.95), hit(1, 1, 0.99, false, 280), hit(2, "3", 0.8), hit(3, 1, 0.97, true), hit(1, 2, 0.9)]);
  assert.equal(hiddenAdult, 1);
  assert.deepEqual(matches.map((m) => [m.anilistId, m.episode, m.similarity]), [[1, 1, 0.99], [1, 2, 0.9], [2, 3, 0.8]]);
  assert.equal(matches[0].title, "English One");
  assert.equal(matches[0].at, 280);
  assert.equal(matches[2].title, "Romaji 2");
  assert.ok(matches[2].similarity < CONFIDENT);
  assert.equal(toMatches([hit(9, null, 0.9)]).matches[0].episode, null);
});

test("traceError explains quota and busy states", () => {
  assert.match(traceError(402), /100 per person/);
  assert.match(traceError(429), /already running/);
  assert.match(traceError(400, "Invalid image url"), /Invalid image url/);
});

test("pickRecs keeps positive, non-adult anime recs, most votes first, no duplicates", () => {
  const node = (id: number, rating: number, extra: Record<string, unknown> = {}) => ({ rating, mediaRecommendation: { id, type: "ANIME", format: "TV", seasonYear: 2019, isAdult: false, title: { romaji: `R${id}`, english: id === 10 ? "Ten" : null }, coverImage: { medium: null }, ...extra } });
  const recs = pickRecs([node(10, 50), node(11, 900), node(12, -3), node(13, 70, { isAdult: true }), node(14, 30, { type: "MANGA" }), node(11, 5), { rating: 9, mediaRecommendation: null }]);
  assert.deepEqual(recs.map((r) => [r.anilistId, r.votes, r.title]), [[11, 900, "R11"], [10, 50, "Ten"]]);
  assert.equal(pickRecs([node(1, 1), node(2, 2), node(3, 3)], 2).length, 2);
});
