/**
 * Kitsu keeps some finished shows at "current" for months (Haigakura, Touhai, Rock wa Lady: "airing" a year after
 * their finales), so pages promised new episodes that never come. This lists every show Kitsu calls current, asks
 * AniList for their status, and writes the ones AniList has as finished or cancelled to data/status-fixes.json
 * (Kitsu id → end date), which lib/kitsu.ts applies. Run monthly by refresh-data.yml; by hand:
 *   npx tsx scripts/fix-stale-status.mts
 */
import { writeFileSync } from "node:fs";

const H = { Accept: "application/vnd.api+json" };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

// 1. Every show Kitsu lists as current, with its AniList mapping.
const current = new Map<string, { slug: string; title: string; al: number | null }>();
let url: string | null = "https://kitsu.io/api/edge/anime?filter[status]=current&page[limit]=20&include=mappings&fields[anime]=slug,canonicalTitle,mappings&fields[mappings]=externalSite,externalId";
while (url) {
  const res = await fetch(url, { headers: H, signal: AbortSignal.timeout(30_000) }).catch(() => null);
  if (!res?.ok) { console.warn(`Kitsu ${res?.status ?? "network"}; stopping at ${current.size}`); break; }
  const j = (await res.json()) as { data: { id: string; attributes: { slug: string; canonicalTitle: string }; relationships: { mappings: { data: { id: string }[] } } }[]; included?: { id: string; type: string; attributes: { externalSite: string; externalId: string } }[]; links: { next?: string } };
  const maps = new Map((j.included || []).filter((x) => x.type === "mappings").map((x) => [x.id, x.attributes]));
  for (const a of j.data) {
    const al = a.relationships.mappings.data.map((m) => maps.get(m.id)).find((m) => m?.externalSite === "anilist/anime");
    current.set(a.id, { slug: a.attributes.slug, title: a.attributes.canonicalTitle, al: al ? Number(al.externalId) : null });
  }
  url = j.links.next ?? null;
  await sleep(250);
}
console.log(`Kitsu: ${current.size} shows marked current`);

// 2. AniList status for them, 50 per request.
type Al = { id: number; status: string; episodes: number | null; endDate: { year: number | null; month: number | null; day: number | null } };
const alIds = [...current.values()].map((x) => x.al).filter((x): x is number => Boolean(x));
const byAl = new Map<number, Al>();
for (let i = 0; i < alIds.length; i += 50) {
  const ids = alIds.slice(i, i + 50);
  for (let attempt = 0; attempt < 4; attempt++) {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify({ query: "query($ids:[Int]){Page(perPage:50){media(id_in:$ids,type:ANIME){id status episodes endDate{year month day}}}}", variables: { ids } }),
    }).catch(() => null);
    if (res?.status === 429) { await sleep((Number(res.headers.get("retry-after")) || 60) * 1000); continue; }
    if (!res?.ok) { await sleep(3000 * (attempt + 1)); continue; }
    for (const m of ((await res.json()) as { data: { Page: { media: Al[] } } }).data.Page.media) byAl.set(m.id, m);
    break;
  }
  await sleep(2500);
}

// 3. Finished or cancelled on AniList, with a full end date: the fix.
const pad = (n: number | null) => String(n ?? 1).padStart(2, "0");
const shows: Record<string, { slug: string; title: string; status: "finished"; endDate: string; episodes: number | null }> = {};
for (const [id, k] of current) {
  const m = k.al ? byAl.get(k.al) : undefined;
  if (!m || !(m.status === "FINISHED" || m.status === "CANCELLED") || !m.endDate.year) continue;
  shows[id] = { slug: k.slug, title: k.title, status: "finished", endDate: `${m.endDate.year}-${pad(m.endDate.month)}-${pad(m.endDate.day)}`, episodes: m.episodes };
}
writeFileSync(new URL("../data/status-fixes.json", import.meta.url), JSON.stringify({ generated: new Date().toISOString(), source: "AniList status for shows Kitsu marks current", shows }, null, 1) + "\n");
console.log(`${Object.keys(shows).length} shows Kitsu calls current that AniList has as finished`);
