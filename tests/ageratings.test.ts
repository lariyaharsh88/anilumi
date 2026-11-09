import { test } from "node:test";
import assert from "node:assert/strict";
import { officialRatings, ratingsLine } from "../lib/ageratings";
import data from "../data/age-ratings.json";

test("official ratings: each comes with its source page; the summary groups bodies by rating", () => {
  for (const [slug, e] of Object.entries((data as { shows: Record<string, { ratings: { url: string; rating: string }[] }> }).shows)) {
    for (const r of e.ratings) assert.ok(/^https?:\/\//.test(r.url) && r.rating, slug);
  }
  const op = officialRatings("one-piece")!;
  assert.equal(ratingsLine(op), "U/A 16+ (Crunchyroll, Netflix India); TV-14 (US TV)");
  assert.equal(officialRatings("zzz-not-a-show"), null);
});
