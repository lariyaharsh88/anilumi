import { test } from "node:test";
import assert from "node:assert/strict";
import { genrePicks, hiddenGems, similarStrength, strongSimilarIds, themesOf, seasonTiers } from "../lib/picks";

test("picks: genre rankings exist for the big genres and weigh score by how many rated it", () => {
  for (const g of ["romance", "action", "isekai", "comedy", "fantasy"]) assert.ok(genrePicks(g).length >= 10, g);
  const r = genrePicks("romance");
  for (let i = 1; i < r.length; i++) assert.ok(r[i - 1].weighted >= r[i].weighted);
  assert.deepEqual(genrePicks("not-a-genre"), []);
  for (const p of hiddenGems(r)) assert.ok(p.score >= 7.8);
});

test("picks: themes skip vague and spoiler tags", () => {
  assert.deepEqual(themesOf([
    { name: "Male Protagonist", rank: 99, category: "Cast-Main Cast", isAdult: false, isMediaSpoiler: false },
    { name: "Twist", rank: 95, category: "Theme", isAdult: false, isMediaSpoiler: true },
    { name: "Detective", rank: 90, category: "Theme", isAdult: false, isMediaSpoiler: false },
  ]), ["Detective"]);
});

test("picks: strong 'anime like' pages need 8 fan picks with 5 sharing themes", () => {
  const ids = strongSimilarIds();
  assert.ok(ids.length > 50, String(ids.length));
  for (const id of ids.slice(0, 20)) { const s = similarStrength(id); assert.ok(s.recs >= 8 && s.reasoned >= 5); }
  assert.equal(similarStrength(-1).strong, false);
});

test("season tiers: fixed cut-offs, popularity floor, most popular first within a tier", () => {
  const e = (anilistId: number, score: number, popularity: number) => ({ anilistId, title: `T${anilistId}`, score, popularity });
  const t = seasonTiers([e(1, 8.6, 50000), e(2, 8.0, 90000), e(3, 7.95, 20000), e(4, 7.0, 30000), e(5, 9.0, 500)]);
  assert.deepEqual(t.map((x) => [x.tier, x.entries.map((y) => y.anilistId)]), [["S", [1]], ["A", [2, 3]], ["C", [4]]]);
});
