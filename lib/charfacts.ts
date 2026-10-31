/**
 * Quick facts for character pages (age, height, birthday…), which is what people search a character's name
 * for. Sources: AniList's structured fields and fact lines, plus the "Age: 15 Birthdate: … Height: …" block
 * Kitsu bios often start with. Spoiler-prone fields (status, relatives, death) are never shown. Pure.
 */
import type { BioFact } from "./anilist";

/** Labels we show, in display order, with the spellings sources use for them. */
const SHOWN: { key: string; label: string; aliases: string[] }[] = [
  { key: "age", label: "Age", aliases: ["age"] },
  { key: "birthday", label: "Birthday", aliases: ["birthday", "birthdate", "date of birth", "born"] },
  { key: "height", label: "Height", aliases: ["height"] },
  { key: "weight", label: "Weight", aliases: ["weight"] },
  { key: "gender", label: "Gender", aliases: ["gender", "sex"] },
  { key: "blood", label: "Blood type", aliases: ["blood type", "bloodtype"] },
  { key: "species", label: "Species", aliases: ["species", "race"] },
  { key: "affiliation", label: "Affiliation", aliases: ["affiliation", "affiliations", "team", "squad", "clan"] },
  { key: "occupation", label: "Occupation", aliases: ["occupation", "occupations", "position", "rank", "class"] },
  { key: "origin", label: "From", aliases: ["hometown", "birthplace", "nationality", "origin"] },
];
/** Labels that end a facts block but are never displayed (spoilers or noise). */
const HIDDEN = [
  "status", "relatives", "family", "graduation rank", "horoscope", "zodiac", "hair color", "eye color", "hair", "eyes", "likes", "dislikes",
  "hobbies", "hobby", "favorite food", "voice", "abilities", "ability", "weapon", "weapons", "alias", "aliases", "epithet", "title", "titles",
  "first appearance", "location", "level", "partner(s)", "partners", "partner", "quote", "quotes", "kekkei genkai", "nindo", "techniques",
  "power", "powers", "quirk", "devil fruit", "bounty", "residence", "school", "grade", "year", "club", "nickname", "nicknames",
];
const ALL = [...SHOWN.flatMap((s) => s.aliases), ...HIDDEN].sort((a, b) => b.length - a.length);
const esc = (l: string) => l.replace(/[()]/g, "\\$&").replace(/ /g, "\\s+");
const LABEL_RE = new RegExp(`(?:^|\\s)(${ALL.map(esc).join("|")})\\s*:\\s*`, "gi");

export type Facts = Partial<Record<(typeof SHOWN)[number]["key"], string>>;

const keyOf = (label: string) => SHOWN.find((s) => s.aliases.includes(label.toLowerCase().replace(/\s+/g, " ")))?.key;
const tidy = (v: string) => {
  // Cut at any other "Label:" we don't know (e.g. "Z-City Abilities: …"), then trim dangling separators.
  const s = v.replace(/\s+/g, " ").split(/\s(?=[A-Z][\w()'-]*(?:\s[\w()'-]+){0,2}:\s)/)[0].replace(/[,;.\s–-]+$/, "").trim();
  return s.length > 60 ? `${s.slice(0, 57).replace(/\s+\S*$/, "")}…` : s;
};

/**
 * Kitsu bios: facts sit at the start, before the first paragraph break (a double space once Kitsu flattens
 * newlines). Returns the facts and the bio with that block removed. Pure.
 */
