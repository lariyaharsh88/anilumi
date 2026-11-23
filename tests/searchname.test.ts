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
