import { test } from "node:test";
import assert from "node:assert/strict";
import { CHARACTER_VS, vsSides, berries, vsLinkText } from "../lib/charvs";
import { characterDeep } from "../lib/chardeep";

test("character match-ups: both sides resolve, and same-series pairs carry a sourced canon result", () => {
  assert.equal(new Set(CHARACTER_VS.map((v) => v.slug)).size, CHARACTER_VS.length);
  for (const v of CHARACTER_VS) {
    assert.ok(vsSides(v), `${v.slug}: both characters are in the snapshot`);
    if (!v.canon) continue;
    assert.ok(v.canon.sources.length >= 2, `${v.slug}: two sources`);
    assert.ok(v.canon.bouts.every((b) => b.from > 0 && (b.to === null || b.to >= b.from)), `${v.slug}: episode ranges`);
  }
  // Kaido is outside the top-2,000 snapshot: fetched by id so the page survives the monthly refresh.
  assert.equal(vsSides(CHARACTER_VS.find((v) => v.slug === "luffy-vs-kaido")!)?.[1].row.heightCm, 710);
  assert.equal(berries(4_611_100_000), "4,611,100,000 berries");
  assert.match(vsLinkText(CHARACTER_VS.find((v) => v.slug === "luffy-vs-katakuri")!), /who wins, every fight/);
});

test("Luffy's bounties rise in order and end at his current one", () => {
  const b = characterDeep("luffy-monkey-d")!.bounties!;
  assert.deepEqual(b.map((x) => x.amount), [...b.map((x) => x.amount)].sort((x, y) => x - y));
  assert.equal(b.at(-1)!.amount, 3_000_000_000);
  assert.equal(b[0].spoiler, false);
});
