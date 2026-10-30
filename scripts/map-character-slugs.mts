/**
 * Adds each snapshot character's Kitsu page slug (`k`) to data/characters.json, by matching names within the
 * character's own anime (Kitsu's cast for that show, main roles first). Used for the sitemap. Kitsu only, no
 * AniList calls. Runs monthly after scripts/fetch-characters.mts; by hand: npx tsx scripts/map-character-slugs.mts
 */
import { readFileSync, writeFileSync } from "node:fs";

const FILE = new URL("../data/characters.json", import.meta.url);
const data = JSON.parse(readFileSync(FILE, "utf8")) as { generated: string; characters: { n: string; s: string; k?: string }[] };
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
const H = { Accept: "application/vnd.api+json", "User-Agent": "AniLumi data refresh (+https://anilumi.in)" };
const key = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length > 1).sort();
const same = (a: string, b: string) => {
  const x = key(a), y = key(b);
  if (x.length < 1 || y.length < 1) return false;
  if (x.join(" ") === y.join(" ")) return true;
  const [s, l] = x.length <= y.length ? [x, y] : [y, x];
  return s.length >= 2 && s.every((w) => l.includes(w)); // "Luffy Monkey" ⊂ "Monkey D. Luffy"
};

async function get<T>(url: string): Promise<T | null> {
  for (let i = 0; i < 3; i++) {
    const res = await fetch(url, { headers: H }).catch(() => null);
    if (res?.ok) return (await res.json()) as T;
    await sleep(1000 * (i + 1));
  }
  return null;
}

const shows = [...new Set(data.characters.map((c) => c.s))];
const ids = new Map<string, string>();
for (let i = 0; i < shows.length; i += 20) {
  const j = await get<{ data: { id: string; attributes: { slug: string } }[] }>(`https://kitsu.io/api/edge/anime?filter[slug]=${shows.slice(i, i + 20).join(",")}&fields[anime]=slug&page[limit]=20`);
  for (const a of j?.data || []) ids.set(a.attributes.slug, a.id);
  await sleep(250);
}

let matched = 0, done = 0;
for (const slug of shows) {
  const want = data.characters.filter((c) => c.s === slug);
  const id = ids.get(slug);
  done++;
  if (!id) continue;
  // First page of the cast (main roles first); a second page only if someone is still unmatched.
  for (let offset = 0; offset <= 20 && want.some((c) => !c.k); offset += 20) {
    const j = await get<{ included?: { type: string; attributes: { slug: string; canonicalName: string } }[] }>(
      `https://kitsu.io/api/edge/anime/${id}/characters?include=character&fields[characters]=slug,canonicalName&fields[mediaCharacters]=character&sort=role&page[limit]=20&page[offset]=${offset}`,
    );
    const cast = (j?.included || []).filter((x) => x.type === "characters");
    for (const c of want) {
      if (c.k) continue;
      const hits = cast.filter((x) => same(c.n, x.attributes.canonicalName));
      if (hits.length === 1) { c.k = hits[0].attributes.slug; matched++; }
    }
    await sleep(250);
  }
  process.stdout.write(`shows ${done}/${shows.length}, matched ${matched}\r`);
}
writeFileSync(FILE, JSON.stringify(data));
console.log(`\nmatched ${matched} of ${data.characters.length} characters to Kitsu pages`);
