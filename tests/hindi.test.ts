import { test } from "node:test";
import assert from "node:assert/strict";
import { hiDuration, hiDays, hiDate, hiExpected, hiCount, HINDI_SLUGS, hasHindi, hindiPath } from "../lib/hindi";

test("Hindi durations, days and dates", () => {
  assert.equal(hiDuration(2215), "36 घंटे 55 मिनट");
  assert.equal(hiDuration(120), "2 घंटे");
  assert.equal(hiDuration(45), "45 मिनट");
  assert.equal(hiDays(2215), 19);
  assert.equal(hiDays(30), 1);
  assert.equal(hiDate("2027-01-10"), "10 जनवरी 2027");
  assert.equal(hiDate("2027-11"), "नवंबर 2027");
  assert.equal(hiDate(null), null);
  assert.equal(hiExpected("January 2027"), "जनवरी 2027");
  assert.equal(hiExpected("2027"), "2027");
  assert.equal(hiCount(1, "मूवी", "मूवीज़"), "1 मूवी");
  assert.equal(hiCount(3, "मूवी", "मूवीज़"), "3 मूवीज़");
});

test("Hindi guides cover the labelled watch orders", () => {
  assert.ok(HINDI_SLUGS.length >= 40);
  assert.ok(hasHindi("naruto") && hasHindi("kimetsu-no-yaiba"));
  assert.equal(hindiPath("naruto"), "/hi/anime/naruto");
});
