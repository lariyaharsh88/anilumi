/**
 * "What anime should I watch?" (app/what-anime-should-i-watch): the answers people tap and how each one filters the
 * catalog. Browser-safe and pure: the page builds the catalog on the server (AniList snapshot ranking + Kitsu +
 * Hindi dub and free-streaming data) and the picker filters it in the browser.
 */
export type Mood = "action" | "funny" | "emotional" | "dark" | "romance" | "cozy" | "sports" | "fantasy" | "scifi";
export type Length = "tonight" | "weekend" | "weeks" | "long";
export type PickItem = {
  s: string; t: string; p: string | null; y: number | null; sub: string; st: string;
  e: number | null; min: number | null; sc: number; moods: Mood[]; hi: string[]; free: boolean; why: string[];
};
export type Answers = { mood: Mood | "any"; length: Length | "any"; finished: boolean; hindi: boolean; free: boolean };

export const MOODS: { key: Mood; label: string; emoji: string; genres: string[]; tags?: string[] }[] = [
  { key: "action", label: "Fights and action", emoji: "⚔️", genres: ["Action"] },
  { key: "funny", label: "Funny and light", emoji: "😂", genres: ["Comedy"] },
  { key: "emotional", label: "Something emotional", emoji: "😭", genres: ["Drama"] },
  { key: "dark", label: "Dark and mind-bending", emoji: "🧠", genres: ["Psychological", "Thriller", "Mystery", "Horror"] },
  { key: "romance", label: "Romance", emoji: "💕", genres: ["Romance"] },
  { key: "cozy", label: "Cozy and relaxing", emoji: "☕", genres: ["Slice of Life"], tags: ["Iyashikei"] },
  { key: "sports", label: "Sports", emoji: "🏐", genres: ["Sports"] },
  { key: "fantasy", label: "Fantasy and isekai", emoji: "🐉", genres: ["Fantasy"], tags: ["Isekai"] },
  { key: "scifi", label: "Sci-fi and mecha", emoji: "🚀", genres: ["Sci-Fi", "Mecha"] },
];
export const LENGTHS: { key: Length; label: string; hint: string }[] = [
  { key: "tonight", label: "Tonight", hint: "a film or under 4 hours" },
  { key: "weekend", label: "A weekend", hint: "up to 13 episodes" },
  { key: "weeks", label: "A few weeks", hint: "up to 52 episodes" },
  { key: "long", label: "A long journey", hint: "any length" },
];

/** A title's moods from its AniList genres and strong tags. */
export const moodsOf = (genres: string[], tags: string[]): Mood[] =>
  MOODS.filter((m) => m.genres.some((g) => genres.includes(g)) || (m.tags ?? []).some((t) => tags.includes(t))).map((m) => m.key);

const fitsLength = (x: PickItem, l: Answers["length"]) => {
  if (l === "any" || l === "long") return true;
  if (l === "tonight") return x.sub === "movie" || (x.min !== null && x.min <= 240);
  if (l === "weekend") return x.sub === "movie" || (x.e !== null && x.e <= 13);
  return x.sub === "movie" || (x.e !== null && x.e <= 52);
};

const matches = (x: PickItem, a: Answers) =>
  (a.mood === "any" || x.moods.includes(a.mood)) && fitsLength(x, a.length) && (!a.finished || x.st === "finished") && (!a.hindi || x.hi.length > 0) && (!a.free || x.free);

/**
 * Titles matching every answer, best first. When fewer than `min` match, the least important answers are dropped
 * one by one (free, then finished, then length) and `relaxed` says which, so there's always something to watch.
 */
export function pick(items: PickItem[], a: Answers, min = 3): { list: PickItem[]; relaxed: string[] } {
  const steps: [keyof Answers, string, Answers[keyof Answers]][] = [["free", "free only", false], ["finished", "finished only", false], ["length", "length", "any"]];
  let cur = { ...a };
  const relaxed: string[] = [];
  let list = items.filter((x) => matches(x, cur));
  for (const [k, label, off] of steps) {
    if (list.length >= min) break;
    if (cur[k] === off) continue;
    cur = { ...cur, [k]: off };
    relaxed.push(label);
    list = items.filter((x) => matches(x, cur));
  }
  return { list, relaxed };
}
