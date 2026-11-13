import { test } from "node:test";
import assert from "node:assert/strict";
import { bySpoiler } from "../lib/chardeep";

test("deep profiles: spoiler items go behind the toggle, the rest stay visible, order kept", () => {
  const xs = [{ n: 1, spoiler: false }, { n: 2, spoiler: true }, { n: 3, spoiler: false }];
  assert.deepEqual(bySpoiler(xs), { open: [xs[0], xs[2]], hidden: [xs[1]] });
  assert.deepEqual(bySpoiler(undefined), { open: [], hidden: [] });
});
