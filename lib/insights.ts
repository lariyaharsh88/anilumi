/**
 * Viewer behaviour (drop / completion rates) and a parents' guide, both from AniList.
 * Pure helpers are unit-tested; fetchers fail soft and are cached (fetch cache + memo).
 */
import { getAniListId } from "./kitsu";

export type StatusCount = { status: string; amount: number };
export type AlTag = { name: string; rank: number; category: string; isAdult: boolean; isMediaSpoiler: boolean };
export type AniListInsight = { genres: string[]; dist: StatusCount[]; tags: AlTag[] };

async function anilist<T>(query: string, variables: Record<string, unknown>, revalidate: number): Promise<T | null> {
  if (process.env.ANILIST_ENRICH === "0") return null;
  try {
    const res = await fetch("https://graphql.anilist.co", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ query, variables }),
      next: { revalidate },
      signal: AbortSignal.timeout(Number(process.env.ANILIST_TIMEOUT_MS) || 5000),
    });
    if (!res.ok) return null;
    const j = (await res.json()) as { data?: T };
    return j.data ?? null;
  } catch {
    return null;
  }
}

const memo = new Map<string, { v: unknown; exp: number }>();
async function memoized<T>(key: string, ttlMs: number, fn: () => Promise<T | null>): Promise<T | null> {
  const hit = memo.get(key);
  if (hit && hit.exp > Date.now()) return hit.v as T;
  const v = await fn();
  if (v !== null) memo.set(key, { v, exp: Date.now() + ttlMs });
  return v;
}

export async function getAniListInsight(kitsuId: string): Promise<AniListInsight | null> {
  const id = await getAniListId(kitsuId);
  if (!id) return null;
  return memoized(`insight:${id}`, 6 * 3600_000, async () => {
    const d = await anilist<{ Media: { genres: string[]; stats: { statusDistribution: StatusCount[] }; tags: AlTag[] } | null }>(
      "query($id:Int){Media(id:$id,type:ANIME){genres stats{statusDistribution{status amount}} tags{name rank category isAdult isMediaSpoiler}}}",
      { id },
      86400,
    );
    return d?.Media ? { genres: d.Media.genres || [], dist: d.Media.stats?.statusDistribution || [], tags: d.Media.tags || [] } : null;
  });
}

/* ---------- drop / completion ---------- */

export type DropStats = { started: number; completed: number; dropped: number; watching: number; paused: number; planning: number; dropRate: number; completionRate: number };

/** Rates over people who started (watching + completed + paused + dropped + rewatching). Pure. */
export function dropStats(dist: StatusCount[]): DropStats | null {
  const g = (s: string) => dist.find((d) => d.status === s)?.amount || 0;
  const completed = g("COMPLETED"), dropped = g("DROPPED"), watching = g("CURRENT") + g("REPEATING"), paused = g("PAUSED"), planning = g("PLANNING");
  const started = completed + dropped + watching + paused;
  if (!started) return null;
  return { started, completed, dropped, watching, paused, planning, dropRate: (dropped / started) * 100, completionRate: (completed / started) * 100 };
}

export const median = (xs: number[]) => {
  const s = [...xs].sort((a, b) => a - b);
  if (!s.length) return NaN;
  const m = Math.floor(s.length / 2);
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
};

/** Median drop rate of the 50 most popular finished, non-adult anime in an AniList genre. Cached a week. */
export async function genreDropBenchmark(genre: string): Promise<number | null> {
  return memoized(`bench:${genre}`, 7 * 86400_000, async () => {
    const d = await anilist<{ Page: { media: { stats: { statusDistribution: StatusCount[] } }[] } }>(
      "query($g:String){Page(perPage:50){media(genre:$g,type:ANIME,sort:POPULARITY_DESC,status:FINISHED,isAdult:false){stats{statusDistribution{status amount}}}}}",
      { g: genre },
      86400 * 7,
    );
    const rates = (d?.Page.media || []).map((m) => dropStats(m.stats?.statusDistribution || [])).filter((x): x is DropStats => Boolean(x && x.started >= 200)).map((x) => x.dropRate);
    return rates.length >= 10 ? median(rates) : null;
  });
}

/* ---------- parents' guide ---------- */

export type Level = "none" | "mild" | "moderate" | "strong";
export type GuideArea = { key: string; label: string; level: Level; shown: string[]; hiddenSpoilers: number };
export type ParentsGuide = { areas: GuideArea[]; suitable: string; madeForKids: boolean };

