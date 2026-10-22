import { test } from "node:test";
import assert from "node:assert/strict";
import type { Anime } from "../lib/kitsu";

// The module reads its key at import time, so set it and stub fetch before importing.
process.env.TMDB_API_KEY = "test-key";
const calls: string[] = [];
globalThis.fetch = (async (input: string | URL) => {
  const url = String(input);
  calls.push(url);
  const json = (b: unknown) => new Response(JSON.stringify(b), { status: 200, headers: { "Content-Type": "application/json" } });
  if (url.includes("/find/81797")) return json({ tv_results: [{ id: 37854, name: "One Piece" }] });
  if (url.includes("/search/tv")) return json({ results: [{ id: 209867, name: "Frieren: Beyond Journey's End", original_name: "葬送のフリーレン", first_air_date: "2023-09-29", genre_ids: [16], origin_country: ["JP"], original_language: "ja", popularity: 50 }] });
  if (url.includes("/watch/providers")) return json({ results: { US: { link: "https://www.themoviedb.org/tv/209867/watch?locale=US", flatrate: [{ provider_id: 283, provider_name: "Crunchyroll", logo_path: "/cr.jpg", display_priority: 1 }] } } });
  return new Response("{}", { status: 404 });
}) as typeof fetch;

const anime = (over: Partial<Anime>): Anime => ({
  id: "1", slug: "x", title: "X", titleEn: null, titleJp: null, synopsis: "", rating: null, userCount: 0, favoritesCount: 0, popularityRank: null, ratingRank: null,
  startDate: null, endDate: null, nextRelease: null, ageRating: null, ageRatingGuide: null, subtype: "TV", status: "finished", poster: null, cover: null,
  episodeCount: null, episodeLength: null, totalLength: null, youtubeVideoId: null, nsfw: false, categories: [], streaming: [], ...over,
});

test("findTmdb uses the TVDB id when Kitsu has one", async () => {
  const { findTmdb } = await import("../lib/tmdb");
  const ref = await findTmdb(anime({ title: "One Piece", startDate: "1999-10-20" }), { "thetvdb/series": "81797" });
  assert.deepEqual(ref, { type: "tv", id: 37854, name: "One Piece" });
  assert.ok(calls.some((c) => c.includes("/find/81797") && c.includes("external_source=tvdb_id") && c.includes("api_key=test-key")));
});

test("findTmdb falls back to scored title search, and providers resolve for a country", async () => {
  const { findTmdb, getProviders, providersFor } = await import("../lib/tmdb");
  const ref = await findTmdb(anime({ title: "Sousou no Frieren", titleEn: "Frieren: Beyond Journey's End", startDate: "2023-09-29" }), {});
  assert.equal(ref?.id, 209867);
  const p = providersFor(await getProviders(ref!), "US");
  assert.equal(p.groups[0].providers[0].name, "Crunchyroll");
  assert.equal(p.link, "https://www.themoviedb.org/tv/209867/watch?locale=US");
});
