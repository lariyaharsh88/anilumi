import { test } from "node:test";
import assert from "node:assert/strict";
import { parseMalXml } from "../lib/mal";
import { quizFilter, describe } from "../lib/quiz";
import { encodeTiers, decodeTiers, emptyTiers } from "../lib/tierlist";
import { parseBdParams, allDays, nextDays, bdPath, birthdaysOn, todayJst } from "../lib/birthdays";
import { normaliseThemes, themeLabel } from "../lib/themes";
import { computeWrapped } from "../lib/wrapped";
import type { WatchItem } from "../lib/watchlist";

test("parseMalXml reads status, progress and score, skipping unknown statuses", () => {
  const xml = `<?xml version="1.0"?><myanimelist>
    <anime><series_animedb_id>16498</series_animedb_id><series_title><![CDATA[Shingeki no Kyojin]]></series_title><my_watched_episodes>12</my_watched_episodes><my_score>9</my_score><my_status>Watching</my_status></anime>
    <anime><series_animedb_id>21</series_animedb_id><my_watched_episodes>0</my_watched_episodes><my_status>Plan to Watch</my_status></anime>
    <anime><series_animedb_id>1</series_animedb_id><my_status>On-Hold</my_status></anime>
    <anime><series_animedb_id>5</series_animedb_id><my_status>Completed</my_status></anime>
    <anime><series_animedb_id>7</series_animedb_id><my_status>Weird</my_status></anime>
  </myanimelist>`;
  assert.deepEqual(parseMalXml(xml), [
    { malId: 16498, status: "watching", progress: 12, score: 9 },
    { malId: 21, status: "planning", progress: 0, score: 0 },
    { malId: 1, status: "paused", progress: 0, score: 0 },
    { malId: 5, status: "completed", progress: 0, score: 0 },
  ]);
  assert.deepEqual(parseMalXml("<html>not mal</html>"), []);
});

test("quizFilter maps answers to Kitsu filters", () => {
  assert.deepEqual(quizFilter({ mood: "cozy", len: "short", era: "new", tone: "light" }), { categories: "slice-of-life", subtype: "TV", episodeCount: "1..13", seasonYear: "2018..", ageRating: "G,PG" });
  assert.deepEqual(quizFilter({ mood: "nope", len: "movie", era: "any", tone: "any" }), { subtype: "movie" });
  assert.equal(describe({ mood: "action", len: "long", era: "any", tone: "dark" }), "hype fights · i want a long journey (30+) · dark and mature");
});

test("tier lists round-trip through the URL and reject junk", () => {
  const t = { ...emptyTiers(), S: ["1", "2"], B: ["3"] };
  assert.equal(encodeTiers(t), "S.1,2;B.3");
  assert.deepEqual(decodeTiers("S.1,2;B.3"), t);
  assert.deepEqual(decodeTiers("S.1,1,x;Z.9;A.2<script>"), { ...emptyTiers(), S: ["1"] });
  assert.equal(Object.values(decodeTiers("S." + Array.from({ length: 80 }, (_, i) => i + 1).join(","))).flat().length, 60);
});

test("birthday dates parse, enumerate and wrap", () => {
  assert.deepEqual(parseBdParams("march", "30"), { m: 3, d: 30 });
  assert.deepEqual(parseBdParams("february", "29"), { m: 2, d: 29 });
  assert.equal(parseBdParams("february", "30"), null);
  assert.equal(parseBdParams("march", "05"), null);
  assert.equal(allDays().length, 366);
  assert.deepEqual(nextDays(12, 31, 2), [{ m: 1, d: 1 }, { m: 1, d: 2 }]);
  assert.equal(bdPath(12, 25), "/birthdays/december/25");
  assert.deepEqual(todayJst(new Date("2026-03-29T16:30:00Z")), { m: 3, d: 30 });
  const src = { characters: [{ id: 1, n: "A", i: null, m: 5, d: 5, f: 10, s: null, t: "X" }, { id: 2, n: "B", i: null, m: 5, d: 5, f: 99, s: "x", t: "Y" }], people: [] };
  assert.deepEqual(birthdaysOn(5, 5, src).characters.map((c) => c.n), ["B", "A"]);
});

test("normaliseThemes orders openings before endings and credits aliases", () => {
  const t = normaliseThemes([
    { type: "ED", sequence: 1, slug: "ED1", song: { title: "End", artists: [{ name: "B" }] }, animethemeentries: [{ version: 1, episodes: "1-12", spoiler: false, nsfw: false }] },
    { type: "OP", sequence: 2, slug: "OP2", song: { title: "Two", artists: [{ name: "A", artistsong: { as: "Char" } }] }, animethemeentries: [] },
    { type: "OP", sequence: null, slug: "OP", song: null, animethemeentries: [] },
    { type: "IN", sequence: 1, slug: "IN1", song: null, animethemeentries: [] },
  ]);
  assert.deepEqual(t.map((x) => x.slug), ["OP", "OP2", "ED1"]);
  assert.deepEqual(t[1].artists, ["A (as Char)"]);
  assert.equal(themeLabel(t[2]), "Ending 1");
});

test("computeWrapped totals hours, genres and persona", () => {
  const it = (p: Partial<WatchItem>): WatchItem => ({ id: "1", slug: "x", title: "X", poster: null, status: "finished", nextRelease: null, addedAt: 0, ...p });
  const w = computeWrapped([
    it({ id: "1", title: "Long", progress: 10, episodeLength: 24, runtime: 24 * 25, genres: ["Romance", "Comedy"], listStatus: "watching" }),
    it({ id: "2", title: "Short", progress: 2, episodeLength: 24, runtime: 24 * 12, genres: ["Romance"], listStatus: "planning", status: "current", nextRelease: "2026-11-01T00:00:00Z" }),
  ], Date.parse("2026-10-24T00:00:00Z"));
  assert.equal(w.minutesWatched, 12 * 24);
  assert.equal(w.minutesPlanned, 15 * 24 + 10 * 24);
  assert.equal(w.topGenres[0].name, "Romance");
  assert.equal(w.persona.title, "The Hopeless Romantic");
  assert.equal(w.mostWatched?.title, "Long");
  assert.equal(w.nextUp?.title, "Short");
  assert.equal(computeWrapped([]).persona.title, "The Curious Newcomer");
});
