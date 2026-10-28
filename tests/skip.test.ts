import { test } from "node:test";
import assert from "node:assert/strict";
import { pickSkips, spanSec, sampleEpisodes, averageSkips, fmtSec } from "../lib/skip";
import { shortcuts } from "../lib/binge";

const r = (skipType: string, startTime: number, endTime: number) => ({ interval: { startTime, endTime }, skipType, episodeLength: 1440 });

test("pickSkips prefers plain op/ed, falls back to mixed, drops implausible spans", () => {
  const s = pickSkips([r("mixed-op", 75, 135), r("op", 47.4, 137.4), r("mixed-ed", 24, 114), r("recap", 0, 52), r("ed", 1342, 1343)]);
  assert.deepEqual(s.op, { start: 47.4, end: 137.4 });
  assert.deepEqual(s.ed, { start: 24, end: 114 }, "plain ed too short (1s), so the mixed one is used");
  assert.deepEqual(s.recap, { start: 0, end: 52 });
  assert.equal(pickSkips([r("op", 0, 600)]).op, null, "10-minute 'opening' is rejected");
  assert.equal(Math.round(spanSec(s.op)), 90);
});

test("sampleEpisodes spreads across the run without duplicates", () => {
  assert.deepEqual(sampleEpisodes(25), [1, 2, 13, 24, 25]);
  assert.deepEqual(sampleEpisodes(2), [1, 2]);
  assert.deepEqual(sampleEpisodes(1), [1]);
  assert.deepEqual(sampleEpisodes(0), []);
});

test("averageSkips averages opening and ending separately over episodes with data", () => {
  const a = averageSkips([{ op: { start: 0, end: 90 }, ed: { start: 0, end: 90 }, recap: null }, null, { op: { start: 0, end: 80 }, ed: null, recap: null }])!;
  assert.deepEqual(a, { perEpisodeSec: 175, opSec: 85, edSec: 90, sampled: 2 });
  assert.equal(averageSkips([null, null]), null);
});

test("shortcuts use the measured skip length when given", () => {
  const measured = shortcuts(25 * 24, 25, 24, 0, { perEpisodeMin: 2.9, sampled: 5 });
  const oped = measured.find((x) => x.key === "oped")!;
  assert.equal(oped.minutes, Math.round(600 - 25 * 2.9));
  assert.match(oped.note, /2\.9 minutes saved per episode, measured on 5 episodes/);
  assert.match(shortcuts(600, 25, 24).find((x) => x.key === "oped")!.note, /About 3 minutes/);
});

test("fmtSec", () => {
  assert.equal(fmtSec(90), "1m 30s");
  assert.equal(fmtSec(120), "2m");
  assert.equal(fmtSec(45), "45s");
});
