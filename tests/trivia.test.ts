import { test } from "node:test";
import assert from "node:assert/strict";
import { MIN_BANK, TRIVIA_SHOWS, guessTheAnimeBank, makeQ, mixedBank, rng, triviaBank, triviaShows } from "../lib/trivia";

const banks = () => [...TRIVIA_SHOWS.map((s) => triviaBank(s.slug)), guessTheAnimeBank(), mixedBank()];

test("trivia: banks are deterministic", () => {
  for (const s of TRIVIA_SHOWS) assert.deepEqual(triviaBank(s.slug), triviaBank(s.slug), s.slug);
  assert.deepEqual(guessTheAnimeBank(), guessTheAnimeBank());
  const a = rng("x"), b = rng("x");
  assert.deepEqual([a(), a(), a()], [b(), b(), b()]);
});

test("trivia: every question has 4 distinct options, a valid answer, a source and no duplicates", () => {
  for (const bank of banks()) {
    for (const q of bank) {
      assert.equal(q.o.length, 4, q.q);
      assert.equal(new Set(q.o).size, 4, q.q);
      assert.ok(q.a >= 0 && q.a < 4, q.q);
      assert.ok(q.h.startsWith("/"), q.q);
      assert.ok(q.x.length > 0, q.q);
    }
  }
  for (const s of TRIVIA_SHOWS) { const b = triviaBank(s.slug); assert.equal(new Set(b.map((q) => q.q)).size, b.length, s.slug); }
});

test("trivia: 'whose birthday is' questions never offer two characters born that day", () => {
  for (const s of TRIVIA_SHOWS) {
    const b = triviaBank(s.slug);
    const byDate = new Map<string, Set<string>>();
    // Birthdays the bank itself states ("X was born on D.").
    for (const q of b) { const m = q.x.match(/^(.+) was born on (\w+ \d+)\.$/); if (m) byDate.set(m[2], new Set([...(byDate.get(m[2]) ?? []), m[1]])); }
    for (const q of b.filter((x) => x.q.includes("character's birthday is"))) {
      const d = q.q.match(/birthday is (\w+ \d+)\?$/)![1];
      const born = byDate.get(d) ?? new Set();
      assert.equal(q.o.filter((o) => born.has(o)).length, 1, q.q);
    }
  }
});

test("trivia: every listed show has enough questions; makeQ refuses a thin pool", () => {
  assert.ok(triviaShows().length >= 8);
  for (const s of triviaShows()) assert.ok(triviaBank(s.slug).length >= MIN_BANK, s.slug);
  assert.equal(makeQ("q", "a", ["b", "c"], "x", "/", rng("t")), null);
  const q = makeQ("q", "a", ["a", "b", "c", "d", "e"], "x", "/", rng("t"))!;
  assert.equal(q.o[q.a], "a");
  assert.equal(q.o.filter((o) => o === "a").length, 1);
});
