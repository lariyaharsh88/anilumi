/**
 * Weekly home-page polls. Add one per week; the newest whose `from` date has passed is shown, older
 * ones are archived at /polls. Votes live in MongoDB (poll_votes / poll_stats), keyed by `id`.
 */
export type Poll = { id: string; from: string; question: string; options: string[] };

export const POLLS: Poll[] = [
  {
    id: "2026-fall-best",
    from: "2026-10-26",
    question: "Best anime of Fall 2026 so far?",
    options: ["One Piece", "Detective Conan", "A new show I'm watching", "Still catching up on last season"],
  },
];

/** The poll for a given day (YYYY-MM-DD), or null before the first one. Pure. */
export function currentPoll(today: string, polls: Poll[] = POLLS): Poll | null {
  return [...polls].filter((p) => p.from <= today).sort((a, b) => b.from.localeCompare(a.from))[0] ?? null;
}
