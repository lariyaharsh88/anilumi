import { test } from "node:test";
import assert from "node:assert/strict";
test("episodeMinutes: trusts episodeLength, then AniList, and refuses implausible implied lengths", async () => {
  const { episodeMinutes } = await import("../lib/binge");
  assert.equal(episodeMinutes({ episodeCount: 24, episodeLength: 24, totalLength: 1 }), 24);
  assert.equal(episodeMinutes({ episodeCount: 24, episodeLength: null, totalLength: 176, subtype: "TV" }, 23), 23);
  assert.equal(episodeMinutes({ episodeCount: 24, episodeLength: null, totalLength: 176, subtype: "TV" }), 0);
  assert.equal(episodeMinutes({ episodeCount: 12, episodeLength: null, totalLength: 48, subtype: "ONA" }), 4);
});
