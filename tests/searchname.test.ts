import { test } from "node:test";
import assert from "node:assert/strict";
import { englishName } from "../lib/searchname";

const none = () => null;
test("the English name leads when the canonical title is romaji", () => {
  assert.equal(englishName({ id: "50743", title: "Temppal: Item no Chikara", titleEn: null }, () => "Overgeared"), "Overgeared");
  assert.equal(englishName({ id: "1", title: "Boku no Hero Academia", titleEn: "My Hero Academia" }, none), "My Hero Academia");
});

test("no English name when it's the same, contained, too long or not Latin", () => {
  assert.equal(englishName({ id: "1", title: "Attack on Titan", titleEn: "Attack on Titan" }, none), null);
  assert.equal(englishName({ id: "1", title: "Frieren: Beyond Journey's End", titleEn: "Frieren" }, none), null);
  assert.equal(englishName({ id: "1", title: "Doumo, Suki na Hito ni Horegusuri wo Irai sareta Majo desu.", titleEn: "The Witch Who Was Asked to Make a Love Potion by Her Crush" }, none), null);
  assert.equal(englishName({ id: "1", title: "Temppal", titleEn: "템빨" }, none), null);
  assert.equal(englishName({ id: "1", title: "Temppal", titleEn: null }, none), null);
});

test("researched names win for donghua and Ghibli films titled in pinyin or romaji", () => {
  assert.equal(englishName({ id: "1", slug: "xian-wang-de-richang-shenghuo", title: "Xian Wang de Richang Shenghuo", titleEn: null }, () => null), "The Daily Life of the Immortal King");
  assert.equal(englishName({ id: "1", slug: "kimitachi-wa-dou-ikiru-ka", title: "Kimitachi wa Dou Ikiru ka", titleEn: null }, () => null), "The Boy and the Heron");
  assert.equal(englishName({ id: "1", slug: "spirited-away", title: "Spirited Away", titleEn: "Spirited Away" }, () => null), null);
});