// Tags that describe on-screen content can reach "strong"; tags that name a story theme are capped,
// because a show *about* war or crime isn't necessarily graphic. Tragedy / memory themes are excluded.
const CAP: Record<string, Level> = {
  War: "moderate", "Battle Royale": "moderate", "Death Game": "moderate", Terrorism: "moderate", "Human Experimentation": "moderate",
  Slavery: "moderate", Brainwashing: "moderate", Bullying: "moderate", "Cosmic Horror": "moderate", "Eco-Horror": "moderate",
  Drugs: "moderate", Crime: "moderate", Yakuza: "moderate", Mafia: "moderate", Gangs: "moderate", "Criminal Organization": "moderate", Triads: "moderate",
  Gambling: "mild", "Female Harem": "mild", "Male Harem": "mild", "Mixed Gender Harem": "mild",
};
const AREAS: { key: string; label: string; tags: string[]; genres?: string[]; adultSexual?: boolean; adultTagNames?: string[] }[] = [
  { key: "violence", label: "Violence & gore", tags: ["Gore", "Torture", "Body Horror", "Cannibalism", "Ero Guro", "Death Game", "Battle Royale", "War", "Human Experimentation", "Terrorism"] },
  { key: "sexual", label: "Sexual content & nudity", tags: ["Nudity", "Psychosexual", "Ero Guro", "Female Harem", "Male Harem", "Mixed Gender Harem"], genres: ["Ecchi"], adultSexual: true },
  { key: "sexual-violence", label: "Sexual violence", tags: [], adultTagNames: ["Rape"] },
  { key: "disturbing", label: "Disturbing & frightening themes", tags: ["Suicide", "Body Horror", "Cosmic Horror", "Eco-Horror", "Bullying", "Slavery", "Brainwashing"], genres: ["Horror"] },
  { key: "drugs-crime", label: "Drugs, gambling & crime", tags: ["Drugs", "Gambling", "Crime", "Yakuza", "Mafia", "Gangs", "Criminal Organization", "Triads"] },
];

/** rank = % of AniList voters who agree the tag applies; map to a level, then apply the tag's cap. Pure. */
function levelFor(rank: number, cap: Level = "strong"): Level {
  const l: Level = rank >= 75 ? "strong" : rank >= 50 ? "moderate" : rank >= 20 ? "mild" : "none";
  const order: Level[] = ["none", "mild", "moderate", "strong"];
  return order[Math.min(order.indexOf(l), order.indexOf(cap))];
}
const maxLevel = (ls: Level[]): Level => (["strong", "moderate", "mild"] as Level[]).find((x) => ls.includes(x)) ?? "none";

export function parentsGuide(tags: AlTag[], genres: string[], ageRating: string | null): ParentsGuide {
  const areas: GuideArea[] = AREAS.map((a) => {
    const levels: Level[] = [];
    const shown: string[] = [];
    let hiddenSpoilers = 0;
    for (const t of tags) {
      const named = a.tags.includes(t.name) && !t.isAdult;
      const adultHit = t.isAdult && ((a.adultSexual && t.category === "Sexual Content" && t.name !== "Rape") || (a.adultTagNames || []).includes(t.name));
      if (!named && !adultHit) continue;
      const lv = levelFor(t.rank, CAP[t.name] ?? "strong");
      if (lv === "none") continue;
      levels.push(lv);
      if (named) { if (t.isMediaSpoiler) hiddenSpoilers++; else shown.push(t.name); }
    }
    for (const g of a.genres || []) if (genres.includes(g)) levels.push("strong");
    return { key: a.key, label: a.label, level: maxLevel(levels), shown, hiddenSpoilers };
  });
  const madeForKids = tags.some((t) => t.name === "Kids" && t.rank >= 50);
  const lvl = (k: string) => areas.find((x) => x.key === k)!.level;
  const worst = maxLevel(areas.map((x) => x.level));
  const r = (ageRating || "").toUpperCase();
  const adultish = r === "R" || worst === "strong" || lvl("sexual-violence") !== "none" || ["moderate", "strong"].includes(lvl("sexual"));
  const suitable =
    r === "R18" ? "Adults only"
    : adultish ? "Older teens and adults (17+)"
    : r === "PG" || worst === "moderate" ? "Teens (13+)"
    : madeForKids || r === "G" ? "All ages"
    : "Most viewers, with a parent's check";
  return { areas, suitable, madeForKids };
}
