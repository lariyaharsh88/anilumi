/**
 * Builds data/birthdays.json: the most-favourited anime characters and voice actors with a known
 * birthday, each character linked to its most popular anime's Kitsu slug. AniList can only filter by
 * "birthday is today", so date pages need this snapshot. Re-run every few months:
 *   npx tsx scripts/fetch-birthdays.mts
 */
import { writeFileSync } from "node:fs";

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
async function al<T>(query: string, variables: Record<string, unknown>): Promise<T> {
  for (let i = 0; i < 6; i++) {
    const res = await fetch("https://graphql.anilist.co", { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify({ query, variables }) });
    if (res.status === 429) { await sleep((Number(res.headers.get("retry-after")) || 30) * 1000); continue; }
    if (!res.ok) throw new Error(`AniList ${res.status}`);
    return ((await res.json()) as { data: T }).data;
  }
  throw new Error("AniList kept rate-limiting");
}

type Ch = { id: number; name: { full: string }; image: { medium: string | null }; dateOfBirth: { month: number | null; day: number | null }; favourites: number; media: { nodes: { id: number; isAdult: boolean; title: { romaji: string; english: string | null } }[] } };
type St = { id: number; name: { full: string; native: string | null }; image: { medium: string | null }; dateOfBirth: { year: number | null; month: number | null; day: number | null }; favourites: number; primaryOccupations: string[]; languageV2: string | null };

const chars: Ch[] = [];
for (let page = 1; page <= 40; page++) {
  const d = await al<{ Page: { characters: Ch[] } }>("query($p:Int){Page(page:$p,perPage:50){characters(sort:FAVOURITES_DESC){id name{full} image{medium} dateOfBirth{month day} favourites media(perPage:1,sort:POPULARITY_DESC,type:ANIME){nodes{id isAdult title{romaji english}}}}}}", { p: page });
  chars.push(...d.Page.characters);
  process.stdout.write(`characters page ${page}\r`);
  await sleep(2200);
}
const staff: St[] = [];
for (let page = 1; page <= 10; page++) {
  const d = await al<{ Page: { staff: St[] } }>("query($p:Int){Page(page:$p,perPage:50){staff(sort:FAVOURITES_DESC){id name{full native} image{medium} dateOfBirth{year month day} favourites primaryOccupations languageV2}}}", { p: page });
  staff.push(...d.Page.staff);
  process.stdout.write(`staff page ${page}     \r`);
  await sleep(2200);
}

const withBday = chars.filter((c) => c.dateOfBirth.month && c.dateOfBirth.day && c.media.nodes[0] && !c.media.nodes[0].isAdult);
// AniList media id -> Kitsu slug/title via Kitsu's mappings (20 per request).
const mediaIds = [...new Set(withBday.map((c) => c.media.nodes[0].id))];
const kitsu = new Map<number, { slug: string; title: string }>();
for (let i = 0; i < mediaIds.length; i += 20) {
  const ids = mediaIds.slice(i, i + 20);
  const url = `https://kitsu.io/api/edge/mappings?filter[externalSite]=anilist/anime&filter[externalId]=${ids.join(",")}&include=item&page[limit]=20&fields[mappings]=externalId,item&fields[anime]=slug,canonicalTitle,nsfw,ageRating`;
  const res = await fetch(url, { headers: { Accept: "application/vnd.api+json" } });
  if (res.ok) {
    const j = (await res.json()) as { data: { attributes: { externalId: string }; relationships: { item: { data: { id: string; type: string } | null } } }[]; included?: { id: string; type: string; attributes: { slug: string; canonicalTitle: string; nsfw: boolean; ageRating: string | null } }[] };
    const inc = new Map((j.included || []).filter((x) => x.type === "anime").map((x) => [x.id, x.attributes]));
    for (const m of j.data) {
      const a = m.relationships.item.data ? inc.get(m.relationships.item.data.id) : undefined;
      if (a && !a.nsfw && a.ageRating !== "R18") kitsu.set(Number(m.attributes.externalId), { slug: a.slug, title: a.canonicalTitle });
    }
  }
  process.stdout.write(`kitsu mappings ${i + ids.length}/${mediaIds.length}\r`);
  await sleep(300);
}

const out = {
  generated: new Date().toISOString().slice(0, 10),
  characters: withBday.map((c) => {
    const m = c.media.nodes[0];
    const k = kitsu.get(m.id);
    return { id: c.id, n: c.name.full.trim(), i: c.image.medium, m: c.dateOfBirth.month!, d: c.dateOfBirth.day!, f: c.favourites, s: k?.slug ?? null, t: k?.title ?? (m.title.english || m.title.romaji) };
  }),
  people: staff
    .filter((s) => s.dateOfBirth.month && s.dateOfBirth.day && s.primaryOccupations?.some((o) => /voice actor/i.test(o)))
    .map((s) => ({ id: s.id, n: s.name.full.trim(), j: s.name.native, i: s.image.medium, m: s.dateOfBirth.month!, d: s.dateOfBirth.day!, y: s.dateOfBirth.year, f: s.favourites, l: s.languageV2 })),
};
writeFileSync(new URL("../data/birthdays.json", import.meta.url), JSON.stringify(out));
console.log(`\nwrote ${out.characters.length} characters, ${out.people.length} voice actors`);
