import { test } from "node:test";
import assert from "node:assert/strict";
import { pickMatch, providersFor, baseTitle, TmdbHit, ProvidersPayload } from "../lib/tmdb";

const hits: TmdbHit[] = [
  { id: 1, name: "Frieren", original_name: "Frieren", first_air_date: "2010-01-01", genre_ids: [18], origin_country: ["US"], original_language: "en", popularity: 90 },
  { id: 2, name: "Frieren: Beyond Journey's End", original_name: "葬送のフリーレン", first_air_date: "2023-09-29", genre_ids: [16, 10759], origin_country: ["JP"], original_language: "ja", popularity: 60 },
];

test("pickMatch prefers the Japanese animated show over a same-named live-action one", () => {
  assert.equal(pickMatch(hits, { titles: ["Frieren: Beyond Journey's End", "Sousou no Frieren"], year: 2023 })?.id, 2);
});

test("pickMatch rejects weak matches", () => {
  assert.equal(pickMatch([hits[0]], { titles: ["Sousou no Frieren"], year: 2023 }), null);
});

test("baseTitle strips season and part suffixes", () => {
  assert.equal(baseTitle("Sousou no Frieren Season 2"), "Sousou no Frieren");
  assert.equal(baseTitle("Attack on Titan: The Final Season Part 2").startsWith("Attack on Titan"), true);
  assert.equal(baseTitle("Kusuriya no Hitorigoto 3rd Season"), "Kusuriya no Hitorigoto");
});

test("providersFor groups one country's providers and merges free + ads", () => {
  const payload: ProvidersPayload = {
    results: {
      US: {
        link: "https://www.themoviedb.org/tv/209867/watch?locale=US",
        flatrate: [{ provider_id: 283, provider_name: "Crunchyroll", logo_path: "/cr.jpg", display_priority: 2 }, { provider_id: 8, provider_name: "Netflix", logo_path: "/nf.jpg", display_priority: 1 }],
        ads: [{ provider_id: 283, provider_name: "Crunchyroll", logo_path: "/cr.jpg", display_priority: 2 }],
        free: [{ provider_id: 999, provider_name: "Pluto", logo_path: null, display_priority: 5 }],
      },
      IN: { flatrate: [{ provider_id: 283, provider_name: "Crunchyroll", logo_path: "/cr.jpg", display_priority: 1 }] },
    },
  };
  const us = providersFor(payload, "US");
  assert.deepEqual(us.groups.map((g) => g.kind), ["stream", "free"]);
  assert.deepEqual(us.groups[0].providers.map((p) => p.name), ["Netflix", "Crunchyroll"]);
  assert.equal(us.groups[1].providers.length, 2);
  assert.equal(us.groups[0].providers[0].logo, "https://image.tmdb.org/t/p/w92/nf.jpg");
  assert.deepEqual(us.countries, ["IN", "US"]);
  assert.deepEqual(providersFor(payload, "FR").groups, []);
  assert.deepEqual(providersFor(null, "US"), { link: null, groups: [], countries: [] });
});
