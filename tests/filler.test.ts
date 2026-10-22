import { test } from "node:test";
import assert from "node:assert/strict";
import { parseRanges, formatRanges, fillerFor } from "../lib/filler";
import { FILLER, CONTINUE } from "../data/filler";

test("parseRanges and formatRanges round-trip", () => {
  const s = parseRanges("26, 97, 101-106, 3 - 1, junk");
  assert.deepEqual([...s].sort((a, b) => a - b), [1, 2, 3, 26, 97, 101, 102, 103, 104, 105, 106]);
  assert.equal(formatRanges(s), "1–3, 26, 97, 101–106");
});

test("fillerFor counts within the series and finds the next canon episode", () => {
  const f = fillerFor("naruto", 220)!;
  assert.equal(f.count, 1 + 1 + 6 + 6 + 77);
  assert.equal(f.nextCanon(135), 142); // 136-141 are filler
  assert.equal(f.nextCanon(136), 142);
  assert.equal(f.nextCanon(143), 220);
  assert.equal(fillerFor("not-a-show", 10), null);
});

test("data sanity: ranges parse, ascending, no overlap with mixed, entries start unreviewed", () => {
  for (const [slug, e] of Object.entries(FILLER)) {
    const f = parseRanges(e.filler), m = parseRanges(e.mixed);
    assert.ok(f.size > 0, slug);
    assert.ok(![...m].some((n) => f.has(n)), `${slug}: an episode is both filler and mixed`);
    const starts = e.filler.split(",").map((p) => Number(p.trim().split("-")[0]));
    assert.deepEqual(starts, [...starts].sort((a, b) => a - b), `${slug}: ranges out of order`);
  }
  for (const [slug, c] of Object.entries(CONTINUE)) assert.ok(c.chapter || c.volume, slug);
});
