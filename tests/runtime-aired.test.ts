import { test } from "node:test";
import assert from "node:assert/strict";
import { airedOnly, runtimeMinutes } from "../lib/kitsu";

test("runtime: an airing show counts aired episodes, not Kitsu's placeholder total", () => {
  const onePiece = { status: "current" as const, episodeCount: null, episodeLength: 24, totalLength: 33840 };
  assert.equal(runtimeMinutes(onePiece), 33840); // 1,410 records × 24 min
  assert.equal(runtimeMinutes(airedOnly(onePiece, 1180)), 1180 * 24);
  // A season with a planned count: never above the plan, never above what aired.
  assert.equal(airedOnly({ status: "current" as const, episodeCount: 12, episodeLength: 24, totalLength: 288 }, 6).episodeCount, 6);
  // Finished shows and unknown aired counts are left alone.
  const done = { status: "finished" as const, episodeCount: 25, episodeLength: 24, totalLength: 600 };
  assert.equal(airedOnly(done, 10), done);
  assert.equal(airedOnly(onePiece, null), onePiece);
});
