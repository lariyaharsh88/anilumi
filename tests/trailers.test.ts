import { test } from "node:test";
import assert from "node:assert/strict";
import { withTrailers } from "../lib/trailers";
import type { PreviewItem } from "../lib/preview";

test("only shows with a trailer, most anticipated first", () => {
  const item = (id: number, popularity: number) => ({ id, popularity, title: `A${id}` }) as PreviewItem;
  const out = withTrailers([item(1, 50), item(2, 900), item(3, 400)], new Map([[1, "aaaaaaaaaaa"], [2, "bbbbbbbbbbb"]]));
  assert.deepEqual(out.map((i) => [i.id, i.video]), [[2, "bbbbbbbbbbb"], [1, "aaaaaaaaaaa"]]);
});
