/**
 * Builds data/season-previews.json: the AniList line-up (with Kitsu matches) of the current and next two anime
 * seasons, for /season/[year]/[season]/preview. AniList rate-limits Render, which made the page answer 500.
 * Runs weekly in .github/workflows/season-previews.yml (premiere dates and new announcements land every week);
 * by hand: npx tsx scripts/fetch-season-previews.mts
 */
import { writeFileSync } from "node:fs";
import { seasonOf, shiftSeason } from "../lib/kitsu";
import { getSeasonPreview, type PreviewItem } from "../lib/preview";
import { packJson } from "../lib/snapjson";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const now = seasonOf();
const seasons: Record<string, PreviewItem[]> = {};
for (const k of [0, 1, 2]) {
  const { season, year } = shiftSeason(now.season, now.year, k);
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const items = await getSeasonPreview(year, season, 800, { live: true });
      if (items.length) seasons[`${year}-${season}`] = items;
      console.log(`${season} ${year}: ${items.length} titles`);
      break;
    } catch (e) {
      console.warn(`${season} ${year}: ${(e as Error).message}, retrying`);
      await sleep(30000);
    }
  }
  await sleep(5000);
}
writeFileSync(new URL("../data/season-previews.json", import.meta.url), packJson({ generated: new Date().toISOString().slice(0, 10), seasons }));
