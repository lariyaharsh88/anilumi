import { test } from "node:test";
import assert from "node:assert/strict";
import { publicGenres, mainGenres, getCategory, HIDDEN_GENRES, kitsuOffset } from "../lib/kitsu";

test("adult tags are never listed or linked", () => {
  const cats = [{ id: "1", slug: "romance", title: "Romance" }, { id: "2", slug: "loli", title: "Loli" }, { id: "3", slug: "ecchi", title: "Ecchi" }, { id: "4", slug: "harem", title: "Harem" }];
  assert.deepEqual(publicGenres(cats).map((c) => c.slug), ["romance"]);
  assert.deepEqual(mainGenres({ categories: cats }).map((c) => c.slug), ["romance"]);
});

test("hidden genres have no page", async () => {
  for (const slug of HIDDEN_GENRES) assert.equal(await getCategory(slug), null);
});

test("kitsuOffset: filtered listings ask a page further while Kitsu's offset bug lasts", () => {
  assert.equal(kitsuOffset(0, 20, true, true), 0);
  assert.equal(kitsuOffset(20, 20, true, true), 40);
  assert.equal(kitsuOffset(20, 20, false, true), 20); // unfiltered listings page correctly
  assert.equal(kitsuOffset(20, 20, true, false), 20); // bug fixed upstream: no shift
});
