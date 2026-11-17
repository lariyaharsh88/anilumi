/**
 * Character and voice-actor search for the search bar and /search, over snapshots already bundled with the site
 * (no API calls): every character in the snapshot (data/characters.json; one without its own page links to its anime), the voice actors in the hub, the people
 * snapshot and the cast snapshot (data/voice-actors.json, data/casts.json), and the Hindi voice artists. Matches the
 * full name, any word of it ("gojo", "satoru"), aliases and the native name; ranked by how well it matches, then by
 * popularity. Server-only (the index is built once per instance).
 */
import chars from "@/data/characters.json";
import vaData from "@/data/voice-actors.json";
import castData from "@/data/casts.json";
import { snapImage, type SnapChar } from "./charsnap";
import { hindiArtists, hindiArtistPath } from "./hindivoices";
import { vaPath } from "./anilist";
import { IMG_PREFIX } from "./snapjson";

export type PersonKind = "character" | "voice-actor" | "hindi-voice";
export type PersonHit = { kind: PersonKind; name: string; sub: string; href: string; image: string | null; strong: boolean };
type Entry = { kind: PersonKind; name: string; sub: string; href: string; image: string | null; keys: string[]; words: string[]; pop: number };

const fold = (s: string) => s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase();
const key = (s: string) => fold(s).replace(/[^a-z0-9]+/g, "");
const wordsOf = (s: string) => fold(s).split(/[^a-z0-9]+/).filter(Boolean);
const img = (i: string | null | undefined) => (i ? (i.startsWith("~/") ? IMG_PREFIX + i.slice(2) : i) : null);

type Va = { id: number; name: string; native?: string | null; image?: string | null; alternative?: string[]; language?: string | null; favourites?: number };
type CastVa = [number, string, string | null, string | null];

let index: Entry[] | null = null;
function build(): Entry[] {
  const out: Entry[] = [];
  for (const c of (chars as unknown as { characters: (SnapChar & { al?: string[] })[] }).characters) {
    const names = [c.n, ...(c.al ?? [])];
    out.push({ kind: "character", name: c.n, sub: `Character · ${c.t}`, href: c.k ? `/character/${c.k}` : `/anime/${c.s}`, image: snapImage(c), keys: names.map(key), words: names.flatMap(wordsOf), pop: c.f });
  }
  const vas = new Map<number, { va: Va; roles: number; lang: string | null }>();
  const d = vaData as unknown as { hub: Va[]; people: Record<string, Va> };
  for (const v of d.hub) vas.set(v.id, { va: v, roles: 0, lang: v.language ?? null });
  for (const v of Object.values(d.people)) if (!vas.has(v.id)) vas.set(v.id, { va: v, roles: 0, lang: v.language ?? null });
  for (const s of Object.values((castData as unknown as { casts: Record<string, { e: { jp?: CastVa; en?: CastVa }[] }> }).casts)) {
    for (const e of s.e) for (const [lang, v] of [["Japanese", e.jp], ["English", e.en]] as const) {
      if (!v) continue;
      const known = vas.get(v[0]);
      if (known) { known.roles++; known.lang ??= lang; } else vas.set(v[0], { va: { id: v[0], name: v[1], native: v[2], image: v[3] }, roles: 1, lang });
    }
  }
  for (const { va, roles, lang } of vas.values()) {
    const names = [va.name, ...(va.alternative ?? [])];
    out.push({ kind: "voice-actor", name: va.name, sub: `Voice actor${lang ? ` · ${lang}` : ""}`, href: vaPath(va), image: img(va.image), keys: [...names.map(key), ...(va.native ? [va.native.replace(/\s+/g, "")] : [])], words: names.flatMap(wordsOf), pop: (va.favourites ?? 0) + roles * 50 });
  }
  for (const a of hindiArtists()) {
    const names = [a.name, ...(a.knownAs ?? [])];
    const lead = a.roles[0];
    out.push({ kind: "hindi-voice", name: a.name, sub: `Hindi voice artist${lead ? ` · ${lead.character} (${lead.anime})` : ""}`, href: hindiArtistPath(a), image: null, keys: names.map(key), words: names.flatMap(wordsOf), pop: 100_000 + a.roles.length * 1000 });
  }
  return out;
}

/** How well `e` matches the query: 4 exact name, 3 name starts with it, 2 every query word starts a name word, 1 contains it. */
function match(e: Entry, q: string, qWords: string[], raw: string): number {
  if (e.keys.includes(q) || (raw && e.keys.includes(raw))) return 4;
  if (e.keys.some((k) => k.startsWith(q))) return 3;
  if (qWords.length && qWords.every((w) => e.words.some((x) => x.startsWith(w)))) return 2;
  // The stored name is part of what was typed: "levi ackerman" finds the character stored as "Levi".
  const nameWords = wordsOf(e.name);
  if (nameWords.length && key(e.name).length >= 4 && nameWords.every((w) => qWords.includes(w))) return 2;
  if (q.length >= 4 && e.keys.some((k) => k.includes(q))) return 1;
  return 0;
}

/** Characters and voice actors matching `query`, best first. `strong`: the name itself matches, worth showing above anime. */
export function searchPeople(query: string, limit = 4): PersonHit[] {
  const q = key(query);
  if (q.length < 2) return [];
  const qWords = wordsOf(query).filter((w) => w.length > 1); // "Monkey D. Luffy": the initial isn't a word to match
  const raw = query.replace(/\s+/g, "");
  index ??= build();
  // Short queries ("one", "aot") are usually anime: a person shows only on an exact name ("Ken" would, "Ken Kaneki" not).
  const hits = index.map((e) => ({ e, m: match(e, q, qWords, raw) })).filter((x) => x.m >= (q.length <= 3 ? 4 : 1));
  // Substring-only matches ("gojo" in "Regojo") only when nothing better exists.
  const best = hits.some((x) => x.m >= 2) ? hits.filter((x) => x.m >= 2) : hits;
  // A famous name matched by one of its words ("gojo", "nezuko") ranks with the full-name matches.
  const rank = (x: { e: Entry; m: number }) => (x.m === 2 && x.e.pop >= 5000 ? 3 : x.m);
  return best
    .sort((a, b) => rank(b) - rank(a) || b.e.pop - a.e.pop)
    .slice(0, limit)
    .map((x) => ({ kind: x.e.kind, name: x.e.name, sub: x.e.sub, href: x.e.href, image: x.e.image, strong: rank(x) >= 3 }));
}
