import { test } from "node:test";
import assert from "node:assert/strict";
import { generationOf } from "../lib/family";

test("family: relations land in the right generation", () => {
  const cases: [string, number][] = [
    ["paternal grandfather", -2], ["grandmother", -2], ["great-grandfather", -3], ["father", -1], ["adoptive mother", -1], ["aunt who raised him", -1],
    ["uncle", -1], ["younger half-brother", 0], ["older twin sister", 0], ["cousin, raised as her older brother", 0], ["wife", 0], ["stepsister", 0],
    ["son", 1], ["niece", 1], ["granddaughter", 2], ["great-uncle", -2], ["great-nephew", 2], ["great-granddaughter", 3], ["genetic source", -1], ["godfather", -1], ["ward", 1],
  ];
  for (const [rel, gen] of cases) assert.equal(generationOf(rel), gen, rel);
});
