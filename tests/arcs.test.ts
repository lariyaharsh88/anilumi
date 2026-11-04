import { test } from "node:test";
import assert from "node:assert/strict";
import { arcOf, arcSummary, arcsFor, type Arc } from "../lib/arcs";

const arcs: Arc[] = [{ name: "Romance Dawn", from: 1, to: 3 }, { name: "Orange Town", from: 4, to: 8 }, { name: "Warship Island", from: 54, to: 61, filler: true }];

test("arcOf: the arc covering an episode, none in gaps or without data", () => {
  assert.equal(arcOf(arcs, 3)?.name, "Romance Dawn");
  assert.equal(arcOf(arcs, 4)?.name, "Orange Town");
  assert.equal(arcOf(arcs, 20), null);
  assert.equal(arcOf(null, 1), null);
});

test("arcSummary marks filler and single-episode arcs", () => {
  assert.equal(arcSummary([...arcs, { name: "Special", from: 70, to: 70 }]), "Romance Dawn, episodes 1–3; Orange Town, episodes 4–8; Warship Island (filler), episodes 54–61; Special, episode 70");
});

test("ongoing arcs run open-ended", () => {
  const live: Arc[] = [{ name: "Egghead", from: 1086, to: 1155 }, { name: "Elbaph", from: 1156, to: null }];
  assert.equal(arcOf(live, 1200)?.name, "Elbaph");
  assert.equal(arcSummary(live), "Egghead, episodes 1086–1155; Elbaph, episodes 1156 onward");
});

test("arc data: every show's arcs are in order, don't overlap and have sane ranges", () => {
  for (const slug of ["one-piece", "naruto", "naruto-shippuden", "bleach", "black-clover-tv"]) {
    const arcs = arcsFor(slug);
    assert.ok(arcs && arcs.length > 1, slug);
    arcs!.forEach((a, i) => {
      assert.ok(a.from >= 1 && (a.to === null || a.to >= a.from), `${slug} ${a.name}`);
      if (i) assert.ok(arcs![i - 1].to !== null && arcs![i - 1].to! < a.from, `${slug} ${a.name} overlaps`);
    });
  }
});
