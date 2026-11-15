import { test } from "node:test";
import assert from "node:assert/strict";
import { changedEntries, episodeUrls } from "../lib/indexnow";

test("a new episode changes its own page, the show and the episode list", () => {
  assert.deepEqual(episodeUrls("/anime/Black-Clover-Season-2/episode/8"), [
    "https://anilumi.in/anime/Black-Clover-Season-2/episode/8", "https://anilumi.in/anime/Black-Clover-Season-2", "https://anilumi.in/anime/Black-Clover-Season-2/episodes",
  ]);
});

test("only real changes since the cutoff: build-time hourly and daily stamps are left to the crawl", () => {
  const url = (loc: string, mod: string, freq: string) => `<url><loc>${loc}</loc><lastmod>${mod}</lastmod><changefreq>${freq}</changefreq></url>`;
  const xml = [
    url("https://anilumi.in/", "2026-11-15T03:32:45.343Z", "hourly"),
    url("https://anilumi.in/anime/one-piece", "2026-11-15T03:32:45.343Z", "daily"),
    url("https://anilumi.in/watch-order/naruto", "2026-11-15T00:00:00.000Z", "weekly"),
    url("https://anilumi.in/character/l-lawliet", "2026-11-01T00:00:00.000Z", "monthly"),
  ].join("\n");
  assert.deepEqual(changedEntries(xml, Date.parse("2026-11-14T06:00:00Z")), ["https://anilumi.in/watch-order/naruto"]);
});