export function parseKitsuBio(desc: string): { facts: Facts; bio: string } {
  const text = (desc || "").trim();
  // The facts block can span paragraphs: keep taking the next one while it opens with a "Label:" or the
  // previous one ended on a dangling "Label:" (Saitama: "Level:  C-Class …").
  const paras = text.split(/\s{2,}|\n+/);
  let n = 0;
  while (n < paras.length && (n === 0 ? /^[A-Z][\w()' ]{0,25}:/.test(paras[0]) : /^[A-Z][\w()' ]{0,25}:/.test(paras[n]) || /:\s*$/.test(paras[n - 1]))) n++;
  const head = paras.slice(0, n).join(" ");
  const starts = [...head.matchAll(LABEL_RE)];
  if (!n || !starts.length || (starts[0].index ?? 0) > 0) return { facts: {}, bio: text };
  const facts: Facts = {};
  starts.forEach((m, i) => {
    const from = (m.index ?? 0) + m[0].length;
    const to = i + 1 < starts.length ? starts[i + 1].index! : head.length;
    const k = keyOf(m[1]);
    const v = tidy(head.slice(from, to));
    if (k && v && !facts[k]) facts[k] = v;
  });
  // Kitsu's spoiler headings ("Major Background Spoilers") are labels, not prose.
  return { facts, bio: paras.slice(n).join("\n\n").replace(/^(?:(?:major|minor)\s+)?(?:background\s+)?spoilers?\s*/i, "").trim() };
}

/** Keep only fact lines we'd display (for the snapshot, so it stays small). Pure. */
export const shownLines = (lines: BioFact[]): BioFact[] => lines.filter((f) => keyOf(f.label));

/** AniList "__Height:__ 170 cm" lines (already spoiler-stripped by cleanBio) → facts. Pure. */
export function factsFromAniList(lines: BioFact[]): Facts {
  const out: Facts = {};
  for (const f of lines) {
    const k = keyOf(f.label);
    if (k && !out[k]) out[k] = tidy(f.value);
  }
  return out;
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
export type AniListCharacter = { age: string | null; gender: string | null; bloodType: string | null; dateOfBirth: { month: number | null; day: number | null } | null; lines: BioFact[]; favourites?: number };

/**
 * One fact sheet: AniList's structured fields first (they're curated), then its fact lines, then Kitsu's.
 * Returned in display order as label/value pairs. Pure.
 */
export function mergeFacts(al: AniListCharacter | null, kitsu: Facts): { key: string; label: string; value: string }[] {
  const structured: Facts = {};
  if (al?.age) structured.age = tidy(al.age);
  if (al?.gender) structured.gender = al.gender;
  if (al?.bloodType) structured.blood = al.bloodType;
  if (al?.dateOfBirth?.month && al.dateOfBirth.day) structured.birthday = `${MONTHS[al.dateOfBirth.month - 1]} ${al.dateOfBirth.day}`;
  const merged: Facts = { ...kitsu, ...factsFromAniList(al?.lines || []), ...structured };
  return SHOWN.flatMap((s) => (merged[s.key] ? [{ key: s.key, label: s.label, value: merged[s.key]! }] : []));
}

/** "Age, Height, Birthday & Voice Actor" for titles, from what we actually know. Pure. */
export function factsTitle(keys: string[], hasVoice: boolean): string {
  const names = [...(["age", "height", "birthday"] as const).filter((k) => keys.includes(k)).map((k) => SHOWN.find((s) => s.key === k)!.label), ...(hasVoice ? ["Voice Actor"] : [])];
  if (!names.length) return "";
  return names.length === 1 ? names[0] : `${names.slice(0, -1).join(", ")} & ${names[names.length - 1]}`;
}

/** "How old is Eren?" answer: plain numbers read naturally, ranges are quoted as listed. Pure. */
export function ageAnswer(name: string, age: string): string {
  return /^\d{1,4}$/.test(age) ? `${name} is ${age} years old.` : `${name}'s age is listed as ${age}.`;
}

const SIGNS: [string, number, number][] = [
  ["Capricorn", 1, 19], ["Aquarius", 2, 18], ["Pisces", 3, 20], ["Aries", 4, 19], ["Taurus", 5, 20], ["Gemini", 6, 20],
  ["Cancer", 7, 22], ["Leo", 8, 22], ["Virgo", 9, 22], ["Libra", 10, 22], ["Scorpio", 11, 21], ["Sagittarius", 12, 21],
];
/** Western zodiac sign for a birthday (each sign ends on the listed day of its month). Pure. */
export function zodiac(m: number, d: number): string | null {
  if (!(m >= 1 && m <= 12 && d >= 1 && d <= 31)) return null;
  const [sign, , end] = SIGNS[m - 1];
  return d <= end ? sign : SIGNS[m % 12][0];
}

/** Other names fans search by, from every source: no duplicates, never the main or Japanese name. Pure. */
export function aliasList(name: string, nameJp: string | null, ...lists: (string[] | null | undefined)[]): string[] {
  const seen = new Set([name, nameJp || ""].map((x) => x.toLowerCase().trim()));
  const out: string[] = [];
  for (const x of lists.flat()) {
    // "Near (ニア)" → "Near": the Japanese spelling is already on the page.
    const v = (x || "").replace(/\s*\([^)]*[\u3040-\u30ff\u4e00-\u9fff][^)]*\)/g, "").replace(/\s+/g, " ").trim();
    if (!v || v.length > 40 || seen.has(v.toLowerCase())) continue;
    seen.add(v.toLowerCase());
    out.push(v);
  }
  return out.slice(0, 4);
}

