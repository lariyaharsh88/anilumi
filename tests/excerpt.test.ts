import { test } from "node:test";
import assert from "node:assert/strict";
import { excerpt } from "../lib/excerpt";

test("short text is kept, minus source credits", () => {
  assert.equal(excerpt("A boy becomes a pirate. (Source: Crunchyroll)", 300), "A boy becomes a pirate.");
  assert.equal(excerpt("A boy becomes a pirate.\n\n[Written by MAL Rewrite]", 300), "A boy becomes a pirate.");
  assert.equal(excerpt(null, 300), "");
});

test("long text ends on a full sentence past the halfway point", () => {
  const t = "First sentence is here. Second sentence is a bit longer than that. Third one never fits in the limit at all.";
  assert.equal(excerpt(t, 80), "First sentence is here. Second sentence is a bit longer than that.");
});

test("without a late sentence end, cuts on a word with an ellipsis", () => {
  const t = "One very long sentence that keeps going and going without stopping for breath anywhere";
  const e = excerpt(t, 40);
  assert.ok(e.endsWith("…") && e.length <= 41, e);
  assert.ok(!/\s…$/.test(e));
});
