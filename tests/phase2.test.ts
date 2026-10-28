import { test } from "node:test";
import assert from "node:assert/strict";
import { keyStaffFrom, groupWork, staffPath, personPath } from "../lib/anilist";
import { toPersonFacts, toStudioFacts } from "../lib/wikidata";
import { toQuote } from "../lib/quote";
import { mainRoles } from "../components/PersonProfile";

const node = (id: number, name: string, occ: string[] = []) => ({ id, name: { full: name }, image: { medium: null }, primaryOccupations: occ });

test("keyStaffFrom picks key roles in order, strips duplicates, flags voice actors", () => {
  const ks = keyStaffFrom([
    { role: "Director", node: node(1, "Tetsurou Araki") },
    { role: "Original Creator", node: node(2, "Hajime Isayama") },
    { role: "Director of Photography", node: node(9, "Not A Director") },
    { role: "Music", node: node(3, "Hiroyuki Sawano") },
    { role: "Episode Director (ep 3)", node: node(8, "Someone") },
    { role: "Director (eps 1-12)", node: node(1, "Tetsurou Araki") },
    { role: "Series Composition", node: node(4, "Yasuko Kobayashi", ["Voice Actor"]) },
  ]);
  assert.deepEqual(ks.map((k) => [k.role, k.people.map((p) => p.name)]), [["Original creator", ["Hajime Isayama"]], ["Director", ["Tetsurou Araki"]], ["Series composition", ["Yasuko Kobayashi"]], ["Music", ["Hiroyuki Sawano"]]]);
  assert.equal(ks[2].people[0].voices, true);
  assert.equal(personPath(ks[2].people[0]), "/voice-actor/4-yasuko-kobayashi");
  assert.equal(staffPath({ id: 1, name: "Tetsurō Araki" }), "/staff/1-tetsuro-araki");
});

test("groupWork merges roles per anime, drops adult titles, most popular first", () => {
  const m = (id: number, popularity: number, isAdult = false) => ({ id, format: "TV", title: { romaji: `R${id}`, english: null }, popularity, seasonYear: 2013, startDate: null, averageScore: 80, coverImage: null, isAdult });
  const w = groupWork([{ staffRole: "Director", node: m(1, 10) }, { staffRole: "Storyboard (ep 1)", node: m(1, 10) }, { staffRole: "Director", node: m(2, 99) }, { staffRole: "Director", node: m(3, 500, true) }]);
  assert.deepEqual(w.map((x) => [x.media.id, x.roles]), [[2, ["Director"]], [1, ["Director", "Storyboard (ep 1)"]]]);
  assert.deepEqual(mainRoles(w), ["Director", "Storyboard"]);
  const m2 = (id: number) => ({ id, format: "TV", title: { romaji: `R${id}`, english: null }, popularity: id, seasonYear: 2013, startDate: null, averageScore: 80, coverImage: null, isAdult: false });
  const storyboardHeavy = groupWork([1, 2, 3].map((i) => ({ staffRole: "Storyboard (ep 1)", node: m2(i) })).concat([{ staffRole: "Director", node: m2(4) }]));
  assert.equal(mainRoles(storyboardHeavy)[0], "Director", "a director is headlined as one even with more storyboard credits");
});

test("Wikidata rows collapse into facts; city preferred over country", () => {
  const v = (x: string) => ({ value: x });
  assert.deepEqual(toPersonFacts([{ item: v("http://www.wikidata.org/entity/Q1"), placeLabel: v("Tokyo"), awardLabel: v("Seiyu Award") }, { item: v("http://www.wikidata.org/entity/Q1"), awardLabel: v("Tokyo Anime Award") }]), { qid: "Q1", birthPlace: "Tokyo", awards: ["Seiyu Award", "Tokyo Anime Award"], website: null });
  const st = toStudioFacts([{ item: v("http://www.wikidata.org/entity/Q2"), inception: v("1981-01-01T00:00:00Z"), hqLabel: v("Japan"), site: v("https://www.kyotoanimation.co.jp/en/") }, { item: v("http://www.wikidata.org/entity/Q2"), hqLabel: v("Uji"), site: v("https://www.kyotoanimation.co.jp") }])!;
  assert.deepEqual(st, { qid: "Q2", founded: 1981, headquarters: "Uji", founders: [], parent: null, website: "https://www.kyotoanimation.co.jp" });
  assert.equal(toPersonFacts([]), null);
});

test("toQuote validates the response and links the anime", () => {
  const ok = { status: "success", data: { content: " Be who you are. ", anime: { name: "Naruto" }, character: { name: "Naruto Uzumaki" } } };
  assert.deepEqual(toQuote(ok, (n) => (n === "Naruto" ? "naruto" : null)), { text: "Be who you are.", anime: "Naruto", character: "Naruto Uzumaki", slug: "naruto" });
  assert.equal(toQuote({ status: "error" }), null);
  assert.equal(toQuote({ ...ok, data: { ...ok.data, content: "x".repeat(400) } }), null);
});

test("retryDelay: 429 honours Retry-After (capped), transient errors retry twice, client errors never", async () => {
  const { retryDelay } = await import("../lib/anilist");
  assert.equal(retryDelay({ status: 429, retryAfter: 3 }, 0), 3000);
  assert.equal(retryDelay({ status: 429, retryAfter: 60 }, 1), 8000);
  assert.equal(retryDelay({ status: 429 }, 2), null);
  assert.equal(retryDelay({ network: true }, 0), 700);
  assert.equal(retryDelay({ status: 503 }, 1), 1800);
  assert.equal(retryDelay({ status: 502 }, 2), null);
  assert.equal(retryDelay({ status: 400 }, 0), null);
});
