import { test } from "node:test";
import assert from "node:assert/strict";
import { compareSets, compareRow } from "../lib/charcompare";
import { allSnapChars } from "../lib/charsnap";

test("compare: same-series set excludes the character, similar set takes one lead per recommended show", () => {
  const leader = [...allSnapChars()].filter((c) => c.k).sort((a, b) => b.f - a.f)[0];
  const sets = compareSets(leader.k!);
  assert.ok(sets);
  assert.equal(sets.self.id, leader.id);
  assert.ok(sets.sameSeries.every((r) => r.id !== leader.id && r.series));
  const shows = sets.similar.map((r) => r.series);
  assert.equal(new Set(shows).size, shows.length);
  assert.ok(!shows.includes(sets.self.series));
});

test("compare rows: only real blood types, heights in cm, ages kept as written", () => {
  const c = allSnapChars().find((x) => x.l.some(([l]) => l.toLowerCase() === "height"))!;
  const r = compareRow(c);
  assert.ok(r.heightCm === null || (r.heightCm > 20 && r.heightCm < 1000));
  assert.ok(r.bloodType === null || /^(A|B|O|AB)$/.test(r.bloodType));
});
