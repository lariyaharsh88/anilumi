import { test } from "node:test";
import assert from "node:assert/strict";
import { characterNote, debutInShow, linkedArcs } from "../lib/charnotes";
import notes from "../data/character-notes.json";

test("character notes: every entry has a role or a debut, and two sources", () => {
  for (const [slug, n] of Object.entries((notes as { characters: Record<string, { role: string | null; debut: unknown; sources: string[] }> }).characters)) {
    assert.ok(n.role || n.debut, slug);
    assert.ok(n.sources.length >= 2, slug);
  }
});

test("character notes: arcs link to the show's arc list where names match; debut links only in the same show", () => {
  const killua = characterNote("killua-zoldyck")!;
  const arcs = linkedArcs(killua, "hunter-x-hunter-2011");
  assert.ok(arcs.length > 0 && arcs.every((a) => a.arc !== null));
  assert.equal(debutInShow(killua, "Hunter x Hunter (2011)"), true);
  assert.equal(debutInShow(killua, "Naruto"), false);
});
