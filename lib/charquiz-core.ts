/**
 * The pure part of the character quizzes (lib/charquiz.ts): traits, the shared questions and the scoring. Kept apart
 * so the quiz in the browser doesn't ship the character snapshot. Pure.
 */
export const TRAITS = ["drive", "calm", "brains", "heart", "loner", "fun"] as const;
export type Trait = (typeof TRAITS)[number];
export type Weights = Partial<Record<Trait, number>>;
export type QuizQuestion = { q: string; options: { text: string; w: Weights }[] };
export type QuizCharacter = { key: string; name: string; /** Name as stored in data/characters.json, when it differs. */ stored?: string; why: string; profile: Record<Trait, number> };

/** The same eight questions for every franchise: they read a personality, not knowledge of the show. */
export const QUESTIONS: QuizQuestion[] = [
  { q: "It's Friday night. You'd rather…", options: [{ text: "Train or work on a goal", w: { drive: 2 } }, { text: "Hang out with a big group", w: { fun: 2, heart: 1 } }, { text: "Read, game or plan something", w: { brains: 2 } }, { text: "Be alone somewhere quiet", w: { loner: 2, calm: 1 } }] },
  { q: "A friend is in trouble. You…", options: [{ text: "Charge in without a plan", w: { drive: 2, heart: 1 } }, { text: "Work out the smartest fix first", w: { brains: 2, calm: 1 } }, { text: "Stay by their side and listen", w: { heart: 2 } }, { text: "Sort it out quietly, without them knowing", w: { loner: 2, calm: 1 } }] },
  { q: "Your friends would call you…", options: [{ text: "Stubborn", w: { drive: 2 } }, { text: "The funny one", w: { fun: 2 } }, { text: "The calm one", w: { calm: 2 } }, { text: "The brains", w: { brains: 2 } }] },
  { q: "Pick a goal.", options: [{ text: "Be the best at what I do", w: { drive: 2 } }, { text: "Protect the people I love", w: { heart: 2 } }, { text: "Understand how everything works", w: { brains: 2 } }, { text: "Live freely, no rules", w: { fun: 1, loner: 1 } }] },
  { q: "In a group project, you're…", options: [{ text: "The leader pushing everyone", w: { drive: 1, calm: 1 } }, { text: "The planner", w: { brains: 2 } }, { text: "The one keeping spirits up", w: { fun: 1, heart: 1 } }, { text: "Doing your part on your own", w: { loner: 2 } }] },
  { q: "When you lose, you…", options: [{ text: "Train even harder", w: { drive: 2 } }, { text: "Work out what went wrong", w: { brains: 1, calm: 1 } }, { text: "Laugh it off", w: { fun: 2 } }, { text: "Keep it to yourself", w: { loner: 1, calm: 1 } }] },
  { q: "Your fighting style?", options: [{ text: "Raw power and guts", w: { drive: 2 } }, { text: "Speed and precision", w: { calm: 2 } }, { text: "Tricks and strategy", w: { brains: 2 } }, { text: "Whatever keeps my team safe", w: { heart: 2 } }] },
  { q: "Pick a place to spend a day.", options: [{ text: "A mountain top, alone", w: { loner: 2 } }, { text: "A loud festival", w: { fun: 2 } }, { text: "A huge library", w: { brains: 2 } }, { text: "Home with family", w: { heart: 2 } }] },
];

/** Cosine similarity of the answer totals with each profile; the closest character wins. Pure. */
export function bestMatch(totals: Record<Trait, number>, characters: QuizCharacter[]): QuizCharacter {
  const norm = (v: Record<Trait, number>) => Math.sqrt(TRAITS.reduce((n, t) => n + v[t] * v[t], 0)) || 1;
  const sim = (c: QuizCharacter) => TRAITS.reduce((n, t) => n + totals[t] * c.profile[t], 0) / (norm(totals) * norm(c.profile));
  return characters.reduce((best, c) => (sim(c) > sim(best) ? c : best), characters[0]);
}

