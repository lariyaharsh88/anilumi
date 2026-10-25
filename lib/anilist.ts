/**
 * AniList GraphQL client plus cast and voice-actor data. AniList's character and staff data is far
 * richer than Kitsu's, so voice actors come from here. Everything fails soft (null / empty) and is
 * cached by Next's fetch cache plus a small in-process memo, because the public API is rate-limited.
 */
import { getAniListId, ANILIST_MIN_REVALIDATE, UpstreamError } from "./kitsu";

/**
 * `strict`: for pages whose main content comes from AniList. A network error, 5xx or exhausted 429 throws
 * UpstreamError instead of returning null, so the page errors (and is retried) rather than caching an
 * empty "nothing found" result for days. A real 404 (no such staff/media) still returns null.
 */
export async function anilist<T>(query: string, variables: Record<string, unknown>, revalidate: number, { strict = false }: { strict?: boolean } = {}): Promise<T | null> {
  if (process.env.ANILIST_ENRICH === "0") return null;
  const fail = (why: string) => {
    if (strict) throw new UpstreamError(`AniList unavailable: ${why}`);
    return null;
  };
  // Builds fire many requests at once; on a 429, wait as long as AniList asks (capped) and retry twice.
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const res = await fetch("https://graphql.anilist.co", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ query, variables }),
        next: { revalidate: Math.max(revalidate, ANILIST_MIN_REVALIDATE) },
        signal: AbortSignal.timeout(Number(process.env.ANILIST_TIMEOUT_MS) || 5000),
      });
      if (res.status === 429 && attempt < 2) {
        const wait = Math.min(Number(res.headers.get("retry-after")) || 2, 8);
        await new Promise((r) => setTimeout(r, wait * 1000));
        continue;
      }
      if (res.status === 404) return null;
      if (!res.ok) {
        if (process.env.ANILIST_DEBUG === "1") console.warn(`[anilist] HTTP ${res.status}`);
        return fail(`HTTP ${res.status}`);
      }
      const j = (await res.json()) as { data?: T };
      return j.data ?? null;
    } catch (err) {
      if (err instanceof UpstreamError) throw err;
      return fail((err as Error).name);
    }
  }
  return fail("rate limited");
}

const memo = new Map<string, { v: unknown; exp: number }>();
export async function memoized<T>(key: string, ttlMs: number, fn: () => Promise<T | null>): Promise<T | null> {
  const hit = memo.get(key);
  if (hit && hit.exp > Date.now()) return hit.v as T;
  const v = await fn();
  if (v !== null) memo.set(key, { v, exp: Date.now() + ttlMs });
  return v;
}

/* ---------------- helpers (pure) ---------------- */

/** "Yūki Kaji" → "yuki-kaji". */
export function slugify(s: string): string {
  return s.normalize("NFKD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

export const vaPath = (va: { id: number; name: string }) => `/voice-actor/${va.id}-${slugify(va.name) || "va"}`;

/** "95672-yuuki-kaji" → 95672. */
export function vaIdFromParam(p: string): number | null {
  const m = decodeURIComponent(p).match(/^(\d+)/);
  return m ? Number(m[1]) : null;
}

/** Name match that ignores order, case and accents: "Yeager Eren" ≈ "Eren Yeager". */
export function sameName(a: string, b: string): boolean {
  const k = (s: string) => slugify(s).split("-").filter(Boolean).sort().join(" ");
  return Boolean(a && b) && k(a) === k(b);
}

export type BioFact = { label: string; value: string };

/**
 * AniList bios are markdown with spoiler tags, link lists and "__Key:__ value" fact lines.
 * Returns readable paragraphs plus the facts. Pure.
 */
export function cleanBio(md: string | null): { text: string; facts: BioFact[] } {
  if (!md) return { text: "", facts: [] };
  const facts: BioFact[] = [];
  const keep: string[] = [];
  let skipping = false;
  const plain = (s: string) =>
    s
      .replace(/~!([\s\S]*?)!~/g, "")
      .replace(/!\[[^\]]*\]\([^)]*\)/g, "")
      .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
      .replace(/<[^>]+>/g, "")
      .replace(/__|\*\*|~~/g, "")
      .replace(/\s+/g, " ")
      .trim();
  for (const raw of md.replace(/~!([\s\S]*?)!~/g, "").split(/\n+/)) {
    const line = raw.trim();
    if (!line) continue;
    const fact = line.match(/^__([^_:]{2,30}):__\s*(.+)$/) || line.match(/^\*\*([^*:]{2,30}):\*\*\s*(.+)$/);
    if (fact) {
      const v = plain(fact[2]);
      if (v && v.length <= 80) facts.push({ label: fact[1].trim(), value: v });
      else skipping = true; // "__Non-Anime Roles:__" style section headers
      continue;
    }
    if (/^__[^_]+__\s*:?$/.test(line)) { skipping = true; continue; }
    if (skipping && /^[-*•]/.test(line)) continue;
    if (/^[-*•]/.test(line)) continue;
    skipping = false;
    const p = plain(line);
    if (!p || /^[\w .()'&-]+( \| [\w .()'&-]+)+$/.test(p)) continue; // "Profile | Twitter | Instagram"
    keep.push(p);
  }
  let text = keep.join("\n\n");
  if (text.length > 1400) text = text.slice(0, 1400).replace(/\s+\S*$/, "") + "…";
  return { text, facts: facts.slice(0, 8) };
}

