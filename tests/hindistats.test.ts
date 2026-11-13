import { test } from "node:test";
import assert from "node:assert/strict";
import { hindiArrivals, hindiComing, hindiCast, castShows, dubStats } from "../lib/hindistats";
import { premiereAt } from "../lib/dubschedule";

test("hindistats: arrivals are Hindi, started, newest first, one row per show and service", () => {
  const a = hindiArrivals();
  assert.ok(a.length > 0);
  assert.ok(a.every((e) => e.lang === "hi" && e.status !== "announced"));
  for (let i = 1; i < a.length; i++) assert.ok(premiereAt(a[i - 1]) >= premiereAt(a[i]));
  assert.equal(new Set(a.map((e) => `${e.slug ?? e.t}|${e.service}`)).size, a.length);
  assert.ok(hindiComing().every((e) => e.lang === "hi" && e.status === "announced"));
});

test("hindistats: one cast line per role, leads with pages first", () => {
  const goku = hindiCast("dragon-ball").filter((c) => /goku/i.test(c.character));
  assert.equal(goku.length, 1, "Goku in Z, Kai and Super is one line");
  for (const { cast } of castShows()) {
    const firstWithout = cast.findIndex((c) => !c.characterHref);
    if (firstWithout >= 0) assert.ok(cast.slice(firstWithout).every((c) => !c.characterHref));
  }
});

test("hindistats: access split covers every dub once", () => {
  const s = dubStats();
  assert.equal(s.access.free + s.access.subscription + s.access.tv, s.dubbed);
  assert.equal(s.spread.reduce((n, x) => n + x.value, 0), s.dubbed);
});
