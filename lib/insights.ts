/**
 * Viewer behaviour (drop / completion rates) and a parents' guide, both from AniList.
 * Pure helpers are unit-tested; fetchers fail soft and are cached (fetch cache + memo).
 */
import { getAniListId } from "./kitsu";
import { anilist, memoized } from "./anilist";

export type StatusCount = { status: string; amount: number };
export type AlTag = { name: string; rank: number; category: string; isAdult: boolean; isMediaSpoiler: boolean };
export type AniListInsight = { genres: string[]; dist: StatusCount[]; tags: AlTag[]; anilistId: number; score: number | null; scoreVotes: number };

export async function getAniListInsight(kitsuId: string, strict = false): Promise<AniListInsight | null> {
  const id = await getAniListId(kitsuId);
  if (!id) return null;
  return memoized(`insight:${id}`, 6 * 3600_000, async () => {
    const d = await anilist<{ Media: { genres: string[]; averageScore: number | null; stats: { statusDistribution: StatusCount[]; scoreDistribution: { score: number; amount: number }[] }; tags: AlTag[] } | null }>(
      "query($id:Int){Media(id:$id,type:ANIME){genres averageScore stats{statusDistribution{status amount} scoreDistribution{score amount}} tags{name rank category isAdult isMediaSpoiler}}}",
      { id },
      86400,
      { strict },
    );
    const m = d?.Media;
    if (!m) return null;
    return {
      genres: m.genres || [],
      dist: m.stats?.statusDistribution || [],
      tags: m.tags || [],
      anilistId: id,
      score: m.averageScore ? m.averageScore / 10 : null,
      scoreVotes: (m.stats?.scoreDistribution || []).reduce((n, x) => n + x.amount, 0),
    };
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
    // Made-for-children shows (Doraemon) beat Kitsu's broad "PG = 13+" bucket unless viewers flag real content.
    : madeForKids && worst !== "moderate" ? "All ages"
    : r === "PG" || worst === "moderate" ? "Teens (13+)"
    : r === "G" ? "All ages"
    : "Most viewers, with a parent's check";
  return { areas, suitable, madeForKids };
}

/** Short age for titles: "13+", "17+", "All Ages". Pure. */
export function ageLabel(suitable: string): string {
  return ({ "All ages": "All Ages", "Teens (13+)": "13+", "Older teens and adults (17+)": "17+", "Adults only": "18+" } as Record<string, string>)[suitable] ?? "Parental Guidance";
}

const SHORT: Record<string, string> = { violence: "Violence", sexual: "Nudity", "sexual-violence": "Sexual Violence", disturbing: "Dark Themes", "drugs-crime": "Crime" };
/** The strongest flagged areas in short form, strongest first ("Violence, Dark Themes"). Pure. */
export function flaggedShort(g: ParentsGuide, max = 2): string[] {
  const order: Level[] = ["strong", "moderate"];
  return order.flatMap((lv) => g.areas.filter((a) => a.level === lv).map((a) => SHORT[a.key] || a.label)).slice(0, max);
}

/** "Is it OK for a 12-year-old?" answer, worded by how strong the content is. Pure. */
export function preteenAnswer(title: string, g: ParentsGuide): string {
  const flags = flaggedShort(g, 3).join(", ").toLowerCase();
  switch (g.suitable) {
    case "All ages": return `Yes. ${title} suits all ages${g.madeForKids ? " and was made for children" : ""}.`;
    case "Teens (13+)": return `${title} is aimed at teens 13 and up. Many 12-year-olds will be fine with it, but watch an episode first${flags ? `: viewers flag ${flags}` : ""}.`;
    case "Older teens and adults (17+)": return `Probably not. ${title} is aimed at older teens and adults${flags ? `; viewers flag ${flags}` : ""}.`;
    case "Adults only": return `No. ${title} is for adults only.`;
    default: return `Usually, yes, but preview an episode first: ${title} has no strong content flagged by viewers.`;
  }
}
