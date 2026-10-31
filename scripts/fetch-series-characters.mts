/**
 * Builds data/series-characters.json: the main and supporting characters (up to 50) of each series that has at
 * least two characters in the popular-character snapshot, with age, height, birthday and Japanese voice, for the
 * /anime/[slug]/characters tables and the height charts on character pages. The popular snapshot alone held
 * ~15 characters for Attack on Titan, 7 with a height.
 * Runs monthly in .github/workflows/refresh-data.yml after scripts/fetch-characters.mts; by hand:
 * npx tsx scripts/fetch-series-characters.mts
 */
import { readFileSync, writeFileSync } from "node:fs";
import { cleanBio } from "../lib/anilist";
import { packJson } from "../lib/snapjson";
import type { SeriesChar } from "../lib/seriessnap";

const MIN = Number(process.env.MIN) || 2;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

async function ask<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  for (let i = 0; i < 6; i++) {
    const res = await fetch("https://graphql.anilist.co", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ query, variables }), signal: AbortSignal.timeout(30000) }).catch(() => null);
    if (res?.ok) {
      const body = (await res.json().catch(() => null)) as { data: T } | null;
      if (body) return body.data;
    }
    const wait = res?.status === 429 ? (Number(res.headers.get("retry-after")) || 30) * 1000 : 5000 * (i + 1);
    console.warn(`AniList ${res ? `HTTP ${res.status}` : "network error"}, retrying in ${wait / 1000}s`);
    await sleep(wait);
  }
  throw new Error("AniList kept failing");
}

// Series to fetch: Kitsu slug → AniList id, from the popular-character snapshot.
const snap = JSON.parse(readFileSync(new URL("../data/characters.json", import.meta.url), "utf8")) as { characters: { s: string; t: string; a: number }[] };
const count = new Map<string, { a: number; t: string; n: number }>();
for (const c of snap.characters) count.set(c.s, { a: c.a, t: c.t, n: (count.get(c.s)?.n || 0) + 1 });
const shows = [...count.entries()].filter(([, v]) => v.n >= MIN).sort((x, y) => y[1].n - x[1].n);

type Node = {
  role: "MAIN" | "SUPPORTING" | "BACKGROUND";
  node: { id: number; name: { full: string }; image: { medium: string | null } | null; age: string | null; gender: string | null; dateOfBirth: { month: number | null; day: number | null } | null; description: string | null; favourites: number };
  voiceActors: { id: number; name: { full: string } }[];
};
const Q = `query($id:Int,$p:Int){Media(id:$id,type:ANIME){characters(sort:[ROLE,FAVOURITES_DESC],page:$p,perPage:25){edges{role node{id name{full} image{medium} age gender dateOfBirth{month day} description favourites} voiceActors(language:JAPANESE,sort:[RELEVANCE,ID]){id name{full}}}}}}`;
const IMG = "https://s4.anilist.co/file/anilistcdn/character/medium/";
const height = (desc: string | null) => cleanBio(desc).facts.find((f) => /^height$/i.test(f.label.trim()))?.value.replace(/\s+/g, " ").trim().slice(0, 60) ?? null;

const series: Record<string, { a: number; t: string; c: SeriesChar[] }> = {};
for (const [n, [slug, { a, t }]] of shows.entries()) {
  try {
    // AniList returns at most 25 per page here; a second page when the first is full (big casts).
    const edges: Node[] = [];
    for (let p = 1; p <= 2; p++) {
      const d = await ask<{ Media: { characters: { edges: Node[] } } | null }>(Q, { id: a, p });
      const got = d.Media?.characters.edges || [];
      edges.push(...got);
      if (got.length < 25) break;
      await sleep(2500);
    }
    const c = edges
      .filter((e) => e.role !== "BACKGROUND")
      .map((e): SeriesChar => {
        const x = e.node;
        const img = x.image?.medium?.startsWith(IMG) ? x.image.medium.slice(IMG.length) : null;
        const va = e.voiceActors[0];
        return [x.id, x.name.full.trim(), img, x.age || null, height(x.description), x.dateOfBirth?.month || null, x.dateOfBirth?.day || null, x.gender || null, x.favourites || 0, e.role === "MAIN" ? "M" : "S", va ? [va.id, va.name.full.trim()] : null];
      });
    if (c.length) series[slug] = { a, t, c };
  } catch (e) {
    console.warn(`${slug}: ${(e as Error).message}`);
  }
  process.stdout.write(`series ${n + 1}/${shows.length}   \r`);
  await sleep(2500); // stay under ~30 requests a minute
}

writeFileSync(new URL("../data/series-characters.json", import.meta.url), packJson({ generated: new Date().toISOString().slice(0, 10), series }));
console.log(`\nwrote ${Object.keys(series).length} series, ${Object.values(series).reduce((n, s) => n + s.c.length, 0)} characters`);
