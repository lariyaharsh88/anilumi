import { test } from "node:test";
import assert from "node:assert/strict";
import { compareIndexable } from "../lib/kitsu";

const g = (slug: string) => ({ id: slug, slug, title: slug });
const show = (userCount: number, genres: string[]) => ({ userCount, categories: genres.map(g) }) as unknown as Parameters<typeof compareIndexable>[0];

test("compare pages: only well-known, related pairs are offered to search engines", () => {
  assert.equal(compareIndexable(show(900000, ["action", "adventure"]), show(400000, ["action"])), true);
  assert.equal(compareIndexable(show(900000, ["action"]), show(1200, ["action"])), false); // obscure title
  assert.equal(compareIndexable(show(900000, ["romance"]), show(400000, ["sports"])), false); // nothing in common
});
