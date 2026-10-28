/**
 * Builds data/filler-mal.json: filler and recap episode numbers for long-running anime, from MyAnimeList's
 * per-episode flags via the Jikan API. Hand-checked lists in data/filler.ts take priority over these.
 * Runs monthly in .github/workflows/refresh-data.yml; by hand: npx tsx scripts/build-filler-mal.mts [kitsu-slug …]
 * If Jikan is down it exits cleanly and leaves the file as it was.
 */
import { readFileSync, writeFileSync } from "node:fs";
import { formatRanges } from "../lib/filler";
import type { MalFiller } from "../lib/filler";

// Kitsu slugs. Shows already in data/filler.ts are left out: the curated list wins anyway.
const SHOWS = [
  "fairy-tail", "fairy-tail-2014", "fairy-tail-2018", "boruto-naruto-next-generations", "black-clover-tv",
  "dragon-ball", "dragon-ball-z", "dragon-ball-kai", "dragon-ball-super", "detective-conan", "inuyasha", "gintama",
  "hunter-x-hunter", "yu-yu-hakusho", "katekyo-hitman-reborn", "d-gray-man", "soul-eater", "rurouni-kenshin",
  "shaman-king", "yu-gi-oh-duel-monsters", "bishoujo-senshi-sailor-moon", "hajime-no-ippo", "digimon-adventure",
];
const OUT = new URL("../data/filler-mal.json", import.meta.url);
const JIKAN = "https://api.jikan.moe/v4";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const today = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

async function json<T>(url: string, accept = "application/json"): Promise<T> {
  for (let i = 0; i < 4; i++) {
    const res = await fetch(url, { headers: { Accept: accept, "User-Agent": "AniLumi data refresh (+https://anilumi.in)" }, signal: AbortSignal.timeout(20000) });
    if (res.status === 429 || res.status >= 500) { await sleep(4000 * (i + 1)); continue; }
    if (!res.ok) throw new Error(`${res.status} ${url}`);
    return (await res.json()) as T;
  }
  throw new Error(`gave up on ${url}`);
}

type KitsuAnime = { data: { id: string; attributes: { canonicalTitle: string; episodeCount: number | null } }[]; included?: { attributes: { externalSite: string; externalId: string } }[] };
async function kitsu(slug: string) {
  const j = await json<KitsuAnime>(`https://kitsu.io/api/edge/anime?filter[slug]=${encodeURIComponent(slug)}&include=mappings&fields[anime]=canonicalTitle,episodeCount,mappings&fields[mappings]=externalSite,externalId`, "application/vnd.api+json");
  const a = j.data[0];
  const mal = j.included?.find((m) => m.attributes.externalSite === "myanimelist/anime")?.attributes.externalId;
  return a && mal ? { title: a.attributes.canonicalTitle, episodes: a.attributes.episodeCount, mal: Number(mal) } : null;
}

type Page = { pagination: { has_next_page: boolean }; data: { mal_id: number; filler: boolean; recap: boolean }[] };
async function flags(mal: number) {
  const filler: number[] = [], recap: number[] = [];
  let count = 0;
  for (let page = 1; ; page++) {
    const p = await json<Page>(`${JIKAN}/anime/${mal}/episodes?page=${page}`);
    for (const e of p.data) {
      count = Math.max(count, e.mal_id);
      if (e.filler) filler.push(e.mal_id);
      else if (e.recap) recap.push(e.mal_id);
    }
    await sleep(1200); // Jikan allows 3 requests a second and 60 a minute
    if (!p.pagination.has_next_page) break;
  }
  return { filler, recap, count };
}

try {
  await json(`${JIKAN}/anime/1`);
} catch (err) {
  console.warn(`Jikan is unreachable (${(err as Error).message}); keeping data/filler-mal.json as it is.`);
  process.exit(0);
}

const data = JSON.parse(readFileSync(OUT, "utf8")) as Record<string, MalFiller>;
const slugs = process.argv.length > 2 ? process.argv.slice(2) : SHOWS;
let updated = 0;
for (const slug of slugs) {
  try {
    const k = await kitsu(slug);
    if (!k) { console.warn(`${slug}: not on Kitsu or no MAL mapping`); continue; }
    const f = await flags(k.mal);
    // Different episode counts usually mean different numbering (split cours, merged seasons). Skip rather than mislabel.
    if (k.episodes && Math.abs(k.episodes - f.count) > 2) { console.warn(`${slug}: Kitsu has ${k.episodes} episodes, MAL ${f.count}; skipped`); continue; }
    if (!f.filler.length && !f.recap.length) { delete data[slug]; console.log(`${slug}: no filler flagged`); continue; }
    data[slug] = { mal: k.mal, title: k.title, episodes: f.count, filler: formatRanges(f.filler).replace(/–/g, "-"), ...(f.recap.length ? { recap: formatRanges(f.recap).replace(/–/g, "-") } : {}), fetched: today };
    updated++;
    console.log(`${slug}: ${f.filler.length} filler, ${f.recap.length} recap of ${f.count}`);
  } catch (err) {
    console.warn(`${slug}: ${(err as Error).message}; kept the previous data`);
  }
}
const sorted = Object.fromEntries(Object.entries(data).sort(([a], [b]) => a.localeCompare(b)));
writeFileSync(OUT, `${JSON.stringify(sorted, null, 2)}\n`);
console.log(`Updated ${updated} of ${slugs.length} shows.`);
