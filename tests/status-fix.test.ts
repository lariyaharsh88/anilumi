import { test } from "node:test";
import assert from "node:assert/strict";
import { withStatusFix } from "../lib/kitsu";
import fixes from "../data/status-fixes.json";

test("status fixes: a show Kitsu still calls current but AniList has as finished reads as finished", () => {
  const [id, fix] = Object.entries((fixes as { shows: Record<string, { endDate: string }> }).shows)[0];
  const a = withStatusFix({ id, status: "current" as const, endDate: null, nextRelease: "2026-11-20T15:00:00Z", episodeCount: null });
  assert.equal(a.status, "finished");
  assert.equal(a.endDate, fix.endDate);
  assert.equal(a.nextRelease, null);
  // Untouched: shows not in the file, and shows Kitsu already marks finished.
  const other = { id: "zzz", status: "current" as const, endDate: null, nextRelease: null, episodeCount: 12 };
  assert.equal(withStatusFix(other), other);
});
