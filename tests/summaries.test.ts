import { test } from "node:test";
import assert from "node:assert/strict";
import data from "../data/summaries.json";

test("summaries: own words, sourced, a readable length", () => {
  for (const [slug, e] of Object.entries((data as { anime: Record<string, { summary: string; sources: string[] }> }).anime)) {
    const words = e.summary.split(/\s+/).length;
    assert.ok(words >= 50 && words <= 130, `${slug}: ${words} words`);
    assert.ok(e.sources.length >= 2, slug);
  }
});
