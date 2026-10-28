/**
 * Facts from Wikidata (CC0, free for any use). People are matched by their AniList staff ID (P11227),
 * studios by name among items that carry a MyAnimeList company ID (P11490), so we never guess between
 * a studio and an unrelated company of the same name. Fails soft; cached for a week.
 */
const ENDPOINT = "https://query.wikidata.org/sparql";

type Binding = Record<string, { value: string } | undefined>;
async function sparql(query: string): Promise<Binding[]> {
  try {
    const res = await fetch(`${ENDPOINT}?query=${encodeURIComponent(query)}`, {
      headers: { Accept: "application/sparql-results+json", "User-Agent": "AniLumi/1.0 (https://anilumi.in)" },
      next: { revalidate: 604800 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) return [];
    return ((await res.json()) as { results?: { bindings?: Binding[] } }).results?.bindings || [];
  } catch {
    return [];
  }
}

const vals = (rows: Binding[], k: string) => [...new Set(rows.map((r) => r[k]?.value).filter((v): v is string => Boolean(v)))];
const q = (s: string) => JSON.stringify(s); // safe SPARQL string literal

export type PersonFacts = { qid: string; birthPlace: string | null; awards: string[]; website: string | null };

/** Collapse SPARQL rows for one person. Pure. */
export function toPersonFacts(rows: Binding[]): PersonFacts | null {
  const item = vals(rows, "item")[0];
  if (!item) return null;
  return { qid: item.split("/").pop()!, birthPlace: vals(rows, "placeLabel")[0] ?? null, awards: vals(rows, "awardLabel").slice(0, 6), website: vals(rows, "site")[0] ?? null };
}

export async function personFacts(anilistStaffId: number): Promise<PersonFacts | null> {
  if (!Number.isInteger(anilistStaffId)) return null;
  return toPersonFacts(await sparql(`SELECT ?item ?placeLabel ?awardLabel ?site WHERE { ?item wdt:P11227 ${q(String(anilistStaffId))}. OPTIONAL{?item wdt:P19 ?place} OPTIONAL{?item wdt:P166 ?award} OPTIONAL{?item wdt:P856 ?site} SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } } LIMIT 40`));
}

export type StudioFacts = { qid: string; founded: number | null; headquarters: string | null; founders: string[]; parent: string | null; website: string | null };

/** Collapse SPARQL rows for one studio. Pure. */
export function toStudioFacts(rows: Binding[]): StudioFacts | null {
  const item = vals(rows, "item")[0];
  if (!item) return null;
  const mine = rows.filter((r) => r.item?.value === item);
  const year = Number(vals(mine, "inception")[0]?.slice(0, 4));
  // Prefer a city over the country when Wikidata lists both.
  const hqs = vals(mine, "hqLabel");
  return { qid: item.split("/").pop()!, founded: year || null, headquarters: hqs.find((h) => h !== "Japan") ?? hqs[0] ?? null, founders: vals(mine, "founderLabel").slice(0, 3), parent: vals(mine, "parentLabel")[0] ?? null, website: vals(mine, "site").sort((a, b) => a.length - b.length)[0] ?? null };
}

/** Normalise a studio name for comparison: case, accents, punctuation. Pure. */
export const nameKey = (s: string) => s.normalize("NFKD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "");

export async function studioFacts(name: string): Promise<StudioFacts | null> {
  const n = name.trim();
  if (!n || n.length > 80) return null;
  // 1) Full-text search restricted to items with a MyAnimeList company ID: fast and case-insensitive.
  let ids: string[] = [];
  try {
    const url = `https://www.wikidata.org/w/api.php?action=query&list=search&format=json&srlimit=5&srsearch=${encodeURIComponent(`haswbstatement:P11490 ${n}`)}`;
    const res = await fetch(url, { headers: { "User-Agent": "AniLumi/1.0 (https://anilumi.in)" }, next: { revalidate: 604800 }, signal: AbortSignal.timeout(6000) });
    if (res.ok) ids = (((await res.json()) as { query?: { search?: { title: string }[] } }).query?.search || []).map((x) => x.title).filter((t) => /^Q\d+$/.test(t));
  } catch { /* fall through */ }
  if (!ids.length) return null;
  // 2) Facts for the candidates, keeping only the one whose English label or alias is the studio's name.
  const rows = await sparql(`SELECT ?item ?label ?alt ?inception ?hqLabel ?founderLabel ?parentLabel ?site WHERE { VALUES ?item { ${ids.map((i) => `wd:${i}`).join(" ")} } OPTIONAL{?item rdfs:label ?label FILTER(LANG(?label)="en")} OPTIONAL{?item skos:altLabel ?alt FILTER(LANG(?alt)="en")} OPTIONAL{?item wdt:P571 ?inception} OPTIONAL{?item wdt:P159 ?hq} OPTIONAL{?item wdt:P112 ?founder} OPTIONAL{?item wdt:P749 ?parent} OPTIONAL{?item wdt:P856 ?site} SERVICE wikibase:label { bd:serviceParam wikibase:language "en". } } LIMIT 200`);
  const want = nameKey(n);
  const match = ids.map((id) => `http://www.wikidata.org/entity/${id}`).find((uri) => rows.some((r) => r.item?.value === uri && [r.label?.value, r.alt?.value].some((x) => x && nameKey(x) === want)));
  return match ? toStudioFacts(rows.filter((r) => r.item?.value === match)) : null;
}
