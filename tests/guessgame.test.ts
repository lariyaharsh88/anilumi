import { test } from "node:test";
import assert from "node:assert/strict";
import { compare, dailyOrder, dailyPick, istDay, msToNextDay, shareText, suggest, type GChar } from "../lib/guessgame-core";
import { GUESS_MODES, guessPool } from "../lib/guessgame";

const c = (id: number, over: Partial<GChar> = {}): GChar => ({ id, n: `Char ${id}`, g: "Male", r: "M", m: 6, h: 170, a: 16, v: "VA", i: null, p: null, ...over });

test("guess game: the daily pick is the same for everyone and cycles the whole pool before repeating", () => {
  const pool = Array.from({ length: 30 }, (_, i) => c(i + 1));
  const shuffled = [...pool].reverse();
  // Same answer however the pool happens to be ordered.
  assert.equal(dailyPick(pool, "naruto", 20500).id, dailyPick(shuffled, "naruto", 20500).id);
  // 30 days, 30 different characters.
  assert.equal(new Set(Array.from({ length: 30 }, (_, d) => dailyPick(pool, "naruto", 20500 + d).id)).size, 30);
  // Modes have their own order.
  assert.notDeepEqual(dailyOrder(pool, "naruto").map((x) => x.id), dailyOrder(pool, "one-piece").map((x) => x.id));
});

test("guess game: the day turns over at midnight IST", () => {
  const beforeMidnight = Date.parse("2026-11-19T18:29:00Z"); // 23:59 IST
  const afterMidnight = Date.parse("2026-11-19T18:31:00Z"); // 00:01 IST on 20 Nov
  assert.equal(istDay(afterMidnight) - istDay(beforeMidnight), 1);
  assert.equal(Math.round(msToNextDay(beforeMidnight) / 60000), 1);
});

test("guess game: attributes compare as hit, near, miss or unknown, with arrows toward the answer", () => {
  const answer = c(1, { s: "naruto", t: "Naruto", g: "Female", m: 6, h: 170, a: 16 });
  const guess = c(2, { s: "naruto", t: "Naruto", g: "Male", m: 7, h: 180, a: null });
  const row = Object.fromEntries(compare(guess, answer, ["series", "gender", "month", "height", "age", "voice"]).map((x) => [x.k, x]));
  assert.equal(row.series.s, "hit");
  assert.equal(row.gender.s, "miss");
  assert.deepEqual([row.month.s, row.month.dir], ["near", "down"]);
  assert.deepEqual([row.height.s, row.height.dir], ["miss", "down"]);
  assert.equal(row.age.s, "unknown");
  assert.equal(row.voice.s, "hit");
});

test("guess game: share text has no names, and autocomplete skips guessed characters", () => {
  const answer = c(1, { n: "Satoru Gojou", al: ["Satoru Gojo"] });
  const text = shareText("AniLumi test", 20500, [compare(c(2), answer, ["gender", "height"])], false, "https://anilumi.in/x");
  assert.ok(!text.includes("Gojo") && text.includes("X/8"));
  assert.deepEqual(suggest([answer, c(3, { n: "Satoru Other" })], "gojo", new Set()).map((x) => x.id), [1]);
  assert.deepEqual(suggest([answer], "satoru", new Set([1])), []);
});

test("guess game: every mode has a playable pool", () => {
  for (const m of GUESS_MODES) {
    const pool = guessPool(m.mode);
    assert.ok(pool.length >= 20, `${m.mode}: ${pool.length}`);
    assert.ok(pool.every((x) => x.g), m.mode);
  }
});
