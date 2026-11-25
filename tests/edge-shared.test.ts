import { test } from "node:test";
import assert from "node:assert/strict";
import { isSearchBot, sharedUsable } from "../edge/worker.js";

test("only search engines get the shared last copy", () => {
  assert.equal(isSearchBot("Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)"), true);
  assert.equal(isSearchBot("Mozilla/5.0 (Linux; Android 6.0.1; Nexus 5X) Chrome/131.0 Mobile Safari/537.36 (compatible; Googlebot/2.1)"), true);
  assert.equal(isSearchBot("Mozilla/5.0 (compatible; Google-InspectionTool/1.0;)"), true);
  assert.equal(isSearchBot("Mozilla/5.0 (compatible; bingbot/2.0; +http://www.bing.com/bingbot.htm)"), true);
  assert.equal(isSearchBot("Mozilla/5.0 (compatible; GPTBot/1.2)"), false);
  assert.equal(isSearchBot("Mozilla/5.0 (Macintosh) Safari/605.1.15"), false);
  assert.equal(isSearchBot(null), false);
});

test("a shared copy is served for 90 days after it was stored", () => {
  const now = Date.UTC(2026, 10, 23);
  assert.equal(sharedUsable(now - 89 * 86400_000, now), true);
  assert.equal(sharedUsable(now - 91 * 86400_000, now), false);
});
