import { test } from "node:test";
import assert from "node:assert/strict";
import { episodeIndexed, characterIndexed, robotsFor, searchShown, notedCharacters } from "../lib/indexing";
import { topCharacterSlugs } from "../lib/charsnap";

const ep = (n: number, over: Partial<Parameters<typeof episodeIndexed>[0]> = {}) =>
  episodeIndexed({ path: `/anime/some-show/episode/${n}`, n, upcoming: false, next: false, airIso: null, airing: true, lastAired: 10, ...over });

test("episode pages: upcoming and the latest two aired stay indexed", () => {
  const inDays = (d: number) => new Date(Date.now() + d * 86400_000).toISOString();
  assert.equal(ep(11, { upcoming: true, airIso: inDays(6) }), true);
  assert.equal(ep(14, { upcoming: true, airIso: inDays(27) }), false); // weeks away: only a date so far
  assert.equal(ep(15, { upcoming: true }), false); // no date yet
  assert.equal(ep(11, { upcoming: true, next: true }), true); // the next episode, even before its date is known
  assert.equal(ep(10), true);
  assert.equal(ep(9), true);
  assert.equal(ep(8), false);
  assert.equal(ep(10, { airing: false }), false); // finished show: recaps are noindexed
});

test("episode pages Google already shows stay indexed", () => {
  assert.equal(ep(5, { path: "/anime/Black-Clover-Season-2/episode/5", airing: false }), true);
});

test("characters: pages with verified notes or already in search are indexed, plain database pages not", () => {
  const all = topCharacterSlugs(5000);
  for (const s of notedCharacters()) assert.equal(characterIndexed(s), true, s);
  assert.equal(characterIndexed("eren-jager"), true); // notes, and shown in Search Console
  const plain = all.find((s) => !searchShown(`/character/${s}`) && !notedCharacters().includes(s))!;
  assert.equal(characterIndexed(plain), false);
});

test("voice actors, genres, best-of years and trends: popular or already in search", async () => {
  const { voiceActorIndexed, genreIndexed, bestYearIndexed, trendIndexed, watchOrderIndexed } = await import("../lib/indexing");
  assert.equal(voiceActorIndexed("/voice-actor/1-x", 3), true);
  assert.equal(voiceActorIndexed("/voice-actor/1-x", 50), false);
  assert.equal(genreIndexed("action", true), true);
  assert.equal(genreIndexed("zzz-tiny-genre", false), false);
  const now = new Date("2026-11-09");
  assert.equal(bestYearIndexed(2020, now), true);
  assert.equal(bestYearIndexed(2003, now), false);
  assert.equal(trendIndexed("zzz-genre"), false);
  // Without a guide, two core entries is "watch A then B": not indexed; three is.
  assert.equal(watchOrderIndexed("some-unknown-big-franchise", 5, 2), false);
  assert.equal(watchOrderIndexed("some-unknown-big-franchise", 5, 3), true);
});

test("robotsFor", () => {
  assert.equal(robotsFor(true), undefined);
  assert.deepEqual(robotsFor(false), { index: false, follow: true });
});

test("watch orders: editor guides and 3+ parts indexed, two-part franchises not", async () => {
  const { watchOrderIndexed, franchiseParts } = await import("../lib/indexing");
  assert.equal(watchOrderIndexed("naruto", 25), true); // editor guide
  assert.equal(franchiseParts("attack-on-titan")! >= 3, true);
  assert.equal(watchOrderIndexed("some-unknown-two-parter", 2), false);
  assert.equal(watchOrderIndexed("some-unknown-big-franchise", 5), true);
  // One season plus recaps and OVAs: nothing to order.
  assert.equal(watchOrderIndexed("some-unknown-big-franchise", 5, 1), false);
});

test("similar pages and character tables: only the ones search already shows", async () => {
  const { similarIndexed, similarSlugs, characterTableIndexed, nextSeasonIndexed } = await import("../lib/indexing");
  const shown = similarSlugs();
  assert.ok(shown.length < 50);
  for (const s of shown) assert.equal(similarIndexed(s), true);
  assert.equal(similarIndexed("zzz-not-a-real-anime"), false);
  assert.equal(characterTableIndexed("zzz-not-a-real-anime"), false);
  // Next season: news, or a title popular enough that people ask anyway.
  assert.equal(nextSeasonIndexed("/anime/x/next-season", true, 500), true);
  assert.equal(nextSeasonIndexed("/anime/x/next-season", false, 250_000), true);
  assert.equal(nextSeasonIndexed("/anime/x/next-season", false, 5_000), false);
});
