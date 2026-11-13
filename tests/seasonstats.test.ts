import { test } from "node:test";
import assert from "node:assert/strict";
import { previewSnapshot } from "../lib/preview";
import { seasonNumbers, weekdayOf } from "../lib/seasonstats";

test("seasonstats: weekday of a Japanese date", () => {
  assert.equal(weekdayOf({ year: 2026, month: 10, day: 20 }), 2); // a Tuesday
  assert.equal(weekdayOf({ year: 2026, month: 10, day: null }), null);
});

test("seasonstats: every snapshot season splits cleanly", () => {
  for (const [key, items] of Object.entries(previewSnapshot().seasons)) {
    const n = seasonNumbers(items);
    assert.equal(n.fresh.length + n.sequels.length + n.movies.length, n.total, key);
    assert.ok(n.sources.length <= 6, key);
    assert.ok(n.days.every((d) => d.items.every((i) => i.kind !== "movie")), key);
  }
});
