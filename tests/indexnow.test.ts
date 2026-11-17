import { test } from "node:test";
import assert from "node:assert/strict";
import { CHUNK_SIZE, SENT_WINDOW_MS, changedEntries, chunk, episodeUrls, freshUrls, recordSent } from "../lib/indexnow";

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

const H = 3600_000;
const NOW = Date.parse("2026-11-17T06:17:00Z");
const u = (n: number) => `https://anilumi.in/anime/show-${n}`;

test("a URL sent within the window is skipped; one sent longer ago, or never, goes again", () => {
  const log = { [u(1)]: NOW - 90 * 60_000, [u(2)]: NOW - 71 * H, [u(3)]: NOW - 72 * H, [u(4)]: NOW - 100 * H };
  assert.equal(SENT_WINDOW_MS, 72 * H);
  assert.deepEqual(freshUrls([u(1), u(2), u(3), u(4), u(5)], log, NOW), [u(3), u(4), u(5)]);
  assert.deepEqual(freshUrls([u(5), u(1), u(5)], log, NOW), [u(5)], "duplicates go once, in order");
  assert.deepEqual(freshUrls([u(1)], log, NOW, 60 * 60_000), [u(1)], "a shorter window lets it through");
});

test("two runs 90 minutes apart: the second sends nothing the first already sent", () => {
  const changed = Array.from({ length: 91 }, (_, i) => u(i));
  const first = freshUrls(changed, {}, NOW);
  const log = recordSent({}, first, NOW);
  assert.deepEqual(freshUrls(changed, log, NOW + 90 * 60_000), []);
  assert.deepEqual(freshUrls([...changed, u(200)], log, NOW + 90 * 60_000), [u(200)]);
});

test("recording marks URLs as sent now and prunes entries past the window, without changing the old log", () => {
  const old = { [u(1)]: NOW - 73 * H, [u(2)]: NOW - 10 * H, [u(3)]: NaN };
  const log = recordSent(old, [u(2), u(4)], NOW);
  assert.deepEqual(log, { [u(2)]: NOW, [u(4)]: NOW });
  assert.deepEqual(recordSent(old, [], NOW), { [u(2)]: NOW - 10 * H });
  assert.equal(old[u(1)], NOW - 73 * H);
});

test("small groups: at most CHUNK_SIZE URLs each, nothing lost", () => {
  assert.equal(CHUNK_SIZE, 20);
  const urls = Array.from({ length: 91 }, (_, i) => u(i));
  const groups = chunk(urls);
  assert.deepEqual(groups.map((g) => g.length), [20, 20, 20, 20, 11]);
  assert.deepEqual(groups.flat(), urls);
  assert.deepEqual(chunk([]), []);
  assert.deepEqual(chunk([1, 2, 3], 2), [[1, 2], [3]]);
  assert.throws(() => chunk([1], 0));
});
