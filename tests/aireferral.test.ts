import { test } from "node:test";
import assert from "node:assert/strict";
import { aiSource } from "../lib/aireferral";

test("visitors from AI assistants are named by referrer or utm_source", () => {
  assert.equal(aiSource("https://copilot.microsoft.com/"), "copilot");
  assert.equal(aiSource("https://edgeservices.bing.com/edgesvc/chat"), "copilot");
  assert.equal(aiSource("https://chatgpt.com/"), "chatgpt");
  assert.equal(aiSource("", "?utm_source=chatgpt.com"), "chatgpt");
  assert.equal(aiSource("https://www.perplexity.ai/search/x"), "perplexity");
  assert.equal(aiSource("https://gemini.google.com/app"), "gemini");
  assert.equal(aiSource("https://claude.ai/chat/1"), "claude");
  assert.equal(aiSource("", "?utm_source=copilot"), "copilot");
});

test("search engines, social sites and junk are not AI referrals", () => {
  assert.equal(aiSource("https://www.bing.com/"), null); // Bing search and Copilot share it
  assert.equal(aiSource("https://www.google.com/"), null);
  assert.equal(aiSource("https://notchatgpt.com.evil.example/"), null);
  assert.equal(aiSource("not a url"), null);
  assert.equal(aiSource("", "?utm_source=newsletter"), null);
});
