import { test } from "node:test";
import assert from "node:assert/strict";
import { SURNAMES, GIVEN, givenFor, makeName, toKatakana } from "../lib/jpnames";

test("japanese names: lists are complete and filters by gender", () => {
  for (const n of [...SURNAMES, ...GIVEN]) assert.ok(n.kanji && n.romaji && n.meaning, n.romaji);
  assert.ok(givenFor("boy").every((n) => n.g !== "girl") && givenFor("girl").every((n) => n.g !== "boy"));
  const { surname, given } = makeName("girl", () => 0);
  assert.equal(surname.romaji, SURNAMES[0].romaji);
  assert.notEqual(givenFor("girl").indexOf(given as never), -1);
});

test("japanese names: names written in katakana the loanword way", () => {
  const cases: [string, string][] = [["Harsh", "ハルシュ"], ["Priya", "プリヤ"], ["Rahul", "ラフル"], ["Aarav", "アーラヴ"], ["Ananya", "アナンヤ"], ["John", "ジョン"], ["Sarah", "サラ"], ["Michael", "ミカエル"], ["Harsh Lariya", "ハルシュ・ラリヤ"]];
  for (const [name, want] of cases) assert.equal(toKatakana(name), want, name);
});
