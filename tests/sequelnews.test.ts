import { test } from "node:test";
import assert from "node:assert/strict";
import { newsOverrides, sequelNews } from "../lib/sequelnews";
import data from "../data/sequel-news.json";

test("sequel news: every entry is sourced; an announcement overrides a stale 'no sequel' verdict", () => {
  for (const [slug, n] of Object.entries((data as { shows: Record<string, { sources: string[]; what: string }> }).shows)) {
    assert.ok(n.sources.length >= 2 && n.what, slug);
  }
  const op = sequelNews("one-piece");
  assert.equal(newsOverrides(op, "still-airing"), true);
  assert.equal(newsOverrides(sequelNews("death-note"), "none"), false);
  assert.equal(newsOverrides(op, "dated"), false); // the automatic answer already has a date
});
