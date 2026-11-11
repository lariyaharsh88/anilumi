import { test } from "node:test";
import assert from "node:assert/strict";
import { verdictLines } from "../lib/verdict";

const base = { title: "X", themes: [], score: null, finish: null, runtimeMin: null, episodes: null, movie: false, airing: false, suits: null, watchOn: [], hindi: false, pairs: [] };

test("verdict: one factual sentence per available fact, nothing invented", () => {
  assert.deepEqual(verdictLines(base), []);
  const lines = verdictLines({ ...base, themes: ["Revenge", "Military"], score: { value: 8.62, sites: 3 }, finish: { rate: 81.4, started: 9000 }, runtimeMin: 600, episodes: 25, suits: "Older teens and adults (17+)", watchOn: ["Crunchyroll", "Hulu"], hindi: true, pairs: ["Code Geass"] });
  assert.deepEqual(lines, [
    "Best if you like revenge and military.",
    "Fans rate it 8.6/10 across 3 sites, and 81% of AniList viewers who start it finish it.",
    "It takes about 10 hours to watch (25 episodes).",
    "Suitable for older teens and adults (17+).",
    "Stream it on Crunchyroll and Hulu in the US; it also has an official Hindi dub.",
    "If you like it, its fans most often recommend Code Geass next.",
  ]);
});

test("verdict: airing shows skip the completion rate and say 'so far'; films give their length", () => {
  const airing = verdictLines({ ...base, score: { value: 7, sites: 1 }, finish: { rate: 50, started: 9000 }, runtimeMin: 120, airing: true });
  assert.deepEqual(airing, ["Fans rate it 7.0/10.", "So far it takes about 2 hours to watch."]);
  assert.deepEqual(verdictLines({ ...base, runtimeMin: 110, movie: true, hindi: true }), ["The film runs 110 minutes.", "It has an official Hindi dub."]);
});
