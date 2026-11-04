import { test } from "node:test";
import assert from "node:assert/strict";
import { oneLinkPerSite, streamCoverage } from "../lib/wostreams";

const link = (site: string, url = `https://${site.toLowerCase()}.com/x`) => ({ id: url, url, subs: [], dubs: [], site });

test("stream coverage: entries per site, most first, a site counted once per entry", () => {
  const streams = new Map([["1", [link("Crunchyroll"), link("Crunchyroll", "https://crunchyroll.com/dub"), link("Netflix")]], ["2", [link("Crunchyroll")]], ["3", []]]);
  assert.deepEqual(streamCoverage(["1", "2", "3", "2"], streams), [{ site: "Crunchyroll", n: 2 }, { site: "Netflix", n: 1 }]);
});

test("one link per site keeps the first", () => {
  assert.deepEqual(oneLinkPerSite([link("Hulu", "a"), link("Hulu", "b"), link("Netflix", "c")]).map((s) => s.url), ["a", "c"]);
});