/* ---------------- cast of an anime ---------------- */

export type Va = { id: number; name: string; native: string | null; image: string | null };
export type CastEntry = {
  character: { id: number; name: string; native: string | null; image: string | null };
  role: "MAIN" | "SUPPORTING" | "BACKGROUND";
  jp: Va | null;
  en: Va | null;
  otherDubs: number;
};
export type Cast = { anilistId: number; entries: CastEntry[]; total: number };

type AlName = { full: string; native: string | null };
type AlVa = { id: number; name: AlName; image: { medium: string | null } | null; languageV2: string };
const toVa = (v: AlVa | undefined): Va | null => (v ? { id: v.id, name: v.name.full.trim(), native: v.name.native, image: v.image?.medium || null } : null);

export async function getCast(kitsuId: string, perPage = 25, strict = false): Promise<Cast | null> {
  const id = await getAniListId(kitsuId);
  if (!id) return null;
  return memoized(`cast:${id}:${perPage}`, 6 * 3600_000, async () => {
    // voiceActorRoles (not aliased voiceActors(language:…)): AniList ignores per-alias arguments.
    const d = await anilist<{ Media: { characters: { pageInfo: { total: number }; edges: { role: CastEntry["role"]; node: { id: number; name: AlName; image: { medium: string | null } | null }; voiceActorRoles: { voiceActor: AlVa | null }[] }[] } } | null }>(
      "query($id:Int,$n:Int){Media(id:$id,type:ANIME){characters(sort:[ROLE,RELEVANCE,ID],perPage:$n){pageInfo{total} edges{role node{id name{full native} image{medium}} voiceActorRoles(sort:[RELEVANCE,ID]){voiceActor{id name{full native} image{medium} languageV2}}}}}}",
      { id, n: perPage },
      86400,
      { strict },
    );
    const c = d?.Media?.characters;
    if (!c) return null;
    return {
      anilistId: id,
      total: c.pageInfo.total,
      entries: c.edges.map((e) => {
        const vas = (e.voiceActorRoles || []).map((r) => r.voiceActor).filter((v): v is AlVa => Boolean(v));
        const jp = vas.find((v) => v.languageV2 === "Japanese");
        const en = vas.find((v) => v.languageV2 === "English");
        return {
          character: { id: e.node.id, name: e.node.name.full.trim(), native: e.node.name.native, image: e.node.image?.medium || null },
          role: e.role,
          jp: toVa(jp),
          en: toVa(en),
          otherDubs: new Set(vas.map((v) => v.languageV2).filter((l) => l !== "Japanese" && l !== "English")).size,
        };
      }),
    };
  });
}

/* ---------------- a voice actor ---------------- */

export type VaRole = {
  media: { id: number; title: string; format: string | null; year: number | null; popularity: number; score: number | null; cover: string | null };
  role: string;
  characters: { id: number; name: string; image: string | null }[];
};
export type VoiceActor = Va & {
  alternative: string[];
  imageLarge: string | null;
  bio: string | null;
  occupations: string[];
  gender: string | null;
  birth: { year: number | null; month: number | null; day: number | null } | null;
  age: number | null;
  yearsActive: number[];
  homeTown: string | null;
  language: string | null;
  favourites: number;
  totalRoles: number;
  roles: VaRole[];
};

type AlStaff = {
  id: number; name: AlName & { alternative: string[] }; image: { large: string | null; medium: string | null } | null; description: string | null;
  primaryOccupations: string[]; gender: string | null; dateOfBirth: { year: number | null; month: number | null; day: number | null } | null;
  age: number | null; yearsActive: number[]; homeTown: string | null; languageV2: string | null; favourites: number;
  characterMedia: { pageInfo: { total: number }; edges: { characterRole: string; node: { id: number; format: string | null; title: { romaji: string; english: string | null }; popularity: number; seasonYear: number | null; startDate: { year: number | null } | null; averageScore: number | null; coverImage: { medium: string | null } | null; isAdult: boolean }; characters: ({ id: number; name: { full: string }; image: { medium: string | null } | null } | null)[] }[] };
};

const STAFF_Q =
  "query($id:Int,$p:Int){Staff(id:$id){id name{full native alternative} image{large medium} description primaryOccupations gender dateOfBirth{year month day} age yearsActive homeTown languageV2 favourites characterMedia(page:$p,perPage:50,sort:[POPULARITY_DESC]){pageInfo{total} edges{characterRole node{id format title{romaji english} popularity seasonYear startDate{year} averageScore coverImage{medium} isAdult} characters{id name{full} image{medium}}}}}}";

