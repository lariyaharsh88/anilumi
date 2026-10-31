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

test("overrides can force the main order and move entries to skip", async () => {
  const wo = await buildWatchOrder(s1, fetchRelations, { "1": { intro: "note", mainOrder: ["3", "1", "2"], skip: ["5"] } });
  assert.equal(wo.intro, "note");
  assert.deepEqual(wo.entries.filter((e) => e.kind === "main").map((e) => e.anime.id), ["3", "1", "2"]);
  assert.equal(wo.entries.find((e) => e.anime.id === "5")?.kind, "recap");
  assert.equal(wo.totalMinutes, 288 * 3);
});

test("overrides match a non-root entry and demote a prequel side story", async () => {
  const prequel = mk("6", "Prequel OVA", { subtype: "OVA", episodeCount: 2, totalLength: 50 });
  const g: Record<string, Relation[]> = { ...graph, "6": [{ role: "sequel", anime: s1 }], "1": [{ role: "prequel", anime: prequel }, ...graph["1"]] };
  const wo = await buildWatchOrder(s2, async (id) => g[id] || [], { "2": { intro: "keyed on season 2", demote: ["6"] } });
  assert.equal(wo.intro, "keyed on season 2");
  assert.equal(wo.root.id, "1");
  assert.deepEqual(wo.entries.filter((e) => e.kind === "main").map((e) => e.anime.id), ["1", "2", "3"]);
  const d = wo.entries.find((e) => e.anime.id === "6")!;
  assert.equal(d.kind, "side");
  assert.equal(d.attachedTo, "1");
  assert.ok(wo.entries.findIndex((e) => e.anime.id === "6") > wo.entries.findIndex((e) => e.anime.id === "1"));
});

test("runtimeMinutes ignores negative or tiny totalLength", async () => {
  const { runtimeMinutes } = await import("../lib/kitsu");
  assert.equal(runtimeMinutes({ episodeCount: 13, episodeLength: 24, totalLength: -900 }), 312);
  assert.equal(runtimeMinutes({ episodeCount: 1, episodeLength: 24, totalLength: 110 }), 110);
  assert.equal(runtimeMinutes({ episodeCount: null, episodeLength: null, totalLength: null }), 0);
});

test("orderWindow lists short orders whole and keeps the current entry visible in long ones", async () => {
  const { orderWindow } = await import("../lib/kitsu");
  assert.deepEqual(orderWindow(4, 1), [0, 1, 2, 3]);
  assert.deepEqual(orderWindow(9, 0), [0, 1, 2, 3, null, 8]);
  assert.deepEqual(orderWindow(9, -1), [0, 1, 2, 3, null, 8]);
  assert.deepEqual(orderWindow(9, 5), [0, null, 4, 5, 6, null, 8]);
  assert.deepEqual(orderWindow(9, 7), [0, null, 6, 7, 8]);
  assert.deepEqual(orderWindow(9, 8), [0, null, 7, 8]);
});

test("franchiseName uses the searched name, not a longer sequel title", async () => {
  const { franchiseName } = await import("../lib/kitsu");
  const e = (title: string, userCount: number, kind: "main" | "movie" = "main") => ({ anime: mk(title, title, { userCount }), step: 1, kind, note: "", optional: kind !== "main" });
  const root = mk("r", "Root");
  assert.equal(franchiseName({ root, entries: [e("Naruto", 100), e("Naruto: Shippuuden", 200), e("Boruto: Naruto Next Generations", 50)] }), "Naruto");
  assert.equal(franchiseName({ root, entries: [e("Nichijou: Episode 0", 10), e("Nichijou", 300)] }), "Nichijou");
  assert.equal(franchiseName({ root, entries: [e("Toaru Majutsu no Index", 100), e("Toaru Kagaku no Railgun", 300)] }), "Toaru Kagaku no Railgun");
  assert.equal(franchiseName({ root, entries: [e("Movie", 999, "movie")] }), "Root");
  assert.equal(franchiseName({ root, entries: [e("Naruto", 1)], label: "Naruto (editorial)" }), "Naruto (editorial)");
  const en = (title: string, titleEn: string | null) => ({ anime: mk(title, title, { userCount: 1, titleEn }), step: 1, kind: "main" as const, note: "", optional: false });
  assert.equal(franchiseName({ root, entries: [en("Boku no Hero Academia", "My Hero Academia")] }), "My Hero Academia");
  assert.equal(franchiseName({ root, entries: [en("Hunter x Hunter (2011)", null)] }), "Hunter x Hunter");
  assert.equal(franchiseName({ root, entries: [en("Kimetsu", "x".repeat(46))] }), "Kimetsu");
});
