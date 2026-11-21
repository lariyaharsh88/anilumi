/**
 * Builds data/characters.json: AniList data for the most-favourited anime characters (facts, favourites,
 * Japanese and English voice actors, main anime mapped to its Kitsu slug), so their pages don't need live
 * AniList calls. AniList allows ~30 requests a minute from one IP, and a character page used to need three.
 * Runs monthly in .github/workflows/refresh-data.yml; by hand: npx tsx scripts/fetch-characters.mts
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { cleanBio } from "../lib/anilist";
import { shownLines } from "../lib/charfacts";

const TOP = Number(process.env.TOP) || 2000;
// EXTRA_ONLY=1 fetches just the data/character-pages-extra.json characters missing from the file and appends them.
const EXTRA_ONLY = process.env.EXTRA_ONLY === "1";
const PER = 25;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Va = { id: number; name: { full: string }; image: { medium: string | null } | null; languageV2: string };
type Ch = {
  id: number; name: { full: string; native: string | null; alternative: (string | null)[] }; image: { medium: string | null } | null; favourites: number; age: string | null; gender: string | null; bloodType: string | null;
  dateOfBirth: { month: number | null; day: number | null }; description: string | null;
  media: { edges: { node: { id: number; isAdult: boolean; title: { romaji: string; english: string | null } }; voiceActorRoles: { voiceActor: Va | null }[] }[] };
};
const FIELDS = `id name{full native alternative} image{medium} favourites age gender bloodType dateOfBirth{month day} description media(perPage:1,sort:POPULARITY_DESC,type:ANIME){edges{node{id isAdult title{romaji english}} voiceActorRoles(sort:[RELEVANCE,ID]){voiceActor{id name{full} image{medium} languageV2}}}}`;
const QUERY = `query($p:Int,$n:Int){Page(page:$p,perPage:$n){characters(sort:FAVOURITES_DESC){${FIELDS}}}}`;
const QUERY_IDS = `query($ids:[Int]){Page(page:1,perPage:50){characters(id_in:$ids){${FIELDS}}}}`;

async function page(p: number, ids?: number[]): Promise<Ch[]> {
  for (let i = 0; i < 6; i++) {
    const res = await fetch("https://graphql.anilist.co", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(ids ? { query: QUERY_IDS, variables: { ids } } : { query: QUERY, variables: { p, n: PER } }), signal: AbortSignal.timeout(30000) }).catch(() => null);
    if (res?.ok) return ((await res.json()) as { data: { Page: { characters: Ch[] } } }).data.Page.characters;
    const wait = res?.status === 429 ? (Number(res.headers.get("retry-after")) || 30) * 1000 : 5000 * (i + 1);
    console.warn(`page ${p}: ${res ? `HTTP ${res.status}` : "network error"}, retrying in ${wait / 1000}s`);
    await sleep(wait);
  }
  throw new Error(`AniList kept failing on page ${p}`);
}

const FILE = new URL("../data/characters.json", import.meta.url);
const prevFile = existsSync(FILE) ? (JSON.parse(readFileSync(FILE, "utf8")) as { generated: string; characters: { id: number; k?: string }[] }) : null;
const prev = prevFile?.characters ?? [];
const chars: Ch[] = [];
if (!EXTRA_ONLY) for (let p = 1; p <= Math.ceil(TOP / PER); p++) {
  chars.push(...(await page(p)));
  process.stdout.write(`characters ${chars.length}\r`);
  await sleep(2500); // stay under ~30 requests a minute
}
// Characters with a snapshot-only page (Kitsu has no entry) who are outside the top list, e.g. One Piece's Kaido:
// fetched by id so their pages survive the monthly refresh.
const pageIds = Object.keys((JSON.parse(readFileSync(new URL("../data/character-pages-extra.json", import.meta.url), "utf8")) as { pages: Record<string, string> }).pages).map(Number);
const have = new Set([...chars, ...(EXTRA_ONLY ? prev : [])].map((c) => c.id));
const missing = pageIds.filter((id) => !have.has(id));
for (let i = 0; i < missing.length; i += 50) { chars.push(...(await page(0, missing.slice(i, i + 50)))); await sleep(2500); }

// AniList media id → Kitsu slug/title (20 per request), skipping adult titles.
const usable = chars.filter((c) => c.media.edges[0] && !c.media.edges[0].node.isAdult);
const mediaIds = [...new Set(usable.map((c) => c.media.edges[0].node.id))];
const kitsu = new Map<number, { slug: string; title: string }>();
for (let i = 0; i < mediaIds.length; i += 20) {
  const ids = mediaIds.slice(i, i + 20);
  const url = `https://kitsu.io/api/edge/mappings?filter[externalSite]=anilist/anime&filter[externalId]=${ids.join(",")}&include=item&page[limit]=20&fields[mappings]=externalId,item&fields[anime]=slug,canonicalTitle,nsfw,ageRating`;
  const res = await fetch(url, { headers: { Accept: "application/vnd.api+json" } }).catch(() => null);
  if (res?.ok) {
    const j = (await res.json()) as { data: { attributes: { externalId: string }; relationships: { item: { data: { id: string; type: string } | null } } }[]; included?: { id: string; type: string; attributes: { slug: string; canonicalTitle: string; nsfw: boolean; ageRating: string | null } }[] };
    const inc = new Map((j.included || []).filter((x) => x.type === "anime").map((x) => [x.id, x.attributes]));
    for (const m of j.data) {
      const a = m.relationships.item.data ? inc.get(m.relationships.item.data.id) : undefined;
      if (a && !a.nsfw && a.ageRating !== "R18") kitsu.set(Number(m.attributes.externalId), { slug: a.slug, title: a.canonicalTitle });
    }
  }
  process.stdout.write(`kitsu mappings ${i + ids.length}/${mediaIds.length}  \r`);
  await sleep(300);
}

const va = (roles: { voiceActor: Va | null }[], lang: string) => {
  const v = roles.find((r) => r.voiceActor?.languageV2 === lang)?.voiceActor;
  return v ? { id: v.id, n: v.name.full.trim(), i: v.image?.medium || null } : null;
};
// Keep last month's Kitsu slugs (scripts/map-character-slugs.mts then only matches newcomers).
const prevK = new Map<number, string>();
for (const c of prev) if (c.k) prevK.set(c.id, c.k);
/** Other names fans search by ("Eren Jaeger", "Near"); AniList keeps spoiler names in a separate field we don't fetch. */
const aliases = (c: Ch) => [...new Set((c.name.alternative || []).map((x) => (x || "").trim()).filter((x) => x && x.length <= 40 && x.toLowerCase() !== c.name.full.trim().toLowerCase()))].slice(0, 4);
const IMG = "https://s4.anilist.co/file/anilistcdn/character/medium/";
const out = {
  generated: EXTRA_ONLY && prevFile ? prevFile.generated : new Date().toISOString().slice(0, 10),
  characters: usable.flatMap((c) => {
    const e = c.media.edges[0];
    const k = kitsu.get(e.node.id);
    if (!k) return []; // no Kitsu page to match against
    return [{
      id: c.id, n: c.name.full.trim(), f: c.favourites,
      ...(aliases(c).length ? { al: aliases(c) } : {}),
      // Image file name only (the CDN prefix is constant), to keep this bundled file small.
      ...(c.image?.medium?.startsWith(IMG) ? { i: c.image.medium.slice(IMG.length) } : {}),
      age: c.age, g: c.gender, bt: c.bloodType, m: c.dateOfBirth.month, d: c.dateOfBirth.day,
      l: shownLines(cleanBio(c.description).facts).map((x) => [x.label, x.value]),
      a: e.node.id, s: k.slug, t: k.title,
      jp: va(e.voiceActorRoles, "Japanese"), en: va(e.voiceActorRoles, "English"),
      ...(prevK.has(c.id) ? { k: prevK.get(c.id) } : {}),
    }];
  }),
};
if (EXTRA_ONLY) out.characters = [...(prev as typeof out.characters), ...out.characters];
writeFileSync(FILE, JSON.stringify(out));
console.log(`\nwrote ${out.characters.length} of ${chars.length} characters`);
