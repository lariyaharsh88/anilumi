import { test } from "node:test";
import assert from "node:assert/strict";
import { humanDays, hoursOf, paces, shortcuts, fmtRun, OP_ED_MIN } from "../lib/binge";
import { combineScores, agreement, kitsuScore, aniListScore, type ScoreSource } from "../lib/scores";

test("humanDays scales from days to years", () => {
  assert.equal(humanDays(1), "1 day");
  assert.equal(humanDays(13), "13 days");
  assert.equal(humanDays(21), "3 weeks");
  assert.equal(humanDays(150), "5 months");
  assert.equal(humanDays(1000), "2.7 years");
  assert.equal(humanDays(0), "–");
});

test("hoursOf never rounds a short show to zero", () => {
  assert.equal(hoursOf(20), 1);
  assert.equal(hoursOf(0), 0);
  assert.equal(hoursOf(25 * 24), 10);
});

test("paces covers each viewing rhythm for a 25-episode show", () => {
  const p = paces(25 * 24, 25);
  assert.deepEqual(p.map((x) => [x.key, x.days]), [["ep", 25], ["1h", 10], ["2h", 5], ["4h", 3], ["we", 1]]);
  assert.equal(paces(120, 1)[0].key, "1h"); // movies have no per-episode pace
  assert.deepEqual(paces(0, 10), []);
});

test("shortcuts skip openings, filler and both", () => {
  const s = shortcuts(100 * 24, 100, 24, 20);
  const by = Object.fromEntries(s.map((x) => [x.key, x.minutes]));
  assert.equal(by.oped, 100 * (24 - OP_ED_MIN));
  assert.equal(by.filler, 80 * 24);
  assert.equal(by.both, 80 * (24 - OP_ED_MIN));
  assert.equal(by["1.5x"], 1600);
  assert.ok(!shortcuts(90, 1, 90).some((x) => x.key === "oped"), "no opening skip for a movie");
});

const src = (key: ScoreSource["key"], score: number): ScoreSource => ({ key, label: key, score, votes: 10, url: null });

test("combineScores averages available sources and reports spread", () => {
  const c = combineScores([src("kitsu", 8.4), src("anilist", 8.5), null, src("mal", 8.6)])!;
  assert.equal(c.score, 8.5);
  assert.equal(c.sources.length, 3);
  assert.equal(c.spread, 0.2);
  assert.equal(c.high.key, "mal");
  assert.match(agreement(c), /agree closely/);
  assert.match(agreement(combineScores([src("kitsu", 7), src("mal", 8)])!), /mal rates it 1\.0 points higher than kitsu/);
  assert.equal(combineScores([null, undefined]), null);
});

test("source helpers convert 0–100 API scores", () => {
  assert.equal(kitsuScore({ slug: "x", rating: 84.3, ratingDist: [1, 2, 3], userCount: 5 })!.score, 8.43);
  assert.equal(kitsuScore({ slug: "x", rating: 84.3, ratingDist: [1, 2, 3], userCount: 5 })!.votes, 6);
  assert.equal(kitsuScore({ slug: "x", rating: null, userCount: 5 }), null);
  assert.equal(aniListScore({ anilistId: 21, score: 8.7, scoreVotes: 100 })!.url, "https://anilist.co/anime/21");
  assert.equal(aniListScore(null), null);
});

test("fmtRun switches to whole hours past two days", () => {
  assert.equal(fmtRun(100), "1h 40m");
  assert.equal(fmtRun(45), "45m");
  assert.equal(fmtRun(1180 * 24), "472 h");
  assert.equal(fmtRun(0), "–");
});
