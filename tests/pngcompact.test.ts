import { test } from "node:test";
import assert from "node:assert/strict";
import UPNG from "upng-js";
import { compactPng } from "../lib/pngcompact";

test("compactPng: a full-colour card comes back as a smaller 256-colour PNG of the same size", async () => {
  const w = 1200, h = 630, rgba = new Uint8Array(w * h * 4);
  // Noisy, photo-like pixels (posters are what made real cards 400-760 KB); a fixed seed keeps the test stable.
  let seed = 7;
  const rnd = () => ((seed = (seed * 1103515245 + 12345) >>> 0) >>> 16) & 255;
  for (let i = 0; i < w * h; i++) rgba.set([rnd(), rnd(), rnd(), 255], i * 4);
  const original = UPNG.encode([rgba.buffer], w, h, 0);
  const res = await compactPng(new Response(original, { headers: { "content-type": "image/png", "cache-control": "public, max-age=60" } }));
  const out = await res.arrayBuffer();
  assert.ok(out.byteLength < original.byteLength, `${out.byteLength} < ${original.byteLength}`);
  const img = UPNG.decode(out);
  assert.equal(img.width, w);
  assert.equal(img.height, h);
  assert.equal(res.headers.get("content-type"), "image/png");
  assert.equal(res.headers.get("cache-control"), "public, max-age=60");
});

test("compactPng: anything it can't decode is passed through unchanged", async () => {
  const res = await compactPng(new Response(new Uint8Array([1, 2, 3]), { status: 200, headers: { "content-type": "image/png" } }));
  assert.deepEqual(new Uint8Array(await res.arrayBuffer()), new Uint8Array([1, 2, 3]));
});
