import { test } from "node:test";
import assert from "node:assert/strict";
import { birthdaysOn, allDays, bdLabel } from "../lib/birthdays";
import { birthdayStats, statsLine } from "../lib/bdstats";

test("bdstats: every date with 2+ characters gets clean numbers and a sentence", () => {
  let withStats = 0;
  for (const { m, d } of allDays()) {
    const s = birthdayStats(birthdaysOn(m, d).characters);
    if (!s) continue;
    withStats++;
    assert.ok(s.count >= 2 && s.main + s.supporting <= s.count, `${m}/${d}`);
    if (s.oldest && s.youngest) assert.ok((s.oldest.ageNum ?? 0) >= (s.youngest.ageNum ?? 0), `${m}/${d} age order`);
    if (s.tallest && s.shortest) assert.ok((s.tallest.heightCm ?? 0) >= (s.shortest.heightCm ?? 0), `${m}/${d} height order`);
    const line = statsLine(bdLabel(m, d), s);
    assert.doesNotMatch(line, /\b0 |undefined|null|NaN/, `${m}/${d}: ${line}`);
  }
  assert.ok(withStats > 250, `only ${withStats} dates`);
});
