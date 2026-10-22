import { test } from "node:test";
import assert from "node:assert/strict";
import { comparePath, suggestComparePairs, franchiseRoot, Anime } from "../lib/kitsu";

const mk = (id: string, title: string, genres: string[], userCount = 100): Anime => ({
  id, slug: title.toLowerCase().replace(/[^a-z0-9]+/g, "-"), title, titleEn: null, titleJp: null, synopsis: "", rating: null, userCount, favoritesCount: 0,
  popularityRank: null, ratingRank: null, startDate: null, endDate: null, nextRelease: null, ageRating: null, ageRatingGuide: null, subtype: "TV",
  status: "finished", poster: null, cover: null, episodeCount: null, episodeLength: null, totalLength: null, youtubeVideoId: null, nsfw: false,
  categories: genres.map((g, i) => ({ id: `${id}-${i}`, slug: g, title: g })), streaming: [],
});

test("comparePath is order-independent", () => {
  assert.equal(comparePath({ slug: "naruto" }, { slug: "bleach" }), "/compare/bleach-vs-naruto");
  assert.equal(comparePath({ slug: "bleach" }, { slug: "naruto" }), "/compare/bleach-vs-naruto");
});

test("franchiseRoot groups seasons and films", () => {
  assert.equal(franchiseRoot("Attack on Titan Season 2"), franchiseRoot("Attack on Titan"));
  assert.equal(franchiseRoot("Kimetsu no Yaiba: Mugen Ressha-hen"), "kimetsu no yaiba");
});

test("suggestComparePairs pairs by genre overlap, skips same franchise, dedupes", () => {
  const items = [
    mk("1", "Frieren", ["fantasy", "adventure", "drama"], 500),
    mk("2", "Mushoku Tensei", ["fantasy", "adventure", "isekai"], 400),
    mk("3", "Frieren Season 2", ["fantasy", "adventure", "drama"], 300),
    mk("4", "Haikyuu", ["sports", "comedy"], 450),
    mk("5", "Kuroko", ["sports", "comedy"], 200),
  ];
  const pairs = suggestComparePairs(items, 1).map(([a, b]) => [a.id, b.id].sort().join("-"));
  assert.ok(pairs.includes("1-2"), "Frieren pairs with Mushoku, not its own sequel");
  assert.ok(pairs.includes("4-5"));
  assert.equal(new Set(pairs).size, pairs.length);
  assert.ok(!pairs.includes("1-3"));
});
