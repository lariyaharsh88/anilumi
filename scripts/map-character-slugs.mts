/**
 * Adds each snapshot character's Kitsu page slug (`k`) to data/characters.json, by matching names within the
 * character's own anime (Kitsu's cast for that show, main roles first). Used for the sitemap. Kitsu only, no
 * AniList calls. Runs monthly after scripts/fetch-characters.mts; by hand: npx tsx scripts/map-character-slugs.mts
 */
import { readFileSync, writeFileSync } from "node:fs";

const FILE = new URL("../data/characters.json", import.meta.url);
const data = JSON.parse(readFileSync(FILE, "utf8")) as { generated: string; characters: { id: number; n: string; s: string; f: number; k?: string; al?: string[] }[] };
// Snapshot-only pages (Kitsu has no entry) keep their own slugs; never map those characters.
const snapOnly = new Set(Object.keys((JSON.parse(readFileSync(new URL("../data/character-pages-extra.json", import.meta.url), "utf8")) as { pages: Record<string, string> }).pages).map(Number));
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

// FALLBACK_ONLY=1 skips the cast pass (already done this month) and runs only the name search below.
const shows = process.env.FALLBACK_ONLY === "1" ? [] : [...new Set(data.characters.map((c) => c.s))];
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
  // First page of the cast (main roles first); more pages (up to 60 characters) only while someone is unmatched.
  for (let offset = 0; offset <= 40 && want.some((c) => !c.k); offset += 20) {
    const j = await get<{ included?: { type: string; attributes: { slug: string; canonicalName: string } }[] }>(
      `https://kitsu.io/api/edge/anime/${id}/characters?include=character&fields[characters]=slug,canonicalName&fields[mediaCharacters]=character&sort=role&page[limit]=20&page[offset]=${offset}`,
    );
    const cast = (j?.included || []).filter((x) => x.type === "characters");
    for (const c of want) {
      if (c.k) continue;
      // Then by other names: Kitsu may list "Eren Jaeger" where AniList says "Eren Yeager".
      let hits = cast.filter((x) => same(c.n, x.attributes.canonicalName));
      if (!hits.length && c.al) hits = cast.filter((x) => c.al!.some((n) => same(n, x.attributes.canonicalName)));
      if (hits.length === 1) { c.k = hits[0].attributes.slug; matched++; }
    }
    await sleep(250);
  }
  process.stdout.write(`shows ${done}/${shows.length}, matched ${matched}\r`);
}
// The cast pass reads at most 60 characters a show, so big casts (One Piece's Boa Hancock, Doflamingo) and shows
// whose Kitsu cast is empty stay unmatched. Fallback for well-loved characters: Kitsu's name search, accepted only
// when exactly one hit appears in the character's own show.
const taken = new Set(data.characters.flatMap((c) => (c.k ? [c.k] : [])));
const rest = data.characters.filter((c) => !c.k && !snapOnly.has(c.id) && c.f >= 500).sort((a, b) => b.f - a.f);
let found = 0;
for (const [i, c] of rest.entries()) {
  for (const name of [c.n, ...(c.al ?? [])].slice(0, 2)) {
    type Res = { data: { id: string; attributes: { slug: string; canonicalName: string }; relationships?: { mediaCharacters?: { data?: { id: string }[] } } }[]; included?: { id: string; type: string; attributes: { slug?: string }; relationships?: { media?: { data?: { id: string; type: string } | null } } }[] };
    const j = await get<Res>(`https://kitsu.io/api/edge/characters?filter[name]=${encodeURIComponent(name)}&include=mediaCharacters.media&fields[characters]=slug,canonicalName,mediaCharacters&fields[mediaCharacters]=media&fields[anime]=slug&fields[manga]=slug&page[limit]=10`);
    await sleep(300);
    if (!j) continue;
    const inc = new Map((j.included || []).map((x) => [`${x.type}:${x.id}`, x]));
    const showsOf = (ch: Res["data"][number]) => (ch.relationships?.mediaCharacters?.data || []).flatMap((mc) => {
      const m = inc.get(`mediaCharacters:${mc.id}`)?.relationships?.media?.data;
      const slug = m ? inc.get(`${m.type}:${m.id}`)?.attributes.slug : undefined;
      return slug ? [slug] : [];
    });
    const hits = j.data.filter((ch) => same(name, ch.attributes.canonicalName) && showsOf(ch).includes(c.s) && !taken.has(ch.attributes.slug));
    if (hits.length === 1) { c.k = hits[0].attributes.slug; taken.add(c.k); found++; break; }
  }
  process.stdout.write(`name search ${i + 1}/${rest.length}, matched ${found}\r`);
}
matched += found;

// One page per character: when two characters matched the same Kitsu slug (Chomusuke under "megumin"), the
// most-favourited keeps it and the others lose the link.
const owner = new Map<string, (typeof data.characters)[number]>();
for (const c of data.characters) {
  if (!c.k) continue;
  const prev = owner.get(c.k);
  if (!prev) { owner.set(c.k, c); continue; }
  const loser = prev.f >= c.f ? c : prev;
  console.log(`\nslug ${c.k} matched twice; dropped from ${loser.n}`);
  if (loser === prev) owner.set(c.k, c);
  delete loser.k;
}
writeFileSync(FILE, JSON.stringify(data));
console.log(`\nmatched ${matched} of ${data.characters.length} characters to Kitsu pages`);
