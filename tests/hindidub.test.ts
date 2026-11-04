import { test } from "node:test";
import assert from "node:assert/strict";
import { byPlatform, dubFor, hindiDubbed, notDubbed, platformKind } from "../lib/hindidub";

test("Hindi dubs: every available entry names a platform and an https source", () => {
  const list = hindiDubbed();
  assert.ok(list.length >= 40);
  for (const d of list) {
    assert.ok(d.platforms.length > 0, d.s);
    for (const p of d.platforms) assert.match(p.url, /^https:\/\//, d.s);
  }
  assert.ok(notDubbed().every((d) => d.confidence !== "low"));
});

test("Hindi dubs: sequels find their franchise's entry; unknown anime get none", () => {
  assert.equal(dubFor({ id: "7442", slug: "attack-on-titan" })?.status, "available");
  const aotS2 = dubFor({ id: "8671", slug: "shingeki-no-kyojin-season-2" });
  assert.equal(aotS2?.s, "attack-on-titan");
  assert.equal(dubFor({ id: "0", slug: "not-a-real-anime" }), null);
});

test("Hindi dubs: platform kinds and the by-platform index", () => {
  assert.equal(platformKind("Muse India (YouTube)"), "free");
  assert.equal(platformKind("Sony YAY!"), "tv");
  assert.equal(platformKind("Crunchyroll"), "subscription");
  const p = byPlatform();
  assert.equal(p[0].name, "Crunchyroll");
  for (const x of p) assert.equal(new Set(x.titles.map((t) => t.d.s)).size, x.titles.length, `${x.name} lists a franchise twice`);
});
