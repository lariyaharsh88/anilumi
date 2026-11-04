import { test } from "node:test";
import assert from "node:assert/strict";
import { inEpisodes, themesForEpisode, type Theme } from "../lib/themes";

const th = (slug: string, song: string, ...episodes: (string | null)[]): Theme => ({ type: slug.startsWith("OP") ? "OP" : "ED", sequence: Number(slug.match(/\d+/)![0]), slug, song, artists: [], entries: episodes.map((e) => ({ version: 1, episodes: e, spoiler: false, nsfw: false })) });

test("episode ranges: lists, single numbers, spaces; junk never matches", () => {
  assert.equal(inEpisodes("1-12, 14-25", 13), false);
  assert.equal(inEpisodes("1-12, 14-25", 14), true);
  assert.equal(inEpisodes("1000", 1000), true);
  assert.equal(inEpisodes("1 - 4", 4), true);
  assert.equal(inEpisodes(null, 1), false);
  assert.equal(inEpisodes("TV 1-3", 2), false);
});

test("themes for an episode: broadcast OP/ED covering it, not dub variants", () => {
  const themes = [th("OP1", "We Are!", "1-47", "1000"), th("OP1-EN", "We Are!", "1-47"), th("OP2", "Believe", "48-115"), th("ED1", "Memories", "1-30"), th("ED2", "Run! Run! Run!", "31-62")];
  assert.deepEqual(themesForEpisode(themes, 5).map((t) => t.slug), ["OP1", "ED1"]);
  assert.deepEqual(themesForEpisode(themes, 1000).map((t) => t.slug), ["OP1"]);
  assert.deepEqual(themesForEpisode(themes, 200), []);
});
