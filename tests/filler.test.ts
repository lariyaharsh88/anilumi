import { test } from "node:test";
import assert from "node:assert/strict";
import { parseRanges, formatRanges, fillerFor, mergeFiller, kindRuns, episodeKind, fillerSource, startAt, type MalFiller } from "../lib/filler";
import { FILLER, CONTINUE } from "../data/filler";

test("parseRanges and formatRanges round-trip", () => {
  const s = parseRanges("26, 97, 101-106, 3 - 1, junk");
  assert.deepEqual([...s].sort((a, b) => a - b), [1, 2, 3, 26, 97, 101, 102, 103, 104, 105, 106]);
  assert.equal(formatRanges(s), "1–3, 26, 97, 101–106");
});

test("fillerFor counts within the series and finds the next canon episode", () => {
  const f = fillerFor("naruto", 220)!;
  assert.equal(f.count, 1 + 1 + 6 + 5 + 77); // 26, 97, 101-106, 136-140, 143-219
  assert.equal(f.nextCanon(135), 141); // 136-140 are filler; 141 is mixed, so the story resumes there
  assert.equal(f.nextCanon(136), 141);
  assert.equal(f.nextCanon(143), 220);
  assert.equal(fillerFor("not-a-show", 10), null);
});

test("data sanity: ranges parse, ascending, no overlap with mixed, entries start unreviewed", () => {
  for (const [slug, e] of Object.entries(FILLER)) {
    const f = parseRanges(e.filler), m = parseRanges(e.mixed);
    assert.ok(f.size > 0, slug);
    assert.ok(![...m].some((n) => f.has(n)), `${slug}: an episode is both filler and mixed`);
    const starts = e.filler.split(",").map((p) => Number(p.trim().split("-")[0]));
    assert.deepEqual(starts, [...starts].sort((a, b) => a - b), `${slug}: ranges out of order`);
  }
  for (const [slug, c] of Object.entries(CONTINUE)) assert.ok(c.chapter || c.volume, slug);
});

test("mergeFiller: curated lists win, empty MAL entries are dropped", () => {
  const mal: Record<string, MalFiller> = {
    naruto: { mal: 20, title: "Naruto", episodes: 220, filler: "1-200", fetched: "1 Nov 2026" },
    "fairy-tail": { mal: 6702, title: "Fairy Tail", episodes: 175, filler: "9, 19-20", recap: "125", fetched: "1 Nov 2026" },
    empty: { mal: 1, title: "x", episodes: 12, filler: "", fetched: "1 Nov 2026" },
  };
  const all = mergeFiller(FILLER, mal);
  assert.equal(all.naruto, FILLER.naruto);
  assert.equal(all["fairy-tail"].source, "mal");
  assert.equal(all["fairy-tail"].recap, "125");
  assert.equal(all.empty, undefined);
  assert.equal(fillerSource(all["fairy-tail"]).label, "From MyAnimeList");
  assert.equal(fillerSource(FILLER.naruto).label, "Cross-checked");
  assert.equal(fillerSource({ filler: "1", reviewed: false }).tone, "draft");
});

test("kindRuns covers every episode once, in order", () => {
  const f = fillerFor("one-piece", 1100)!;
  const runs = kindRuns(f);
  assert.equal(runs[0].from, 1);
  assert.equal(runs[runs.length - 1].to, 1100);
  for (let i = 1; i < runs.length; i++) {
    assert.equal(runs[i].from, runs[i - 1].to + 1);
    assert.notEqual(runs[i].kind, runs[i - 1].kind);
  }
  assert.equal(episodeKind(f, 54), "filler");
  assert.equal(episodeKind(f, 61), "mixed");
  assert.equal(episodeKind(f, 50), "anime-canon");
  assert.equal(episodeKind(f, 1), "canon");
});

test("startAt names the chapter, or the volume for light novels", () => {
  assert.equal(startAt(CONTINUE["chainsaw-man"]), "chapter 39");
  assert.equal(startAt(CONTINUE["overlord-sei-oukoku-hen"]), "volume 14");
});