/** A plain number or measurement reads as prose; ranges and per-arc lists ("149cm (I), 161cm (II)") are quoted. */
const single = (v: string) => !/\s[-–~]\s|[-–~]\s*\d|,|\/|;/.test(v.replace(/\(\d+'\d+½?"\)/g, ""));

/**
 * The one-paragraph answer at the top of a character page: who they are, age, height, birthday (with sign) and
 * voices, in that order, skipping whatever isn't known. Written to be quotable as a search snippet. Pure.
 */
export function quickAnswer(x: {
  name: string; gender?: string | null; role?: "main" | "supporting" | null; anime?: string | null;
  age?: string; height?: string; birthday?: string; sign?: string | null; jp?: string | null; en?: string | null;
}): string {
  const g = (x.gender || "").toLowerCase();
  const [he, his] = g === "male" ? ["He", "His"] : g === "female" ? ["She", "Her"] : [x.name, `${x.name}'s`];
  const out: string[] = [];
  if (x.anime) out.push(`${x.name} is ${x.role === "main" ? "a main" : "a supporting"} character in ${x.anime}.`);
  const age = x.age && /^\d{1,4}$/.test(x.age) ? `${x.age} years old` : null;
  const tall = x.height && single(x.height) ? `${x.height} tall` : null;
  if (age && tall) out.push(`${he} is ${age} and ${tall}.`);
  else {
    if (age) out.push(`${he} is ${age}.`);
    else if (x.age) out.push(`${his} age is listed as ${x.age}.`);
    if (tall) out.push(`${he} is ${tall}.`);
    else if (x.height) out.push(`${his} height is listed as ${x.height}.`);
  }
  if (x.birthday) out.push(`${his} birthday is ${x.birthday}${x.sign ? `, which makes ${g === "male" ? "him" : g === "female" ? "her" : "them"} ${/^[AEIOU]/.test(x.sign) ? "an" : "a"} ${x.sign}` : ""}.`);
  if (x.jp) out.push(`${he} is voiced by ${x.jp} in Japanese${x.en ? ` and by ${x.en} in the English dub` : ""}.`);
  return out.join(" ");
}

/**
 * Height in cm from however a source writes it: "170 cm (5'7") - 183 cm (6'0")", "~300cm", "149cm (I), 161cm (II)",
 * or feet only ("5'7""). Ranges and per-arc lists give the largest value (the grown-up, latest height). Pure.
 */
export function heightCm(v: string | null | undefined): number | null {
  if (!v) return null;
  const cm = [...v.matchAll(/(\d{2,3}(?:\.\d)?)\s*cm/gi)].map((m) => Number(m[1]));
  if (!cm.length) for (const m of v.matchAll(/(\d)\s*['’′]\s*(\d{1,2}(?:\.\d)?)?/g)) cm.push(Math.round((Number(m[1]) * 12 + Number(m[2] || 0)) * 2.54));
  const ok = cm.filter((n) => n >= 20 && n <= 1000);
  return ok.length ? Math.max(...ok) : null;
}

/** Age as a number for sorting ("15" → 15, "17-18" → 17, "800+" → 800); null when no number is given. Pure. */
export function ageNum(v: string | null | undefined): number | null {
  const m = (v || "").match(/\d{1,4}/);
  return m ? Number(m[0]) : null;
}
