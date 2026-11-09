import { test } from "node:test";
import assert from "node:assert/strict";
import { BOT_UA, needsConsent, tzNeedsConsent } from "../lib/consent";

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

test("analytics skip crawlers and AI fetchers, not real browsers", () => {
  for (const ua of [
    "Mozilla/5.0 (compatible; Baiduspider/2.0; +http://www.baidu.com/search/spider.html)",
    "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36; compatible; OAI-SearchBot/1.4; +https://openai.com/",
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) HeadlessChrome/120.0.0.0 Safari/537.36",
    "Mozilla/5.0 (Linux; Android 7.0;) AppleWebKit/537.36 (HTML, like Gecko) Mobile Safari/537.36 (compatible; PetalBot;+https://webmaster.petalsearch.com/site/petalbot)",
  ]) assert.equal(BOT_UA.test(ua), true, ua);
  for (const ua of [
    "Mozilla/5.0 (Linux; Android 14; SM-S928B) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
    "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Mobile/15E148 Safari/604.1",
    "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0",
  ]) assert.equal(BOT_UA.test(ua), false, ua);
});
