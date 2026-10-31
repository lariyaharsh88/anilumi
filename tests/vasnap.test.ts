import { test } from "node:test";
import assert from "node:assert/strict";
import { memoized, toVoiceActor, type AlStaff } from "../lib/anilist";
import { packSnapshot, unpackSnapshot, IMG_PREFIX } from "../lib/vasnap";

const media = (id: number, adult = false) => ({ id, format: "TV", title: { romaji: `R${id}`, english: null }, popularity: 100 - id, seasonYear: 2020, startDate: { year: 2020 }, averageScore: 80, coverImage: { medium: `${IMG_PREFIX}media/${id}.jpg` }, isAdult: adult });
const staff = (edges: number[], total = edges.length): AlStaff => ({
  id: 7, name: { full: " Kana Hanazawa ", native: "花澤香菜", alternative: ["", "KanaHana"] }, image: { large: `${IMG_PREFIX}staff/large/7.png`, medium: `${IMG_PREFIX}staff/medium/7.png` },
  description: "~!spoiler!~ bio", primaryOccupations: ["Voice Actor"], gender: "Female", dateOfBirth: { year: 1989, month: 2, day: 25 }, age: 37,
  yearsActive: [2003], homeTown: "Tokyo", languageV2: "Japanese", favourites: 9000,
  characterMedia: { pageInfo: { total }, edges: edges.map((id) => ({ characterRole: "MAIN", node: media(id, id === 99), characters: [{ id: id * 10, name: { full: `C${id} ` }, image: null }, null] })) },
});

test("toVoiceActor merges both role pages, once per anime, without adult titles", () => {
  const va = toVoiceActor(staff([1, 2, 99], 60), staff([2, 3]));
  assert.deepEqual(va.roles.map((r) => r.media.id), [1, 2, 3]);
  assert.equal(va.name, "Kana Hanazawa");
  assert.deepEqual(va.alternative, ["KanaHana"]);
  assert.deepEqual(va.roles[0].characters, [{ id: 10, name: "C1", image: null }]);
  assert.equal(va.totalRoles, 60);
});

test("voice-actor snapshot packs image URLs short and unpacks them exactly", () => {
  const s = { generated: "2026-10-30", hub: [{ id: 7, name: "Kana Hanazawa", native: null, image: `${IMG_PREFIX}staff/medium/7.png`, language: "Japanese", favourites: 9000 }], people: { "7": toVoiceActor(staff([1, 2])) } };
  const packed = packSnapshot(s);
  assert.ok(!packed.includes(IMG_PREFIX));
  assert.deepEqual(unpackSnapshot(packed), JSON.parse(JSON.stringify(s)));
});

test("memoized shares one call between concurrent callers and retries after a miss", async () => {
  let calls = 0;
  const fn = async () => { calls++; await new Promise((r) => setTimeout(r, 10)); return calls === 1 ? null : "ok"; };
  const [a, b] = await Promise.all([memoized("t:1", 1000, fn), memoized("t:1", 1000, fn)]);
  assert.deepEqual([a, b, calls], [null, null, 1]);
  assert.equal(await memoized("t:1", 1000, fn), "ok");
  assert.equal(await memoized("t:1", 1000, fn), "ok");
  assert.equal(calls, 2);
});

test("anime snapshot tags drop adult ones and keep the spoiler flag", async () => {
  const { toRawTags } = await import("../lib/alsnap");
  const { packJson, unpackJson, IMG_PREFIX } = await import("../lib/snapjson");
  const t = (name: string, isAdult = false, isMediaSpoiler = false) => ({ name, rank: 80, category: "Theme", isAdult, isMediaSpoiler });
  assert.deepEqual(toRawTags([t("Gore"), t("Nudity", true), t("Death", false, true)]), [["Gore", 80, "Theme", 0], ["Death", 80, "Theme", 1]]);
  const v = { a: `${IMG_PREFIX}x.png`, b: ["~not-an-image", 1] };
  assert.deepEqual(unpackJson(packJson(v)), v);
});
