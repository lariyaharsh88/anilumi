import { test } from "node:test";
import assert from "node:assert/strict";
import { allSnapChars, isSnapOnly, snapByPage } from "../lib/charsnap";
import pages from "../data/character-pages-extra.json";

test("snapshot-only character pages: each slug finds its character, and none clashes with a Kitsu page", () => {
  const slugs = Object.values((pages as { pages: Record<string, string> }).pages);
  assert.equal(new Set(slugs).size, slugs.length, "slugs are unique");
  for (const [id, slug] of Object.entries((pages as { pages: Record<string, string> }).pages)) {
    assert.ok(isSnapOnly(slug), slug);
    assert.equal(snapByPage(slug)?.id, Number(id), `${slug} resolves to AniList ${id}`);
  }
  // A Kitsu-linked character never takes a snapshot-only slug (the page would show the wrong one).
  const counts = new Map<string, number>();
  for (const c of allSnapChars()) if (c.k) counts.set(c.k, (counts.get(c.k) ?? 0) + 1);
  assert.ok(slugs.every((s) => counts.get(s) === 1), "each snapshot-only slug belongs to exactly one character");
  assert.equal(snapByPage("suguru-geto")?.n, "Suguru Getou");
});
