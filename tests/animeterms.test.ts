import { test } from "node:test";
import assert from "node:assert/strict";
import { TERMS, termBySlug } from "../lib/animeterms";

test("anime dictionary: 30 unique terms, every field filled, related terms exist", () => {
  assert.equal(TERMS.length, 30);
  assert.equal(new Set(TERMS.map((t) => t.slug)).size, TERMS.length);
  for (const t of TERMS) {
    for (const k of ["term", "jp", "romaji", "short", "literal", "usage", "nuance", "say"] as const) assert.ok(t[k].trim().length > 0, `${t.slug}.${k}`);
    assert.ok(t.hi.word.trim() && t.hi.gloss.trim(), `${t.slug} hindi`);
    assert.ok(/[ऀ-ॿ]/.test(t.hi.word), `${t.slug} hindi in Devanagari`);
    assert.ok(t.examples.length >= 1 && t.examples.every((e) => e.who && e.where && e.note), `${t.slug} examples`);
    assert.equal(t.faq.length, 2, `${t.slug} faq`);
    assert.ok(t.sources.length >= 1 && t.sources.every((u) => u.startsWith("https://")), `${t.slug} sources`);
    for (const r of t.related) assert.ok(termBySlug(r), `${t.slug} → ${r}`);
    for (const c of t.confused ?? []) if (c.slug) assert.ok(termBySlug(c.slug), `${t.slug} confused → ${c.slug}`);
    assert.ok(!t.related.includes(t.slug), `${t.slug} relates to itself`);
  }
});
