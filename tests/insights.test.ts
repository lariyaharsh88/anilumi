import { test } from "node:test";
import assert from "node:assert/strict";
import { dropStats, median, parentsGuide, AlTag } from "../lib/insights";

test("dropStats computes rates over people who started", () => {
  const s = dropStats([{ status: "CURRENT", amount: 73980 }, { status: "PLANNING", amount: 93553 }, { status: "COMPLETED", amount: 304211 }, { status: "DROPPED", amount: 7528 }, { status: "PAUSED", amount: 12847 }])!;
  assert.equal(s.started, 73980 + 304211 + 7528 + 12847);
  assert.equal(s.dropRate.toFixed(1), "1.9");
  assert.equal(s.planning, 93553);
  assert.equal(dropStats([{ status: "PLANNING", amount: 10 }]), null);
});

test("median handles odd and even lengths", () => {
  assert.equal(median([3, 1, 2]), 2);
  assert.equal(median([4, 1, 3, 2]), 2.5);
});

const tag = (name: string, rank: number, extra: Partial<AlTag> = {}): AlTag => ({ name, rank, category: "Theme-Other", isAdult: false, isMediaSpoiler: false, ...extra });

test("parentsGuide levels areas by tag rank, hides spoiler and adult tag names", () => {
  const g = parentsGuide(
    [tag("Gore", 82), tag("War", 40), tag("Suicide", 60, { isMediaSpoiler: true }), tag("Nudity", 30, { category: "Cast-Traits" }), tag("Large Breasts", 70, { category: "Sexual Content", isAdult: true }), tag("Rape", 55, { category: "Sexual Content", isAdult: true })],
    ["Action"],
    "R",
  );
  const by = Object.fromEntries(g.areas.map((a) => [a.key, a]));
  assert.equal(by.violence.level, "strong");
  assert.deepEqual(by.violence.shown, ["Gore", "War"]);
  assert.equal(by.disturbing.level, "moderate");
  assert.deepEqual(by.disturbing.shown, []);
  assert.equal(by.disturbing.hiddenSpoilers, 1);
  assert.equal(by.sexual.level, "moderate");
  assert.deepEqual(by.sexual.shown, ["Nudity"]);
  assert.equal(by["sexual-violence"].level, "moderate");
  assert.equal(by["sexual-violence"].shown.length, 0);
  assert.equal(g.suitable, "Older teens and adults (17+)");
});

test("parentsGuide: gentle show rated G reads as all ages; harem tags cap at mild", () => {
  const g = parentsGuide([tag("Kids", 80, { category: "Demographic" }), tag("Female Harem", 95, { category: "Theme-Romance" })], ["Comedy"], "G");
  assert.equal(g.areas.find((a) => a.key === "sexual")!.level, "mild");
  assert.equal(g.madeForKids, true);
  assert.equal(g.suitable, "All ages");
  assert.equal(parentsGuide([], ["Horror"], "PG").suitable, "Older teens and adults (17+)");
});

test("theme tags are capped: a show about war and crime isn't automatically 17+", () => {
  const onePiece = parentsGuide([tag("Tragedy", 81, { isMediaSpoiler: true }), tag("War", 77), tag("Slavery", 76, { isMediaSpoiler: true }), tag("Crime", 73), tag("Drugs", 58), tag("Battle Royale", 54)], ["Action", "Adventure"], "PG");
  assert.equal(onePiece.areas.find((a) => a.key === "violence")!.level, "moderate");
  assert.equal(onePiece.suitable, "Teens (13+)");
  const yourName = parentsGuide([tag("Memory Manipulation", 79), tag("Tragedy", 71, { isMediaSpoiler: true })], ["Romance", "Drama"], "PG");
  assert.ok(yourName.areas.every((a) => a.level === "none"));
  assert.equal(yourName.suitable, "Teens (13+)");
  const aot = parentsGuide([tag("Gore", 77), tag("Cannibalism", 69, { isMediaSpoiler: true }), tag("Suicide", 55, { isMediaSpoiler: true })], ["Action"], "R");
  assert.equal(aot.areas.find((a) => a.key === "violence")!.level, "strong");
  assert.equal(aot.suitable, "Older teens and adults (17+)");
});
