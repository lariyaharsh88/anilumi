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
