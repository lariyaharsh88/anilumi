import { test } from "node:test";
import assert from "node:assert/strict";
import { istTime, announcedIn, indiaFacts, sourceUrl, type IndiaShow } from "../lib/seasonindia";

const show = (over: Partial<IndiaShow> = {}): IndiaShow => ({ anilistId: 1, streaming: [], previousSeasonIndia: null, dubs: { hi: null, ta: null, te: null }, ...over });

test("IST times: Japan's broadcast converted to India (UTC+5:30)", () => {
  // 17 Jan 2027 17:00 JST = 08:00 UTC = 13:30 IST
  assert.equal(istTime(Date.UTC(2027, 0, 17, 8, 0) / 1000), "Sun 17 Jan, 1:30 pm IST");
  // Late-night anime: 23:30 JST Saturday = 20:00 IST Saturday
  assert.equal(istTime(Date.UTC(2027, 0, 9, 14, 30) / 1000), "Sat 9 Jan, 8:00 pm IST");
});

test("announced India streaming needs a source; India-confirmed services come first", () => {
  const x = show({ streaming: [
    { service: "Netflix", india: "unclear", kind: "later", sources: ["https://example.com/a"] },
    { service: "Crunchyroll", india: "yes", kind: "simulcast", sources: ["https://example.com/b"] },
    { service: "Rumour TV", india: "yes", kind: "simulcast", sources: [] },
  ] });
  assert.deepEqual(announcedIn(x).map((s) => s.service), ["Crunchyroll", "Netflix"]);
  assert.equal(sourceUrl("javascript:alert(1)"), null);
});

test("a show counts toward indexing only with an India-specific fact", () => {
  assert.equal(indiaFacts(show(), { stream: false, dub: false }), false);
  assert.equal(indiaFacts(undefined, { stream: true, dub: false }), true); // earlier seasons stream in India
  assert.equal(indiaFacts(show({ dubs: { hi: { service: "Crunchyroll", sources: ["https://x.y"] }, ta: null, te: null } }), { stream: false, dub: false }), true);
});

test("Hindi dubs: Apple TV rows that stream via Prime Video count as Prime Video; part URLs point at a page that exists", async () => {
  const { viaPrimeVideo, HINDI_PART_OF, dubPageEntry, HINDI_PARTS } = await import("../lib/hindidub");
  assert.deepEqual(viaPrimeVideo({ name: "Apple TV", scope: "Streams via Prime Video", url: "https://tv.apple.com/in/x" }), { name: "Prime Video", scope: "Hindi audio confirmed on Apple TV India's listing", url: "https://tv.apple.com/in/x" });
  assert.equal(viaPrimeVideo({ name: "Apple TV", scope: "Listed on Apple TV India", url: "https://tv.apple.com/in/y" }).name, "Apple TV");
  for (const [part, root] of Object.entries(HINDI_PART_OF)) {
    assert.ok(dubPageEntry(root), `${part} -> ${root}: no Hindi page`);
    assert.ok(HINDI_PARTS[root], `${root}: the page doesn't name its parts`);
  }
});
