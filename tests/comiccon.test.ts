import { test } from "node:test";
import assert from "node:assert/strict";
import { ccDates, ccLive, ccNext, ccUpcoming, istDay, inr } from "../lib/comiccon";

test("comic con: the next edition is the soonest one that hasn't ended (IST days)", () => {
  assert.equal(ccNext("2026-11-19")?.slug, "navi-mumbai");
  assert.equal(ccNext("2026-11-29")?.slug, "navi-mumbai"); // last day still counts
  assert.equal(ccNext("2026-11-30")?.slug, "delhi");
  assert.ok(ccUpcoming("2026-12-06").every((e) => e.end >= "2026-12-06"));
  const delhi = ccUpcoming("2026-12-05").find((e) => e.slug === "delhi")!;
  assert.equal(ccLive(delhi, "2026-12-05"), true);
  assert.equal(ccLive(delhi, "2026-12-07"), false);
});

test("comic con: dates and prices read naturally", () => {
  assert.equal(ccDates({ start: "2026-12-05", end: "2026-12-06" }), "5–6 Dec 2026");
  assert.equal(ccDates({ start: "2026-11-28", end: "2026-12-02" }), "28 Nov – 2 Dec 2026");
  assert.equal(inr(1199), "₹1,199");
  assert.equal(inr(0), "Free");
  assert.equal(istDay(new Date("2026-12-04T19:00:00Z")), "2026-12-05"); // 00:30 IST
});
