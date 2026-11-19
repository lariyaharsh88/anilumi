/**
 * Anime character name generator (app/anime-name-generator; Keyword Planner, Nov 2026: "anime name generator" 2,400 a
 * month in the US, 260 in India): a real Japanese name with its kanji (lib/jpnames.ts) plus what makes it sound like
 * an anime character, an epithet and a power that fit the vibe. Browser-safe and pure apart from Math.random.
 */
import { GIVEN, SURNAMES, type Gender, type JpName } from "./jpnames";

export type Vibe = "hero" | "villain" | "rival" | "mage" | "cute" | "mystery";
export const VIBES: { key: Vibe; label: string; emoji: string; epithets: string[]; powers: string[] }[] = [
  { key: "hero", label: "Hero", emoji: "🔥", epithets: ["the Rising Flame", "the Unbreakable", "the Dawn Blade", "the Last Guardian", "the Sky Breaker", "the Lion Heart", "the Storm Caller", "the Golden Fist"], powers: ["fire that grows with their resolve", "a sword that cuts through lies", "super speed for ten seconds", "a shield made of light", "strength borrowed from friends", "wind they can ride"] },
  { key: "villain", label: "Villain", emoji: "🖤", epithets: ["the Hollow King", "the Crimson Mask", "the Silent Plague", "the Night Sovereign", "the Thousand Faces", "the Ash Emperor", "the Black Lotus", "the Pale Executioner"], powers: ["shadows that obey them", "stealing other people's memories", "turning fear into strength", "a contract no one can break", "poison that blooms like flowers", "controlling anyone who meets their eyes"] },
  { key: "rival", label: "Rival", emoji: "⚡", epithets: ["the Blue Lightning", "the Second Sun", "the Cold Prodigy", "the Steel Wolf", "the Untouchable", "the Frozen Edge", "the Iron Will", "the Thunder Fang"], powers: ["lightning-fast reflexes", "copying any move once", "ice that never melts", "never losing the same fight twice", "a blade forged from a meteor", "reading an opponent's next step"] },
  { key: "mage", label: "Mage", emoji: "✨", epithets: ["the Star Weaver", "the Moon Archivist", "the Spirit Caller", "the Rune Keeper", "the Ninth Seal", "the Witch of Tides", "the Clockwork Sage", "the Ember Scholar"], powers: ["spells written in starlight", "talking to spirits", "stopping time for a heartbeat", "summoning a familiar fox", "turning words into barriers", "healing with music"] },
  { key: "cute", label: "Cute", emoji: "🌸", epithets: ["the Cherry Blossom", "the Little Sunshine", "the Cafe Angel", "the Sleepy Genius", "the Lucky Charm", "the Pocket Idol", "the Strawberry Knight", "the Cloud Dreamer"], powers: ["making anyone smile", "baking food that heals", "befriending every cat in town", "luck that saves the day", "a voice that calms storms", "finding lost things"] },
  { key: "mystery", label: "Mysterious", emoji: "🌙", epithets: ["the Moonlit Stranger", "the Silent Archer", "the Veiled Oracle", "the Last Witness", "the Mirror Thief", "the Masked Librarian", "the Fox Spirit", "the Nameless Wanderer"], powers: ["seeing one minute into the future", "walking between mirrors", "a past no one remembers", "reading the truth in any lie", "vanishing at midnight", "a deal with a fox spirit"] },
];

export type AnimeName = { surname: JpName; given: JpName; epithet: string; power: string };
const one = <T,>(xs: T[]): T => xs[Math.floor(Math.random() * xs.length)];

/** One character: surname + given name by gender, and an epithet and power from the vibe. */
export function makeAnimeName(vibe: Vibe, gender: Gender): AnimeName {
  const v = VIBES.find((x) => x.key === vibe) ?? VIBES[0];
  const given = GIVEN.filter((n) => gender === "any" || n.g === gender || n.g === "both");
  return { surname: one(SURNAMES), given: one(given), epithet: one(v.epithets), power: one(v.powers) };
}

/** A fixed example per vibe for the server-rendered page (random names in the HTML would differ from the browser's). */
export const exampleName = (vibe: Vibe, i: number): AnimeName => {
  const v = VIBES.find((x) => x.key === vibe)!;
  return { surname: SURNAMES[(i * 7 + 3) % SURNAMES.length], given: GIVEN[(i * 11 + 5) % GIVEN.length], epithet: v.epithets[i % v.epithets.length], power: v.powers[i % v.powers.length] };
};
