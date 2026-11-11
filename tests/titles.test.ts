import { test } from "node:test";
import assert from "node:assert/strict";
import { fitTitle, fitDescription } from "../lib/titles";

test("titles: the most informative that fits, with the site name when there's room, else the shortest", () => {
  assert.equal(fitTitle(["Eren Yeager (Attack on Titan): Age, Height, Birthday & Voice Actor", "Eren Yeager: Age, Height, Birthday & Voice Actor"]), "Eren Yeager: Age, Height, Birthday & Voice Actor");
  assert.deepEqual(fitTitle(["A".repeat(70), "B".repeat(58), "C".repeat(20)]), { absolute: "B".repeat(58) });
  assert.deepEqual(fitTitle(["A".repeat(90), "B".repeat(80)]), { absolute: "B".repeat(80) });
  assert.equal(fitTitle([null, "", "Short"]), "Short");
});

test("descriptions: unchanged when short, else cut at the last sentence that fits, else at a word", () => {
  assert.equal(fitDescription("  Short   one. "), "Short one.");
  const sentences = `${"a".repeat(100)}. ${"b".repeat(100)}.`;
  assert.equal(fitDescription(sentences), `${"a".repeat(100)}.`);
  const words = Array.from({ length: 60 }, (_, i) => `word${i}`).join(" ");
  const cut = fitDescription(words);
  assert.ok(cut.length <= 161 && cut.endsWith("…") && !cut.includes("  "));
});
