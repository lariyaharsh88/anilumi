import { test } from "node:test";
import assert from "node:assert/strict";
import { needsConsent, tzNeedsConsent } from "../lib/consent";

test("consent: EEA, UK and Switzerland are asked; India and the US are not", () => {
  for (const c of ["DE", "FR", "IE", "NO", "IS", "GB", "CH", "de"]) assert.equal(needsConsent(c), true, c);
  for (const c of ["IN", "US", "JP", "BR", "AU", "RU", "TR"]) assert.equal(needsConsent(c), false, c);
});

test("consent fallback: European time zones ask, others don't, unknown asks", () => {
  assert.equal(tzNeedsConsent("Europe/Berlin"), true);
  assert.equal(tzNeedsConsent("Europe/London"), true);
  assert.equal(tzNeedsConsent("Atlantic/Canary"), true);
  assert.equal(tzNeedsConsent("Europe/Moscow"), false);
  assert.equal(tzNeedsConsent("Asia/Kolkata"), false);
  assert.equal(tzNeedsConsent("America/New_York"), false);
  assert.equal(tzNeedsConsent(null), true);
  assert.equal(needsConsent(null, "Asia/Kolkata"), false);
});
