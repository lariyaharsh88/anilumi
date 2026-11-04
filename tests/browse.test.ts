import { test } from "node:test";
import assert from "node:assert/strict";
import { applyBrowse, facet, isFiltered, NO_FILTER, type BrowseItem } from "../lib/browse";

const it = (id: string, o: Partial<BrowseItem>): BrowseItem => ({ id, slug: id, title: id, poster: null, subtype: "TV", year: "2026", eps: 12, rating: null, users: 0, status: "current", start: null, genres: [], services: [], ...o });
const items = [
  it("a", { users: 900, rating: 70, genres: ["Action"], services: ["Crunchyroll"], start: "2026-10-03" }),
  it("b", { users: 500, rating: 85, genres: ["Action", "Comedy"], services: ["Netflix"], start: "2026-10-10" }),
  it("c", { users: 700, subtype: "movie", genres: ["Comedy"], services: ["Crunchyroll"], start: "2026-11-01" }),
];

test("browse: filters combine; sorts by popularity, score (unrated last) or newest", () => {
  assert.deepEqual(applyBrowse(items, NO_FILTER).map((a) => a.id), ["a", "c", "b"]);
  assert.deepEqual(applyBrowse(items, { ...NO_FILTER, sort: "score" }).map((a) => a.id), ["b", "a", "c"]);
  assert.deepEqual(applyBrowse(items, { ...NO_FILTER, sort: "newest" }).map((a) => a.id), ["c", "b", "a"]);
  assert.deepEqual(applyBrowse(items, { ...NO_FILTER, genre: "Comedy", service: "Crunchyroll" }).map((a) => a.id), ["c"]);
  assert.deepEqual(applyBrowse(items, { ...NO_FILTER, format: "TV" }).map((a) => a.id), ["a", "b"]);
  assert.equal(isFiltered(NO_FILTER), false);
  assert.equal(isFiltered({ ...NO_FILTER, sort: "score" }), true);
});

test("browse facets: counts, most common first, small ones dropped", () => {
  assert.deepEqual(facet(items, "services"), [{ value: "Crunchyroll", n: 2 }, { value: "Netflix", n: 1 }]);
  assert.deepEqual(facet(items, "genres", 2), [{ value: "Action", n: 2 }, { value: "Comedy", n: 2 }]);
  assert.deepEqual(facet(items, "subtype"), [{ value: "TV", n: 2 }, { value: "movie", n: 1 }]);
});
