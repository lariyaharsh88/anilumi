import { test } from "node:test";
import assert from "node:assert/strict";

test("zodiacOf: sign boundaries", async () => {
  const { zodiacOf } = await import("../lib/birthdays");
  const cases: [number, number, string][] = [[1, 1, "Capricorn"], [1, 19, "Capricorn"], [1, 20, "Aquarius"], [3, 20, "Pisces"], [3, 21, "Aries"], [11, 5, "Scorpio"], [11, 22, "Sagittarius"], [12, 21, "Sagittarius"], [12, 22, "Capricorn"]];
  for (const [m, d, sign] of cases) assert.equal(zodiacOf(m, d).name, sign, `${m}/${d}`);
});

test("aroundDays wraps across the new year", async () => {
  const { aroundDays } = await import("../lib/birthdays");
  assert.deepEqual(aroundDays(1, 2, 3).map((x) => `${x.m}/${x.d}`), ["12/30", "12/31", "1/1", "1/3", "1/4", "1/5"]);
});
