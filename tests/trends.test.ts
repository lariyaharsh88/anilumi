import { test } from "node:test";
import assert from "node:assert/strict";
import { trendDirection, TrendRow } from "../lib/kitsu";

const rows = (shares: Record<number, number>): TrendRow[] => Object.entries(shares).map(([y, s]) => ({ year: Number(y), total: 100, count: s, share: s }));

test("trendDirection: rise, decline, steady against the 3-year average a decade earlier", () => {
  assert.equal(trendDirection(rows({ 2014: 1, 2015: 2, 2016: 3, 2025: 12 }), 2025).dir, "rise");
  assert.equal(trendDirection(rows({ 2014: 10, 2015: 9, 2016: 8, 2025: 3 }), 2025).dir, "decline");
  assert.equal(trendDirection(rows({ 2014: 20, 2015: 21, 2016: 22, 2025: 22 }), 2025).dir, "steady");
  const t = trendDirection(rows({ 2014: 1, 2015: 2, 2016: 3, 2025: 12 }), 2025);
  assert.equal(t.from, 2);
  assert.equal(t.delta, 10);
});
