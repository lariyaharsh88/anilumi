import { test } from "node:test";
import assert from "node:assert/strict";
import { buildWatchOrder, Anime, Relation } from "../lib/kitsu";

const mk = (id: string, title: string, extra: Partial<Anime> = {}): Anime => ({
  id, slug: id, title, titleEn: null, titleJp: null, synopsis: "", rating: null, userCount: 0, favoritesCount: 0, popularityRank: null, ratingRank: null,
  startDate: `20${id.padStart(2, "0")}-01-01`, endDate: null, nextRelease: null, ageRating: null, ageRatingGuide: null, subtype: "TV", status: "finished",
  poster: null, cover: null, episodeCount: 12, episodeLength: 24, totalLength: 288, youtubeVideoId: null, nsfw: false, categories: [], streaming: [], ...extra,
});

const s1 = mk("1", "Season 1"), s2 = mk("2", "Season 2"), s3 = mk("3", "Season 3");
const recap = mk("4", "Recap", { subtype: "special", episodeCount: 1, totalLength: 90 });
const movie = mk("5", "Movie", { subtype: "movie", episodeCount: 1, totalLength: 110 });
const graph: Record<string, Relation[]> = {
  "1": [{ role: "sequel", anime: s2 }, { role: "summary", anime: recap }],
  "2": [{ role: "prequel", anime: s1 }, { role: "sequel", anime: s3 }, { role: "side_story", anime: movie }],
  "3": [{ role: "prequel", anime: s2 }],
  "4": [], "5": [],
};
const fetchRelations = async (id: string) => graph[id] || [];

test("walks back to the root and forward through sequels", async () => {
  const wo = await buildWatchOrder(s3, fetchRelations);
  assert.equal(wo.root.id, "1");
  assert.deepEqual(wo.entries.filter((e) => e.kind === "main").map((e) => e.anime.id), ["1", "2", "3"]);
  assert.equal(wo.mainCount, 3);
});

test("attaches extras after their season and classifies them", async () => {
  const wo = await buildWatchOrder(s1, fetchRelations);
  const ids = wo.entries.map((e) => `${e.kind}:${e.anime.id}`);
  assert.deepEqual(ids, ["main:1", "recap:4", "main:2", "movie:5", "main:3"]);
  assert.equal(wo.entries.find((e) => e.anime.id === "5")?.attachedTo, "2");
});

test("total runtime counts main entries and movies only", async () => {
  const wo = await buildWatchOrder(s1, fetchRelations);
  assert.equal(wo.totalMinutes, 288 * 3 + 110);
});
