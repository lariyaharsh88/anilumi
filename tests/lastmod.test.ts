import { test } from "node:test";
import assert from "node:assert/strict";
import { latest, weekStart, monthStart, SITE_UPDATED } from "../lib/lastmod";

const now = new Date("2026-11-20T15:00:00Z");

test("latest: newest date, never before SITE_UPDATED, never in the future", () => {
  assert.equal(latest(now, "2026-11-10", "2026-11-12").toISOString().slice(0, 10), "2026-11-12");
  assert.equal(latest(now, "2026-01-01").toISOString().slice(0, 10), SITE_UPDATED);
  assert.equal(latest(now, "2027-01-01").getTime(), now.getTime());
  assert.equal(latest(now, null, undefined).toISOString().slice(0, 10), SITE_UPDATED);
});

test("week and month starts are UTC Monday / the 1st", () => {
  assert.equal(weekStart(now).toISOString(), "2026-11-16T00:00:00.000Z"); // Fri 20 Nov → Mon 16 Nov
  assert.equal(weekStart(new Date("2026-11-16T03:00:00Z")).toISOString(), "2026-11-16T00:00:00.000Z");
  assert.equal(weekStart(new Date("2026-11-22T23:00:00Z")).toISOString(), "2026-11-16T00:00:00.000Z"); // Sunday
  assert.equal(monthStart(now).toISOString(), "2026-11-01T00:00:00.000Z");
});
