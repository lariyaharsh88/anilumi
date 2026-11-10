import { test } from "node:test";
import assert from "node:assert/strict";
import { nextDub, releasedBy, type DubShow } from "../lib/dubschedule";
import { audioLine, safeUrl } from "../lib/streams";

const show = (o: Partial<DubShow>): DubShow => ({
  t: "Test", slug: null, lang: "en", service: "Crunchyroll", region: "US", status: "airing", premiere: "2026-10-17T17:30Z",
  weekday: "Saturday", episodes: 12, released: null, delay: null, note: "", url: "", confidence: "high", sources: [], ...o,
});
const at = (iso: string) => Date.parse(iso);

test("dub schedule: next episode lands on the weekday after now, at the premiere's time", () => {
  // Premiere Sat 17 Oct 17:30 UTC; on Tue 10 Nov four have aired (17, 24, 31 Oct, 7 Nov), so ep 5 on Sat 14 Nov.
  const n = nextDub(show({}), at("2026-11-10T12:00:00Z"))!;
  assert.equal(n.episode, 5);
  assert.equal(new Date(n.at).toISOString(), "2026-11-14T17:30:00.000Z");
  assert.equal(n.timed, true);
});

test("dub schedule: same day before the release time still counts as next", () => {
  const n = nextDub(show({}), at("2026-11-14T10:00:00Z"))!;
  assert.equal(new Date(n.at).toISOString(), "2026-11-14T17:30:00.000Z");
  assert.equal(n.episode, 5);
});

test("dub schedule: upcoming premiere, finished dubs and batch drops", () => {
  assert.equal(nextDub(show({ premiere: "2026-12-01" }), at("2026-11-10T00:00:00Z"))!.episode, 1);
  assert.equal(nextDub(show({ status: "complete" }), at("2026-11-10T00:00:00Z")), null);
  assert.equal(nextDub(show({ episodes: 3 }), at("2026-11-10T00:00:00Z")), null, "all 3 dubbed by 31 Oct");
  assert.equal(nextDub(show({ weekday: null }), at("2026-11-10T00:00:00Z")), null, "no weekly day: no guess");
});

test("dub schedule: dubbed-so-far uses the larger of the source count and the weekly count", () => {
  assert.equal(releasedBy(show({}), at("2026-11-10T00:00:00Z")), 4);
  assert.equal(releasedBy(show({ released: 6 }), at("2026-11-10T00:00:00Z")), 6, "double-episode premiere");
  assert.equal(releasedBy(show({ weekday: null, released: null }), at("2026-11-10T00:00:00Z")), null);
});

test("streams: audio labels and safe links", () => {
  assert.equal(audioLine({ service: "Crunchyroll", kind: "subscription", audio: ["ja", "en", "hi"], subs: ["en"], scope: "", url: null }), "Sub + English dub + Hindi dub");
  assert.equal(audioLine({ service: "Netflix", kind: "subscription", audio: ["ja"], subs: [], scope: "", url: null }), "Japanese");
  assert.equal(safeUrl("https://www.crunchyroll.com/series/GRDV0019R"), "https://www.crunchyroll.com/series/GRDV0019R");
  assert.equal(safeUrl("javascript:alert(1)"), null);
  assert.equal(safeUrl("http://example.com"), null);
});
