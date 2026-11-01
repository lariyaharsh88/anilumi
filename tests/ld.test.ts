import { test } from "node:test";
import assert from "node:assert/strict";
import { isoDuration, itemList, workRef, workId, siteGraph, ORG_ID, SITE_ID } from "../lib/ld";
import { site } from "../lib/site";

test("ISO 8601 durations", () => {
  assert.equal(isoDuration(24), "PT24M");
  assert.equal(isoDuration(120), "PT2H");
  assert.equal(isoDuration(2215), "PT36H55M");
  assert.equal(isoDuration(0), "PT0M");
});

test("ItemList positions and absolute URLs", () => {
  const l = itemList("Best", [{ url: "/anime/naruto", name: "Naruto" }, { url: "https://example.com/x", name: "X", image: null }], 21);
  assert.equal(l.numberOfItems, 2);
  assert.deepEqual(l.itemListElement.map((x) => x.position), [21, 22]);
  assert.equal(l.itemListElement[0].url, `${site.url}/anime/naruto`);
  assert.equal(l.itemListElement[1].url, "https://example.com/x");
  assert.ok(!("image" in l.itemListElement[1]));
});

test("anime references share one @id per work", () => {
  const tv = workRef({ slug: "naruto", subtype: "TV", title: "Naruto" });
  assert.equal(tv["@type"], "TVSeries");
  assert.equal(tv["@id"], workId({ slug: "naruto" }));
  assert.equal(workRef({ slug: "kimi-no-na-wa", subtype: "movie", title: "Your Name." })["@type"], "Movie");
});

test("site graph links the website to its publisher", () => {
  const [org, web] = siteGraph()["@graph"] as Record<string, unknown>[];
  assert.equal(org["@id"], ORG_ID);
  assert.equal(web["@id"], SITE_ID);
  assert.deepEqual(web.publisher, { "@id": ORG_ID });
});
