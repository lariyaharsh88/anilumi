/**
 * Builds airing.json: every airing anime (and those premiering within 3 weeks) with AniList's exact air times for
 * the next few episodes, mapped to Kitsu ids and slugs. The site reads it at runtime from the `airing-data`
 * branch (lib/airing.ts), because AniList rate-limits Render and a commit to main would trigger a rebuild.
 * Runs every 3 hours in .github/workflows/airing.yml; by hand: npx tsx scripts/fetch-airing.mts [out.json]
 */
import { writeFileSync } from "node:fs";

const OUT = process.argv[2] || "airing.json";
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const H = { Accept: "application/vnd.api+json", "User-Agent": "AniLumi airing refresh (+https://anilumi.in)" };

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

type Media = {
  id: number; popularity: number; episodes: number | null; format: string | null;
  title: { romaji: string; english: string | null }; startDate: { year: number | null; month: number | null; day: number | null };
  airingSchedule: { nodes: { episode: number; airingAt: number }[] };
};
const Q = `query($p:Int,$s:MediaStatus){Page(page:$p,perPage:50){pageInfo{hasNextPage} media(type:ANIME,status:$s,isAdult:false,sort:POPULARITY_DESC,format_in:[TV,TV_SHORT,ONA]){id popularity episodes format title{romaji english} startDate{year month day} airingSchedule(notYetAired:true,perPage:4){nodes{episode airingAt}}}}}`;

const media: (Media & { releasing: boolean })[] = [];
for (const [status, pages] of [["RELEASING", 6], ["NOT_YET_RELEASED", 4]] as const) {
  for (let p = 1; p <= pages; p++) {
    const d = await ask<{ Page: { pageInfo: { hasNextPage: boolean }; media: Media[] } }>(Q, { p, s: status });
    media.push(...d.Page.media.map((m) => ({ ...m, releasing: status === "RELEASING" })));
    await sleep(2500);
    if (!d.Page.pageInfo.hasNextPage) break;
  }
}
const soon = Date.now() / 1000 + 21 * 86400;
// Airing now with a schedule (however far off: a show on a break, like One Piece until January, still needs its
// return date and aired count), or premiering within three weeks; tiny shows (popularity < 300) skipped.
const keep = media.filter((m) => m.popularity >= 300 && m.airingSchedule.nodes.length && (m.releasing || m.airingSchedule.nodes[0].airingAt < soon));

// AniList id → Kitsu id and slug (20 per request).
const kitsu = new Map<number, { id: string; slug: string }>();
const ids = [...new Set(keep.map((m) => m.id))];
for (let i = 0; i < ids.length; i += 20) {
  const part = ids.slice(i, i + 20);
  const url = `https://kitsu.io/api/edge/mappings?filter[externalSite]=anilist/anime&filter[externalId]=${part.join(",")}&include=item&page[limit]=20&fields[mappings]=externalId,item&fields[anime]=slug,nsfw`;
  const res = await fetch(url, { headers: H }).catch(() => null);
  if (res?.ok) {
    const j = (await res.json()) as { data: { attributes: { externalId: string }; relationships: { item: { data: { id: string; type: string } | null } } }[]; included?: { id: string; type: string; attributes: { slug: string; nsfw: boolean } }[] };
    const inc = new Map((j.included || []).filter((x) => x.type === "anime").map((x) => [x.id, x.attributes]));
    for (const m of j.data) {
      const ref = m.relationships.item.data;
      const a = ref ? inc.get(ref.id) : undefined;
      if (ref && a && !a.nsfw) kitsu.set(Number(m.attributes.externalId), { id: ref.id, slug: a.slug });
    }
  }
  await sleep(300);
}

const shows = keep.map((m) => ({
  a: m.id,
  k: kitsu.get(m.id)?.id ?? null,
  s: kitsu.get(m.id)?.slug ?? null,
  t: m.title.english || m.title.romaji,
  p: m.popularity,
  e: m.episodes,
  // Upcoming episodes with exact air times (unix seconds), soonest first.
  n: m.airingSchedule.nodes.map((x) => [x.episode, x.airingAt]),
  d: m.startDate.year ? `${m.startDate.year}-${String(m.startDate.month || 1).padStart(2, "0")}-${String(m.startDate.day || 1).padStart(2, "0")}` : null,
}));
writeFileSync(OUT, JSON.stringify({ generated: new Date().toISOString(), shows }));
console.log(`wrote ${shows.length} shows (${shows.filter((x) => x.s).length} on Kitsu) to ${OUT}`);