export async function getVoiceActor(staffId: number): Promise<VoiceActor | null> {
  return memoized(`va:${staffId}`, 6 * 3600_000, async () => {
    const [p1, p2] = await Promise.all([1, 2].map((p) => anilist<{ Staff: AlStaff | null }>(STAFF_Q, { id: staffId, p }, 86400, { strict: p === 1 })));
    const s = p1?.Staff;
    if (!s) return null;
    const edges = [...s.characterMedia.edges, ...(p2?.Staff?.characterMedia.edges || [])];
    const seen = new Set<number>();
    const roles: VaRole[] = [];
    for (const e of edges) {
      if (e.node.isAdult || seen.has(e.node.id)) continue;
      seen.add(e.node.id);
      roles.push({
        media: { id: e.node.id, title: e.node.title.english || e.node.title.romaji, format: e.node.format, year: e.node.seasonYear ?? e.node.startDate?.year ?? null, popularity: e.node.popularity, score: e.node.averageScore ? e.node.averageScore / 10 : null, cover: e.node.coverImage?.medium || null },
        role: e.characterRole,
        characters: e.characters.filter((c): c is NonNullable<typeof c> => Boolean(c)).map((c) => ({ id: c.id, name: c.name.full.trim(), image: c.image?.medium || null })),
      });
    }
    return {
      id: s.id, name: s.name.full.trim(), native: s.name.native, image: s.image?.medium || null, imageLarge: s.image?.large || null,
      alternative: (s.name.alternative || []).filter(Boolean), bio: s.description, occupations: s.primaryOccupations || [], gender: s.gender,
      birth: s.dateOfBirth?.month ? s.dateOfBirth : null, age: s.age, yearsActive: s.yearsActive || [], homeTown: s.homeTown,
      language: s.languageV2, favourites: s.favourites, totalRoles: s.characterMedia.pageInfo.total, roles,
    };
  });
}

/** Voice actors most favourited on AniList (hub page). */
export async function popularVoiceActors(): Promise<(Va & { language: string | null; favourites: number })[]> {
  const pages = await Promise.all([1, 2].map((page) =>
    anilist<{ Page: { staff: { id: number; name: AlName; image: { medium: string | null } | null; primaryOccupations: string[]; languageV2: string | null; favourites: number }[] } }>(
      "query($p:Int){Page(page:$p,perPage:50){staff(sort:FAVOURITES_DESC){id name{full native} image{medium} primaryOccupations languageV2 favourites}}}",
      { p: page },
      86400,
    ),
  ));
  return pages
    .flatMap((d) => d?.Page.staff || [])
    .filter((s) => s.primaryOccupations?.some((o) => /voice actor/i.test(o)))
    .map((s) => ({ id: s.id, name: s.name.full.trim(), native: s.name.native, image: s.image?.medium || null, language: s.languageV2, favourites: s.favourites }));
}

/* ---------------- sequel announcements ---------------- */

export type AlSequel = { anilistId: number; title: string; status: "finished" | "current" | "upcoming"; startDate: string | null; expected: string | null; format: string | null };
const AL_STATUS = { FINISHED: "finished", RELEASING: "current", HIATUS: "current", NOT_YET_RELEASED: "upcoming" } as const;
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

/** AniList's direct anime sequel, which often appears before Kitsu lists it. Pure mapping in alSequelFrom. */
export function alSequelFrom(edges: { relationType: string; node: { id: number; type: string; format: string | null; status: string; title: { romaji: string; english: string | null }; startDate: { year: number | null; month: number | null; day: number | null } | null } }[]): AlSequel | null {
  const e = edges.find((x) => x.relationType === "SEQUEL" && x.node.type === "ANIME" && x.node.status in AL_STATUS);
  if (!e) return null;
  const d = e.node.startDate;
  const full = d?.year && d.month && d.day ? `${d.year}-${String(d.month).padStart(2, "0")}-${String(d.day).padStart(2, "0")}` : null;
  const expected = !full && d?.year ? (d.month ? `${MONTHS[d.month - 1]} ${d.year}` : String(d.year)) : null;
  return { anilistId: e.node.id, title: e.node.title.english || e.node.title.romaji, status: AL_STATUS[e.node.status as keyof typeof AL_STATUS], startDate: full, expected, format: e.node.format };
}

export async function getAniListSequel(kitsuId: string): Promise<AlSequel | null> {
  const id = await getAniListId(kitsuId);
  if (!id) return null;
  const d = await anilist<{ Media: { relations: { edges: Parameters<typeof alSequelFrom>[0] } } | null }>(
    "query($id:Int){Media(id:$id,type:ANIME){relations{edges{relationType node{id type format status title{romaji english} startDate{year month day}}}}}}",
    { id },
    21600,
  );
  return d?.Media ? alSequelFrom(d.Media.relations.edges) : null;
}
