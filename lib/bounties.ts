/**
 * One Piece bounties (data/character-bounties.json), oldest first: "luffy bounty", "zoro wanted poster". Each amount
 * from two sources; the chapter and episode of the reveal only where two sources agree. Pure.
 */
import data from "@/data/character-bounties.json";

export type Bounty = {
  amount: number; arc: string; why: string; chapter: number | null; episode: number | null; spoiler: boolean;
  /** The poster's condition line when it isn't "DEAD OR ALIVE" (Sanji's "ONLY ALIVE"). */
  poster?: string;
};
type Entry = { entries: Bounty[]; sources: string[]; /** The name as fans write it, for characters without a checked note ("Trafalgar Law"). */ name?: string };
const D = data as unknown as { checked: string; characters: Record<string, Entry> };
export const BOUNTIES_CHECKED = D.checked;

export const characterBounties = (slug: string): Entry | null => D.characters[slug] ?? null;
/** "3,000,000,000" (bounties are quoted with Western digit groups). */
export const bountyFigure = (n: number) => n.toLocaleString("en-US");
/** The FAQ answer: the current bounty, then the whole history as a spoiler. */
export function bountyAnswer(slug: string): string | null {
  const b = characterBounties(slug)?.entries;
  if (!b?.length) return null;
  const now = b[b.length - 1];
  return b.length === 1
    ? `${bountyFigure(now.amount)} berries, since the ${now.arc} arc.`
    : `${bountyFigure(now.amount)} berries, since the ${now.arc} arc. Spoiler, every bounty: ${b.map((x) => `${bountyFigure(x.amount)} (${x.arc})`).join(", ")}.`;
}
