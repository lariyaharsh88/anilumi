import { test } from "node:test";
import assert from "node:assert/strict";
import { CHARACTER_VS, vsSides, berries, vsLinkText } from "../lib/charvs";
import { characterBounties, bountyAnswer } from "../lib/bounties";

test("character match-ups: both sides resolve, and same-series pairs carry a sourced canon result", () => {
  assert.equal(new Set(CHARACTER_VS.map((v) => v.slug)).size, CHARACTER_VS.length);
  for (const v of CHARACTER_VS) {
    assert.ok(vsSides(v), `${v.slug}: both characters are in the snapshot`);
    if (!v.canon) continue;
    assert.ok(v.canon.sources.length >= 2, `${v.slug}: two sources`);
    // Each fight has episodes, manga chapters, or both; a fight with no episodes says where the anime stands.
    assert.ok(v.canon.bouts.every((b) => (b.from ? b.to === null || b.to >= b.from : Boolean(b.chapters)) && (!b.chapters || b.chapters[1] >= b.chapters[0])), `${v.slug}: ranges`);
    if (v.canon.bouts.some((b) => !b.from)) assert.ok(v.canon.animeStatus, `${v.slug}: anime status`);
  }
  // Kaido is outside the top-2,000 snapshot: fetched by id so the page survives the monthly refresh.
  assert.equal(vsSides(CHARACTER_VS.find((v) => v.slug === "luffy-vs-kaido")!)?.[1].row.heightCm, 710);
  assert.equal(berries(4_611_100_000), "4,611,100,000 berries");
  assert.match(vsLinkText(CHARACTER_VS.find((v) => v.slug === "luffy-vs-katakuri")!), /who wins, every fight/);
});

test("bounties rise in order, only the first is open, and each has two sources", () => {
  for (const slug of ["luffy-monkey-d", "zoro-roronoa", "sanji", "trafalgar-law", "one-piece-kaido", "shanks", "usopp", "ace-portgas-d", "nami", "teach-marshall-d", "robin-nico"]) {
    const { entries: b, sources } = characterBounties(slug)!;
    assert.deepEqual(b.map((x) => x.amount), [...b.map((x) => x.amount)].sort((x, y) => x - y), slug);
    assert.ok(b.every((x, i) => x.spoiler === i > 0), `${slug}: spoiler flags`);
    assert.ok(sources.length >= 2, slug);
  }
  assert.equal(characterBounties("luffy-monkey-d")!.entries.at(-1)!.amount, 3_000_000_000);
  assert.match(bountyAnswer("ace-portgas-d")!, /final bounty/);
  assert.match(bountyAnswer("luffy-monkey-d")!, /^3,000,000,000 berries, since the Wano Country arc\. Spoiler/);
});
