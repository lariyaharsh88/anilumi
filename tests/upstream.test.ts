import { test } from "node:test";
import assert from "node:assert/strict";

// Stub fetch before importing so lib/kitsu uses it.
let mode: "down" | "empty" = "down";
globalThis.fetch = (async () => {
  if (mode === "down") throw new TypeError("fetch failed");
  return new Response(JSON.stringify({ data: [] }), { status: 200, headers: { "Content-Type": "application/json" } });
}) as typeof fetch;

test("an outage throws UpstreamError instead of looking like 'not found'", async () => {
  const { getAnimeBySlug, UpstreamError } = await import("../lib/kitsu");
  mode = "down";
  await assert.rejects(getAnimeBySlug("naruto"), (e: unknown) => e instanceof UpstreamError);
});

test("an empty result is a genuine not-found (null)", async () => {
  const { getAnimeBySlug } = await import("../lib/kitsu");
  mode = "empty";
  assert.equal(await getAnimeBySlug("does-not-exist"), null);
});
