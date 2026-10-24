/** "What should I watch?" quiz: answers → Kitsu filters. Pure and unit-tested. */
export const QUIZ = [
  { key: "mood", q: "What are you in the mood for?", options: [
    ["action", "💥 Hype fights", "action"], ["comedy", "😂 A good laugh", "comedy"], ["drama", "😭 Something that hits hard", "drama"], ["romance", "💕 Romance", "romance"],
    ["mystery", "🧠 Mind games & mystery", "mystery"], ["cozy", "☕ Cozy & low-stakes", "slice-of-life"], ["fantasy", "🗡️ Fantasy worlds", "fantasy"], ["scifi", "🚀 Sci-fi", "science-fiction"],
    ["sports", "🏐 Sports", "sports"], ["horror", "👻 Something scary", "horror"],
  ] },
  { key: "len", q: "How much time do you have?", options: [["movie", "🎬 One evening (a movie)", ""], ["short", "📺 A weekend (≤ 13 episodes)", ""], ["medium", "🗓️ A few weeks (14–30)", ""], ["long", "🏔️ I want a long journey (30+)", ""]] },
  { key: "era", q: "New or classic?", options: [["new", "✨ Recent (2018+)", ""], ["mid", "📼 2000s–2010s", ""], ["classic", "🏛️ Classic (before 2005)", ""], ["any", "🤷 Don't mind", ""]] },
  { key: "tone", q: "How intense?", options: [["light", "🌤️ Keep it light", ""], ["any", "⚖️ Either", ""], ["dark", "🌑 Dark and mature", ""]] },
] as const;

export type Answers = { mood?: string; len?: string; era?: string; tone?: string };

/** Kitsu list filters for a set of answers; unknown values are ignored. */
export function quizFilter(a: Answers): Record<string, string> {
  const f: Record<string, string> = {};
  const mood = QUIZ[0].options.find((o) => o[0] === a.mood);
  if (mood) f.categories = mood[2];
  if (a.len === "movie") f.subtype = "movie";
  else {
    f.subtype = "TV";
    if (a.len === "short") f.episodeCount = "1..13";
    if (a.len === "medium") f.episodeCount = "14..30";
    if (a.len === "long") f.episodeCount = "31..3000";
  }
  if (a.era === "new") f.seasonYear = "2018..";
  if (a.era === "mid") f.seasonYear = "2000..2017";
  if (a.era === "classic") f.seasonYear = "..2004";
  if (a.tone === "light") f.ageRating = "G,PG";
  if (a.tone === "dark") f.ageRating = "R";
  return f;
}

export function describe(a: Answers): string {
  const pick = (i: number, v?: string) => QUIZ[i].options.find((o) => o[0] === v)?.[1].replace(/^\S+\s/, "").toLowerCase();
  return [pick(0, a.mood), pick(1, a.len), a.era !== "any" ? pick(2, a.era) : null, a.tone !== "any" ? pick(3, a.tone) : null].filter(Boolean).join(" · ");
}
