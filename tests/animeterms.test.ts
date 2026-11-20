import { test } from "node:test";
import assert from "node:assert/strict";
import { HONORIFIC_TABLE, KIND_LABEL, TERMS, termBySlug } from "../lib/animeterms";

test("anime dictionary: 37 unique terms, every field filled, related terms exist", () => {
  assert.equal(TERMS.length, 37);
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

test("anime dictionary: every kind has a label and terms; the honorifics table links real honorific entries", () => {
  for (const kind of Object.keys(KIND_LABEL)) assert.ok(TERMS.some((t) => t.kind === kind), `no ${kind} terms`);
  const honorifics = TERMS.filter((t) => t.kind === "honorific").map((t) => t.slug);
  for (const s of ["san", "kun", "chan", "sama", "senpai", "sensei", "dono", "onii-chan", "onee-chan"]) assert.ok(honorifics.includes(s), s);
  for (const [slug, suffix] of HONORIFIC_TABLE) {
    assert.equal(termBySlug(slug)?.kind, "honorific", slug);
    assert.equal(suffix, `-${slug}`);
  }
  // Slugs are the searched form, never a hyphen prefix ("san", not "-san"); the A to Z index groups by first letter.
  for (const t of TERMS) assert.match(t.term, /^[A-Z]/, t.slug);
});
