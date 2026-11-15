import { test } from "node:test";
import assert from "node:assert/strict";
import { numberedSeasons, seriesEpisodes, type WatchEntry } from "../lib/kitsu";

const e = (id: string, title: string, kind: WatchEntry["kind"], episodeCount: number | null, subtype = "TV") =>
  ({ anime: { id, slug: id, title, subtype, episodeCount }, step: 0, kind, note: "", optional: false }) as unknown as WatchEntry;

test("episodes across every season: main TV entries only, the anime's own count from the page", () => {
  const wo = { entries: [e("1", "Vinland Saga", "main", 24), e("2", "Vinland Saga Season 2", "main", 24), e("3", "Movie", "movie", 1, "movie"), e("4", "OVA", "side", 2)] };
  assert.equal(seriesEpisodes(wo, { id: "1" }, 24), 48);
  assert.equal(seriesEpisodes(wo, { id: "2" }, 10), 34);
});

test("an unknown episode count anywhere means no total", () => {
  assert.equal(seriesEpisodes({ entries: [e("1", "A", "main", 12), e("2", "A Season 2", "main", null)] }, { id: "1" }, 12), 0);
});

test("numbered seasons, not a new series", () => {
  assert.ok(numberedSeasons({ entries: [e("1", "Attack on Titan", "main", 25), e("2", "Attack on Titan Final Season", "main", 16)] }, { id: "1" }));
  assert.ok(!numberedSeasons({ entries: [e("1", "Naruto", "main", 220), e("2", "Naruto: Shippuuden", "main", 500)] }, { id: "1" }));
});
