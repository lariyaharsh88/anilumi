import { test } from "node:test";
import assert from "node:assert/strict";
import { formatCode, normalizeCode, mergeLists, cleanDoc, listHash } from "../lib/syncmerge";

const it = (id: string, addedAt: number, extra: Record<string, unknown> = {}) => ({ id, slug: `s${id}`, title: `T${id}`, poster: null, status: "finished", nextRelease: null, addedAt, ...extra });

test("codes: 16 base32 characters in groups; typing mistakes are forgiven", () => {
  const code = formatCode(new Uint8Array(16).map((_, i) => i * 7));
  assert.match(code, /^[0-9A-Z]{4}(-[0-9A-Z]{4}){3}$/);
  assert.equal(normalizeCode(code.toLowerCase().replace(/-/g, " ")), code);
  assert.equal(normalizeCode("k7qm 2xra 9fhc p4tb"), "K7QM-2XRA-9FHC-P4TB");
  assert.equal(normalizeCode("KOQM-2XRA-9FHC-P4TB"), "K0QM-2XRA-9FHC-P4TB"); // O read as zero
  assert.equal(normalizeCode("too-short"), null);
  assert.equal(normalizeCode(42), null);
});

test("merge: union, newest edit wins, removals beat older edits but not newer re-adds", () => {
  const a = { items: [it("1", 10), it("2", 20, { progress: 3, editedAt: 50 })], removed: {} };
  const b = { items: [it("2", 20, { progress: 5, editedAt: 60 }), it("3", 30)], removed: { "1": 40 } };
  const m = mergeLists(a, b, 1000);
  assert.deepEqual(m.items.map((x) => x.id), ["2", "3"]); // 1 removed at 40, after its add at 10
  assert.equal(m.items.find((x) => x.id === "2")!.progress, 5);
  const readded = mergeLists({ items: [it("1", 70)], removed: {} }, { items: [], removed: { "1": 40 } }, 1000);
  assert.deepEqual(readded.items.map((x) => x.id), ["1"]);
  assert.deepEqual(readded.removed, {});
  const old = mergeLists({ items: [], removed: { "9": 1 } }, { items: [], removed: {} }, 400 * 86400000);
  assert.deepEqual(old.removed, {});
});

test("cleanDoc keeps known fields only and rejects junk; hash ignores fetched details", () => {
  const d = cleanDoc({ items: [it("5", 1, { runtime: 999, evil: "<script>", poster: "javascript:x", listStatus: "watching", progress: 2.7 }), { id: "x" }], removed: { "7": 3, bad: 4 } })!;
  assert.equal(d.items.length, 1);
  assert.equal("evil" in d.items[0], false);
  assert.equal(d.items[0].poster, null);
  assert.equal(d.items[0].progress, 2);
  assert.deepEqual(d.removed, { "7": 3 });
  assert.equal(cleanDoc({ items: "no" }), null);
  assert.equal(listHash({ items: [it("1", 1, { runtime: 5 })], removed: {} }), listHash({ items: [it("1", 1)], removed: {} }));
});
