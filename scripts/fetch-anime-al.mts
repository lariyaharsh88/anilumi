/**
 * Builds data/anime-al.json: AniList data for the most-followed anime (score, status counts, tags, fan
 * recommendations, key staff, episode length, direct sequel) and each genre's median drop rate, so anime pages
 * don't need live AniList calls. AniList allows ~30 requests a minute; from Render it often refuses.
 * Runs monthly in .github/workflows/refresh-data.yml; by hand: npx tsx scripts/fetch-anime-al.mts (TOP=500)
 */
import { readFileSync, writeFileSync } from "node:fs";
import { pickRecs, keyStaffFrom, alSequelFrom } from "../lib/anilist";
import { dropStats, median, type AlTag, type StatusCount } from "../lib/insights";
import { toRawTags, type AlAnimeRaw } from "../lib/alsnap";
import { packJson } from "../lib/snapjson";

const TOP = Number(process.env.TOP) || 500;
const PER_QUERY = 2; // anime per request (aliased); the query is heavy, AniList caps complexity
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const H = { Accept: "application/vnd.api+json", "User-Agent": "AniLumi data refresh (+https://anilumi.in)" };

async function ask<T>(query: string, variables: Record<string, unknown> = {}): Promise<T> {
  for (let i = 0; i < 6; i++) {
    const res = await fetch("https://graphql.anilist.co", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ query, variables }), signal: AbortSignal.timeout(30000) }).catch(() => null);
    if (res?.ok) return ((await res.json()) as { data: T }).data;
    const wait = res?.status === 429 ? (Number(res.headers.get("retry-after")) || 30) * 1000 : 5000 * (i + 1);
    console.warn(`AniList ${res ? `HTTP ${res.status}` : "network error"}, retrying in ${wait / 1000}s`);
    await sleep(wait);
  }
  throw new Error("AniList kept failing");
}

// The most-followed titles on Kitsu (the search index is already ranked), mapped to AniList ids 20 at a time.
const aliases = JSON.parse(readFileSync(new URL("../data/aliases.json", import.meta.url), "utf8")) as { anime: { i: string }[] };
const kitsuIds = [...new Set(aliases.anime.map((a) => a.i))].slice(0, TOP);
const anilistIds: number[] = [];
for (let i = 0; i < kitsuIds.length; i += 20) {
  const url = `https://kitsu.io/api/edge/anime?filter[id]=${kitsuIds.slice(i, i + 20).join(",")}&include=mappings&fields[anime]=mappings&fields[mappings]=externalSite,externalId&page[limit]=20`;
  const res = await fetch(url, { headers: H }).catch(() => null);
  if (res?.ok) {
    const j = (await res.json()) as { included?: { type: string; attributes: { externalSite: string; externalId: string } }[] };
    for (const m of j.included || []) if (m.type === "mappings" && m.attributes.externalSite === "anilist/anime") anilistIds.push(Number(m.attributes.externalId));
  }
  process.stdout.write(`mappings ${anilistIds.length}\r`);
  await sleep(300);
}

const FIELDS = `duration genres averageScore stats{statusDistribution{status amount} scoreDistribution{score amount}} tags{name rank category isAdult isMediaSpoiler}
  recommendations(sort:[RATING_DESC,ID],perPage:25){nodes{rating mediaRecommendation{id type format seasonYear isAdult title{romaji english} coverImage{medium}}}}
  staff(sort:[RELEVANCE,ID],perPage:50){edges{role node{id name{full} image{medium} primaryOccupations}}}
  relations{edges{relationType node{id type format status title{romaji english} startDate{year month day}}}}`;
type Media = {
  duration: number | null; genres: string[]; averageScore: number | null;
  stats: { statusDistribution: StatusCount[]; scoreDistribution: { score: number; amount: number }[] } | null; tags: AlTag[];
  recommendations: { nodes: Parameters<typeof pickRecs>[0] }; staff: { edges: Parameters<typeof keyStaffFrom>[0] }; relations: { edges: Parameters<typeof alSequelFrom>[0] };
};

const anime: Record<string, AlAnimeRaw> = {};
const ids = [...new Set(anilistIds)];
for (let i = 0; i < ids.length; i += PER_QUERY) {
  const part = ids.slice(i, i + PER_QUERY);
  try {
    const data = await ask<Record<string, Media | null>>(`{${part.map((id, k) => `m${k}:Media(id:${id},type:ANIME){${FIELDS}}`).join(" ")}}`);
    part.forEach((id, k) => {
      const m = data[`m${k}`];
      if (!m) return;
      anime[id] = {
        d: m.duration || null, g: m.genres || [], s: m.averageScore ? m.averageScore / 10 : null,
        sv: (m.stats?.scoreDistribution || []).reduce((n, x) => n + x.amount, 0), st: m.stats?.statusDistribution || [], t: toRawTags(m.tags || []),
        r: pickRecs(m.recommendations.nodes, 12), k: keyStaffFrom(m.staff.edges), q: alSequelFrom(m.relations.edges),
      };
    });
  } catch (e) {
    console.warn(`anime ${part.join(",")}: ${(e as Error).message}`);
  }
  process.stdout.write(`anime ${Object.keys(anime).length}/${ids.length}   \r`);
  await sleep(2500); // stay under ~30 requests a minute
}

// Median drop rate per genre (the anime page's "compared with other X anime"), same rule as lib/insights.ts.
const genres = [...new Set(Object.values(anime).flatMap((a) => a.g))].filter((g) => g !== "Ecchi" && g !== "Hentai");
const bench: Record<string, number> = {};
for (const g of genres) {
  try {
    const d = await ask<{ Page: { media: { stats: { statusDistribution: StatusCount[] } | null }[] } }>(
      "query($g:String){Page(perPage:50){media(genre:$g,type:ANIME,sort:POPULARITY_DESC,status:FINISHED,isAdult:false){stats{statusDistribution{status amount}}}}}",
      { g },
    );
    const rates = d.Page.media.map((m) => dropStats(m.stats?.statusDistribution || [])).filter((x) => x && x.started >= 200).map((x) => x!.dropRate);
    if (rates.length >= 10) bench[g] = median(rates);
  } catch (e) {
    console.warn(`genre ${g}: ${(e as Error).message}`);
  }
  await sleep(2500);
}

writeFileSync(new URL("../data/anime-al.json", import.meta.url), packJson({ generated: new Date().toISOString().slice(0, 10), anime, bench }));
console.log(`\nwrote ${Object.keys(anime).length} anime, ${Object.keys(bench).length} genre benchmarks`);
