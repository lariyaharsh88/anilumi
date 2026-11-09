import { test } from "node:test";
import assert from "node:assert/strict";
import { fitTitle } from "../lib/titles";

test("titles: the most informative that fits, with the site name when there's room, else the shortest", () => {
  assert.equal(fitTitle(["Eren Yeager (Attack on Titan): Age, Height, Birthday & Voice Actor", "Eren Yeager: Age, Height, Birthday & Voice Actor"]), "Eren Yeager: Age, Height, Birthday & Voice Actor");
  assert.deepEqual(fitTitle(["A".repeat(70), "B".repeat(58), "C".repeat(20)]), { absolute: "B".repeat(58) });
  assert.deepEqual(fitTitle(["A".repeat(90), "B".repeat(80)]), { absolute: "B".repeat(80) });
  assert.equal(fitTitle([null, "", "Short"]), "Short");
});
