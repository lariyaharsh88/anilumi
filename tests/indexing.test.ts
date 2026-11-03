import { test } from "node:test";
import assert from "node:assert/strict";
import { episodeIndexed, characterIndexed, robotsFor, searchShown, INDEXED_CHARACTERS } from "../lib/indexing";
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

test("characters: top favourites indexed, the long tail not", () => {
  const all = topCharacterSlugs(5000);
  assert.ok(all.length > INDEXED_CHARACTERS);
  assert.equal(characterIndexed(all[0]), true);
  assert.equal(characterIndexed("eren-jager"), true); // shown in Search Console
  const tail = all.slice(INDEXED_CHARACTERS).find((s) => !searchShown(`/character/${s}`))!;
  assert.equal(characterIndexed(tail), false);
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
});

test("similar pages: top titles indexed, the long tail not", async () => {
  const { similarIndexed, similarSlugs, INDEXED_SIMILAR } = await import("../lib/indexing");
  const top = similarSlugs();
  assert.ok(top.length > 200 && top.length <= INDEXED_SIMILAR); // the alias index repeats a few slugs
  assert.equal(similarIndexed(top[0]), true);
  assert.equal(similarIndexed("zzz-not-a-real-anime"), false);
});
