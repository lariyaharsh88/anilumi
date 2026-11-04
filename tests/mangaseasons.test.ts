import { test } from "node:test";
import assert from "node:assert/strict";
import { adaptedRange, shortRange, continueAt, type Adaptation } from "../lib/mangaseasons";

test("adaptation wording for manga and light novels", () => {
  const m: Adaptation = { medium: "manga", unit: "chapter", from: 1, to: 33, continue: 34 };
  const ln: Adaptation = { medium: "light novel", unit: "volume", from: 4, to: 4, continue: null };
  assert.equal(adaptedRange(m), "manga chapters 1–33");
  assert.equal(adaptedRange(ln), "light novel volume 4");
  assert.equal(shortRange(m), "ch. 1–33");
  assert.equal(continueAt(m), "chapter 34");
  assert.equal(continueAt(ln), null);
});
