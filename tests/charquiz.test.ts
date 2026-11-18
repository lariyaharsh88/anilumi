import { test } from "node:test";
import assert from "node:assert/strict";
import { QUESTIONS, QUIZZES, TRAITS, bestMatch, characterCards } from "../lib/charquiz";

test("character quizzes: every option scores known traits, every character resolves to a page and a picture", () => {
  for (const q of QUESTIONS) for (const o of q.options) for (const t of Object.keys(o.w)) assert.ok((TRAITS as readonly string[]).includes(t), t);
  for (const quiz of QUIZZES) {
    assert.equal(new Set(quiz.characters.map((c) => c.key)).size, quiz.characters.length, `${quiz.slug}: unique keys`);
    for (const c of characterCards(quiz)) {
      assert.ok(c.href.startsWith("/character/") || c.href === `/anime/${quiz.anime}`, c.name);
      assert.ok(c.image, `${quiz.slug}: no picture for ${c.name}`);
    }
  }
});

test("character quizzes: a character's own profile matches that character", () => {
  for (const quiz of QUIZZES) for (const c of quiz.characters) assert.equal(bestMatch(c.profile, quiz.characters).key, c.key, `${quiz.slug}: ${c.key}`);
});
