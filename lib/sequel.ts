/** "Is there a season 2?" verdicts from the franchise graph. Pure and unit-tested. */
import type { Anime } from "./kitsu";

export type SequelKind = "out" | "airing" | "dated" | "announced" | "still-airing" | "none";
/** A follow-up entry: a Kitsu anime, or an AniList-only announcement (no slug, maybe only a year/month). */
export type SequelLike = Pick<Anime, "title" | "status" | "startDate" | "endDate"> & { slug?: string; expected?: string | null };
export type SequelVerdict = { kind: SequelKind; next: SequelLike | null; headline: string; detail: string };

const MONTH = 30.44 * 86400000;
const fmt = (iso: string) => new Date(`${iso.slice(0, 10)}T12:00:00Z`).toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric", timeZone: "UTC" });

/** Whole months between two ISO dates (b after a). */
export function monthsBetween(a: string, b: string): number {
  return Math.max(0, Math.round((Date.parse(b.slice(0, 10)) - Date.parse(a.slice(0, 10))) / MONTH));
}

/** "8 months", "2 years", "3.5 years". */
export function humanMonths(m: number): string {
  if (m < 24) return `${m} month${m === 1 ? "" : "s"}`;
  const y = Math.round((m / 12) * 2) / 2;
  return `${y} years`;
}

export function sequelVerdict(a: Pick<Anime, "title" | "status" | "endDate">, next: SequelLike | null, now = new Date()): SequelVerdict {
  const today = now.toISOString().slice(0, 10);
  if (next) {
    if (next.status === "finished") return { kind: "out", next, headline: `Yes. ${next.title} is already out.`, detail: `It aired${next.startDate ? ` from ${fmt(next.startDate)}` : ""}${next.endDate ? ` to ${fmt(next.endDate)}` : ""}.` };
    if (next.status === "current") return { kind: "airing", next, headline: `Yes. ${next.title} is airing now.`, detail: next.startDate ? `It premiered on ${fmt(next.startDate)}, with new episodes every week.` : "New episodes air every week." };
    if (next.startDate && next.startDate.slice(0, 10) >= today) return { kind: "dated", next, headline: `Confirmed. ${next.title} premieres ${fmt(next.startDate)}.`, detail: "The release date has been announced; it can still slip, and this page updates daily." };
    return { kind: "announced", next, headline: `Confirmed. ${next.title} has been announced.`, detail: next.expected ? `It's expected in ${next.expected}; the exact date isn't set yet. This page updates daily.` : "There's no release date yet. This page updates daily as soon as one is set." };
  }
  if (a.status === "current") return { kind: "still-airing", next: null, headline: `${a.title} is still airing.`, detail: "No sequel has been announced yet. Studios usually announce one around the final episode, if at all." };
  const since = a.endDate ? monthsBetween(a.endDate, today) : null;
  return { kind: "none", next: null, headline: "Not yet. No sequel has been announced.", detail: since !== null ? `${a.title} ended ${humanMonths(since)} ago${a.endDate ? ` (${fmt(a.endDate)})` : ""}.` : `${a.title} has no announced follow-up so far.` };
}

/** Gaps in months between consecutive premieres of the main story, oldest first. */
export function seasonGaps(chain: Pick<Anime, "startDate" | "endDate">[]): number[] {
  const out: number[] = [];
  for (let i = 1; i < chain.length; i++) {
    const prevEnd = chain[i - 1].endDate || chain[i - 1].startDate;
    const start = chain[i].startDate;
    if (prevEnd && start && start >= prevEnd) out.push(monthsBetween(prevEnd, start));
  }
  return out;
}
