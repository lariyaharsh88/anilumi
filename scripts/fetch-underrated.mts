/**
 * Builds data/underrated.json for /underrated-anime: anime fans rate highly on AniList (average score 78+, from at
 * least 2,000 members) that comparatively few have watched (under 120,000 members, against 500K to 1M+ for the hits).
 * First seasons and stand-alone films only, so sequels and recap films don't crowd the list, and nothing from the
 * current year (too new to call underrated); no adult titles or shorts. Each is
 * mapped to its Kitsu slug for the anime page link. Monthly in .github/workflows/refresh-data.yml; by hand: npx tsx
 * scripts/fetch-underrated.mts
 */
import { writeFileSync } from "node:fs";

const MIN_SCORE = 78, MAX_POP = 120000, MIN_POP = 2000;
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

type Media = {
  id: number; title: { romaji: string; english: string | null }; format: string; episodes: number | null; duration: number | null;
  seasonYear: number | null; startDate: { year: number | null }; averageScore: number; popularity: number; genres: string[]; isAdult: boolean; countryOfOrigin: string; coverImage: { medium: string | null } | null;
  tags: { name: string; rank: number; isMediaSpoiler: boolean }[];
  relations: { edges: { relationType: string; node: { type: string } }[] };
};
const QUERY = `query($p:Int){Page(page:$p,perPage:50){pageInfo{hasNextPage} media(type:ANIME,sort:SCORE_DESC,averageScore_greater:${MIN_SCORE - 1},popularity_lesser:${MAX_POP},popularity_greater:${MIN_POP},format_in:[TV,MOVIE,ONA],isAdult:false){id title{romaji english} format episodes duration seasonYear startDate{year} averageScore popularity genres isAdult countryOfOrigin coverImage{medium} tags{name rank isMediaSpoiler} relations{edges{relationType node{type}}}}}}`;

async function page(p: number): Promise<{ media: Media[]; more: boolean }> {
  for (let i = 0; i < 6; i++) {
    const res = await fetch("https://graphql.anilist.co", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ query: QUERY, variables: { p } }), signal: AbortSignal.timeout(30000) }).catch(() => null);
    if (res?.ok) { const j = (await res.json()) as { data: { Page: { pageInfo: { hasNextPage: boolean }; media: Media[] } } }; return { media: j.data.Page.media, more: j.data.Page.pageInfo.hasNextPage }; }
    const wait = res?.status === 429 ? (Number(res.headers.get("retry-after")) || 30) * 1000 : 5000 * (i + 1);
    console.warn(`page ${p}: ${res ? `HTTP ${res.status}` : "network error"}, retrying in ${wait / 1000}s`);
    await sleep(wait);
  }
  throw new Error(`AniList kept failing on page ${p}`);
}

const all: Media[] = [];
for (let p = 1; p <= 12; p++) {
  const { media, more } = await page(p);
  all.push(...media);
  process.stdout.write(`anilist page ${p}: ${all.length}  \r`);
  if (!more) break;
  await sleep(2500);
}

// Sequels, side stories, retellings and recap films out (anything with an anime prequel, parent story, alternative
// version or summary; films also when they spin off another anime), and shows from the last 12 months: too new to
// call underrated.
const OUT = new Set(["PREQUEL", "PARENT", "ALTERNATIVE", "SUMMARY", "SIDE_STORY"]);
const thisYear = new Date().getFullYear();
const firsts = all.filter((m) => !m.isAdult && (m.format === "MOVIE" || (m.duration ?? 24) >= 12) && (m.seasonYear ?? m.startDate.year ?? thisYear) < thisYear
  && !m.relations.edges.some((e) => e.node.type === "ANIME" && (OUT.has(e.relationType) || (m.format === "MOVIE" && e.relationType === "SPIN_OFF"))));

const kitsu = new Map<number, string>();
for (let i = 0; i < firsts.length; i += 20) {
  const ids = firsts.slice(i, i + 20).map((m) => m.id);
  const url = `https://kitsu.io/api/edge/mappings?filter[externalSite]=anilist/anime&filter[externalId]=${ids.join(",")}&include=item&page[limit]=20&fields[mappings]=externalId,item&fields[anime]=slug,nsfw,ageRating`;
  const res = await fetch(url, { headers: { Accept: "application/vnd.api+json" } }).catch(() => null);
  if (res?.ok) {
    const j = (await res.json()) as { data: { attributes: { externalId: string }; relationships: { item: { data: { id: string; type: string } | null } } }[]; included?: { id: string; type: string; attributes: { slug: string; nsfw: boolean; ageRating: string | null } }[] };
    const inc = new Map((j.included || []).filter((x) => x.type === "anime").map((x) => [x.id, x.attributes]));
    for (const m of j.data) {
      const a = m.relationships.item.data ? inc.get(m.relationships.item.data.id) : undefined;
      if (a && !a.nsfw && a.ageRating !== "R18") kitsu.set(Number(m.attributes.externalId), a.slug);
    }
  }
  process.stdout.write(`kitsu mappings ${i + ids.length}/${firsts.length}  \r`);
  await sleep(300);
}

const titles = firsts.filter((m) => kitsu.has(m.id)).map((m) => ({
  id: m.id, k: kitsu.get(m.id)!, t: m.title.english || m.title.romaji, r: m.title.english && m.title.english !== m.title.romaji ? m.title.romaji : null,
  f: m.format, e: m.episodes, y: m.seasonYear ?? m.startDate.year, s: m.averageScore, p: m.popularity, g: m.genres, c: m.countryOfOrigin,
  i: m.coverImage?.medium ?? null,
  tags: m.tags.filter((t) => !t.isMediaSpoiler && t.rank >= 70).slice(0, 4).map((t) => t.name),
}));
writeFileSync(new URL("../data/underrated.json", import.meta.url), JSON.stringify({ generated: new Date().toISOString().slice(0, 10), minScore: MIN_SCORE, maxPopularity: MAX_POP, minPopularity: MIN_POP, titles }) + "\n");
console.log(`\n${titles.length} titles (of ${all.length} fetched, ${firsts.length} first seasons/films)`);
