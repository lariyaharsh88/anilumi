import { test } from "node:test";
import assert from "node:assert/strict";
import { roleLine, vaNote } from "../lib/vanotes";
import data from "../data/va-notes.json";

test("voice actor notes: sourced entries; a debut with only the title agreed still reads well", () => {
  for (const [id, n] of Object.entries((data as { people: Record<string, { sources: string[] }> }).people)) assert.ok(n.sources.length >= 2, id);
  assert.equal(roleLine({ character: "Momoka Kawakabe", anime: "Touka Gettan", year: 2007 }), "Momoka Kawakabe in Touka Gettan (2007)");
  assert.equal(roleLine({ character: null, anime: "Wowser", year: 1988 }), "Wowser (1988)");
  assert.ok(vaNote(95869));
});
