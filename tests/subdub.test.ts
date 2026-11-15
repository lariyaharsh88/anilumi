import { test } from "node:test";
import assert from "node:assert/strict";
import { dubRows, dubsByService, dubsPerSeason, seasonEnglishDubs } from "../lib/subdub";
import type { Streams } from "../lib/streams";
import type { DubShow } from "../lib/dubschedule";

const svc = (service: string, audio: string[]) => ({ service, kind: "subscription" as const, audio, subs: ["en"], scope: "All", url: null });
const entries: Streams[] = [
  { s: "aot", t: "Attack on Titan", regions: { US: [svc("Crunchyroll", ["ja", "en"]), svc("Hulu", ["ja", "en"])], IN: [svc("Crunchyroll", ["ja", "hi"])] }, note: "", sources: [] },
  { s: "mono", t: "Mononoke", regions: { US: [svc("Crunchyroll", ["ja"])] }, note: "", sources: [] },
];

test("dubbed or sub only, where the English dub streams, and whether there's a Hindi dub", () => {
  const [aot, mono] = dubRows(entries);
  assert.deepEqual(aot.en, { US: ["Crunchyroll", "Hulu"] });
  assert.ok(aot.english && aot.hindi);
  assert.ok(!mono.english && !mono.hindi);
  assert.deepEqual(dubsByService(dubRows(entries)), [{ service: "Crunchyroll", count: 1 }, { service: "Hulu", count: 1 }]);
});

test("seasons in order with their simuldubs; this season's English dubs, airing before announced", () => {
  const s = dubsPerSeason({ "2026-spring": { en: [{ when: "simuldub" }, { when: "later" }] }, "2025-fall": { en: [{ when: "simuldub" }] }, "2026-winter": { en: [] } });
  assert.deepEqual(s.map((x) => `${x.year}-${x.season}:${x.dubs}/${x.simuldubs}`), ["2025-fall:1/1", "2026-spring:2/1"]);
  const show = (t: string, lang: string, status: DubShow["status"], premiere: string | null) => ({ t, lang, status, premiere }) as DubShow;
  assert.deepEqual(seasonEnglishDubs([show("A", "en", "announced", "2026-12-01"), show("B", "hi", "airing", "2026-10-01"), show("C", "en", "airing", "2026-10-05")]).map((x) => x.t), ["C", "A"]);
});
