import { test } from "node:test";
import assert from "node:assert/strict";
import { adaptationFor } from "../lib/mangaseasons";
import { volumeFor, volumeLine } from "../lib/mangavolumes";
import seasons from "../data/manga-seasons.json";
import volData from "../data/manga-volumes.json";

const at = (slug: string) => volumeFor(slug, adaptationFor(slug));

test("volumes: the season's continue chapter → the volume to buy, searched by its English title", () => {
  assert.deepEqual(at("shingeki-no-kyojin-2"), { vol: 13, startsAt: "start", search: "Attack on Titan Vol. 13" });
  const ds = at("Kimetsu-no-Yaiba-Hashira-Geikohen")!;
  assert.equal(ds.search, "Demon Slayer: Kimetsu no Yaiba Vol. 16");
  assert.equal(volumeLine(adaptationFor("Kimetsu-no-Yaiba-Hashira-Geikohen")!, ds), "Chapter 140 is partway through volume 16.");
  assert.equal(at("tokyo-ghoul-re")!.search, "Tokyo Ghoul: re Vol. 6"); // its own English series
});

test("volumes: every season with a continue point has a volume and a title; finished stories have none", () => {
  for (const [slug, s] of Object.entries((seasons as { seasons: Record<string, { continue: number | null; medium: string }> }).seasons)) {
    const v = at(slug);
    const vols = (volData as { seasons: Record<string, { english?: boolean }> }).seasons;
    if (s.continue === null || vols[slug]?.english === false) assert.equal(v, null, slug);
    else {
      assert.ok(v && v.vol > 0 && !v.search.includes("undefined"), slug);
      if (s.medium === "light novel") assert.match(v.search, /Light Novel Vol\. \d+$/, slug);
    }
  }
});
