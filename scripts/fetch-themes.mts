/**
 * Builds data/themes.json: openings and endings (AnimeThemes) for the most-followed anime, so openings-endings
 * pages don't depend on a live call. AnimeThemes answers in 10–20 s, longer than a page render can wait, and an
 * empty answer used to be cached as an empty, noindexed page (Attack on Titan, Naruto, Demon Slayer…).
 * Batched: 25 anime per request, matched back by MAL id. Runs monthly in .github/workflows/refresh-data.yml;
 * by hand: npx tsx scripts/fetch-themes.mts   (TOP=300 by default)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { normaliseThemes } from "../lib/themes.ts";

const TOP = Number(process.env.TOP) || 300;
const BATCH = 25;
const UA = { "User-Agent": "AniLumi data refresh (+https://anilumi.in)" };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

const aliases = JSON.parse(readFileSync(new URL("../data/aliases.json", import.meta.url), "utf8")) as { anime: { i: string }[] };
const kitsuIds = [...new Set(aliases.anime.map((a) => a.i))].slice(0, TOP);

// Kitsu id → MAL id, 20 per request.
const malToKitsu = new Map<string, string>();
for (let i = 0; i < kitsuIds.length; i += 20) {
  const ids = kitsuIds.slice(i, i + 20);
  const url = `https://kitsu.io/api/edge/anime?filter[id]=${ids.join(",")}&include=mappings&fields[anime]=mappings&fields[mappings]=externalSite,externalId,item&page[limit]=20`;
  const res = await fetch(url, { headers: { Accept: "application/vnd.api+json", ...UA } }).catch(() => null);
  if (res?.ok) {
    const j = (await res.json()) as { data: { id: string; relationships: { mappings: { data: { id: string }[] } } }[]; included?: { id: string; type: string; attributes: { externalSite: string; externalId: string } }[] };
    const byId = new Map((j.included || []).map((m) => [m.id, m]));
    for (const a of j.data) for (const ref of a.relationships.mappings.data) {
      const m = byId.get(ref.id);
      if (m?.attributes.externalSite === "myanimelist/anime") malToKitsu.set(String(m.attributes.externalId), a.id);
    }
  }
  process.stdout.write(`mal ids ${malToKitsu.size}\r`);
  await sleep(300);
}
console.log(`mal ids ${malToKitsu.size} of ${kitsuIds.length}`);

type Raw = Parameters<typeof normaliseThemes>[0];
const out: Record<string, { s: string; t: ReturnType<typeof normaliseThemes> }> = {};
const mals = [...malToKitsu.keys()];
for (let i = 0; i < mals.length; i += BATCH) {
  const ids = mals.slice(i, i + BATCH);
  const url = `https://api.animethemes.moe/anime?filter[has]=resources&filter[site]=MyAnimeList&filter[external_id]=${ids.join(",")}&include=resources,animethemes.song.artists,animethemes.animethemeentries&fields[anime]=slug&fields[resource]=site,external_id&fields[song]=title&fields[artist]=name&fields[animetheme]=type,sequence,slug&fields[animethemeentry]=version,episodes,spoiler,nsfw&page[size]=${BATCH * 2}`;
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetch(url, { headers: { Accept: "application/json", ...UA }, signal: AbortSignal.timeout(120_000) }).catch(() => null);
    if (!res?.ok) { await sleep(5000 * (attempt + 1)); continue; }
    const j = (await res.json()) as { anime: { slug: string; resources?: { site: string; external_id: number }[]; animethemes: Raw }[] };
    for (const a of j.anime || []) {
      const mal = a.resources?.find((r) => r.site === "MyAnimeList" && ids.includes(String(r.external_id)));
      const kitsu = mal && malToKitsu.get(String(mal.external_id));
      if (kitsu) out[kitsu] = { s: a.slug, t: normaliseThemes(a.animethemes || []) };
    }
    break;
  }
  process.stdout.write(`themes ${Object.keys(out).length}\r`);
  await sleep(1500); // AnimeThemes allows 90 requests a minute
}

const kept = Object.values(out).filter((x) => x.t.length).length;
if (kept < Math.min(50, mals.length / 4)) { console.error(`only ${kept} anime with themes; keeping the old snapshot`); process.exit(1); }
writeFileSync(new URL("../data/themes.json", import.meta.url), JSON.stringify({ generated: new Date().toISOString().slice(0, 10), themes: out }));
console.log(`themes for ${Object.keys(out).length} anime (${kept} with songs)`);
