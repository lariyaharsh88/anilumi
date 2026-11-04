import { test } from "node:test";
import assert from "node:assert/strict";
import { snapshotOrder } from "../lib/wosnap";

test("snapshot watch order: Attack on Titan's full main story, found from any season", () => {
  const first = snapshotOrder("7442"); // Attack on Titan (Kitsu id)
  assert.ok(first, "Attack on Titan is in the snapshot");
  const mains = first!.entries.filter((e) => e.kind === "main");
  assert.ok(mains.length >= 5, `main story has ${mains.length} parts`);
  assert.equal(mains[0].anime.id, "7442");
  assert.ok(first!.totalMinutes > 600);
  const s2 = mains[1].anime.id;
  assert.equal(snapshotOrder(s2)?.entries.length, first!.entries.length); // a later season resolves to the same order
});

test("unknown titles have no snapshot order", () => {
  assert.equal(snapshotOrder("999999999"), null);
});
