/**
 * Builds data/casts.json: the first 25 characters (with Japanese and English voice actors and favourites) of the
 * most-followed anime, so cast pages and character pages don't need live AniList calls. AniList allows ~30
 * requests a minute; cast pages used to error briefly when a crawler hit that limit.
 * Runs monthly in .github/workflows/refresh-data.yml; by hand: npx tsx scripts/fetch-casts.mts
 */
import { readFileSync, writeFileSync } from "node:fs";

const TOP = Number(process.env.TOP) || 300;
const PER_QUERY = 4; // anime per GraphQL request (aliased)
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// The most-followed titles on Kitsu, from the search index (already ranked).
const aliases = JSON.parse(readFileSync(new URL("../data/aliases.json", import.meta.url), "utf8")) as { anime: { i: string }[] };
const kitsuIds = [...new Set(aliases.anime.map((a) => a.i))].slice(0, TOP);

// Kitsu id → AniList id, 20 per request.
const anilistIds: number[] = [];
for (let i = 0; i < kitsuIds.length; i += 20) {
  const ids = kitsuIds.slice(i, i + 20);
  const url = `https://kitsu.io/api/edge/anime?filter[id]=${ids.join(",")}&include=mappings&fields[anime]=mappings&fields[mappings]=externalSite,externalId&page[limit]=20`;
  const res = await fetch(url, { headers: { Accept: "application/vnd.api+json", "User-Agent": "AniLumi data refresh (+https://anilumi.in)" } }).catch(() => null);
  if (res?.ok) {
    const j = (await res.json()) as { included?: { type: string; attributes: { externalSite: string; externalId: string } }[] };
    for (const m of j.included || []) if (m.type === "mappings" && m.attributes.externalSite === "anilist/anime") anilistIds.push(Number(m.attributes.externalId));
  }
  process.stdout.write(`mappings ${anilistIds.length}\r`);
  await sleep(300);
}

type AlVa = { id: number; name: { full: string; native: string | null }; image: { medium: string | null } | null; languageV2: string };
type Edge = { role: string; node: { id: number; name: { full: string; native: string | null }; image: { medium: string | null } | null; favourites: number }; voiceActorRoles: { voiceActor: AlVa | null }[] };
const FIELDS = `characters(sort:[ROLE,RELEVANCE,ID],perPage:25){pageInfo{total} edges{role node{id name{full native} image{medium} favourites} voiceActorRoles(sort:[RELEVANCE,ID]){voiceActor{id name{full native} image{medium} languageV2}}}}`;

async function batch(ids: number[]): Promise<Record<string, { characters: { pageInfo: { total: number }; edges: Edge[] } } | null>> {
  const query = `{${ids.map((id, k) => `m${k}:Media(id:${id},type:ANIME){${FIELDS}}`).join(" ")}}`;
  for (let i = 0; i < 6; i++) {
    const res = await fetch("https://graphql.anilist.co", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ query }), signal: AbortSignal.timeout(30000) }).catch(() => null);
    if (res?.ok) return ((await res.json()) as { data: Record<string, never> }).data;
    const wait = res?.status === 429 ? (Number(res.headers.get("retry-after")) || 30) * 1000 : 5000 * (i + 1);
    console.warn(`AniList ${res ? `HTTP ${res.status}` : "network error"}, retrying in ${wait / 1000}s`);
    await sleep(wait);
  }
  throw new Error("AniList kept failing");
}

const va = (v: AlVa | undefined) => (v ? [v.id, v.name.full.trim(), v.name.native, v.image?.medium || null] : null);
const casts: Record<string, unknown> = {};
for (let i = 0; i < anilistIds.length; i += PER_QUERY) {
  const ids = anilistIds.slice(i, i + PER_QUERY);
  const data = await batch(ids);
  ids.forEach((id, k) => {
    const c = data[`m${k}`]?.characters;
    if (!c?.edges.length) return;
    casts[id] = {
      t: c.pageInfo.total,
      e: c.edges.map((e) => {
        const vas = e.voiceActorRoles.map((r) => r.voiceActor).filter((v): v is AlVa => Boolean(v));
        return {
          r: e.role[0], // M(AIN) / S(UPPORTING) / B(ACKGROUND)
          c: [e.node.id, e.node.name.full.trim(), e.node.name.native, e.node.image?.medium || null, e.node.favourites || 0],
          jp: va(vas.find((v) => v.languageV2 === "Japanese")),
          en: va(vas.find((v) => v.languageV2 === "English")),
          o: new Set(vas.map((v) => v.languageV2).filter((l) => l !== "Japanese" && l !== "English")).size,
        };
      }),
    };
  });
  process.stdout.write(`casts ${Object.keys(casts).length}/${anilistIds.length}   \r`);
  await sleep(2500); // stay under ~30 requests a minute
}
writeFileSync(new URL("../data/casts.json", import.meta.url), JSON.stringify({ generated: new Date().toISOString().slice(0, 10), casts }));
console.log(`\nwrote ${Object.keys(casts).length} casts`);
