import { test } from "node:test";
import assert from "node:assert/strict";
import { findLastAiredIndex, Episode } from "../lib/kitsu";

const ep = (n: number, airdate: string | null): Episode => ({ id: String(n), number: n, title: null, airdate, synopsis: null, length: null, thumbnail: null });

function series(total: number, dated: number) {
  const calls: number[] = [];
  const at = async (i: number) => {
    calls.push(i);
    return ep(i + 1, i < dated ? "2020-01-01" : null);
  };
  return { at, calls };
}
const aired = (e: Episode | null) => Boolean(e?.airdate);

test("finds the last dated episode in a padded series with few calls", async () => {
  const { at, calls } = series(1410, 743);
  const r = await findLastAiredIndex(1410, at, aired);
  assert.equal(r.episode?.number, 743);
  assert.ok(calls.length <= 14, `used ${calls.length} calls`);
});

test("returns the final episode directly when it is dated", async () => {
  const { at, calls } = series(25, 25);
  const r = await findLastAiredIndex(25, at, aired);
  assert.equal(r.episode?.number, 25);
  assert.equal(calls.length, 1);
});

test("handles nothing aired and empty series", async () => {
  const { at } = series(12, 0);
  assert.equal((await findLastAiredIndex(12, at, aired)).index, -1);
  assert.equal((await findLastAiredIndex(0, at, aired)).index, -1);
});
