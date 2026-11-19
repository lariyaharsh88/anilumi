import { test } from "node:test";
import assert from "node:assert/strict";
import { moodsOf, pick, type PickItem } from "../lib/picker";

const item = (s: string, o: Partial<PickItem> = {}): PickItem => ({ s, t: s, p: null, y: 2020, sub: "TV", st: "finished", e: 12, min: 288, sc: 8, moods: ["action"], hi: [], free: false, why: [], ...o });

test("picker: moods come from genres and strong tags", () => {
  assert.deepEqual(moodsOf(["Action", "Comedy"], []), ["action", "funny"]);
  assert.deepEqual(moodsOf(["Adventure"], ["Isekai"]), ["fantasy"]);
});

test("picker: every answer filters, best first, and relaxes free, then finished, then length when short", () => {
  const items = [item("a"), item("b", { hi: ["Netflix"] }), item("c", { hi: ["Netflix"], free: true, e: 100, st: "current" }), item("d", { moods: ["romance"] })];
  const a = { mood: "action", length: "weekend", finished: true, hindi: true, free: false } as const;
  assert.deepEqual(pick(items, a, 1).list.map((x) => x.s), ["b"]);
  const r = pick(items, { ...a, free: true }, 1);
  assert.deepEqual(r.list.map((x) => x.s), ["b"]);
  assert.deepEqual(r.relaxed, ["free only"]);
  const r2 = pick(items, a, 2);
  assert.deepEqual(r2.relaxed, ["finished only", "length"]);
  assert.deepEqual(r2.list.map((x) => x.s), ["b", "c"]);
});
