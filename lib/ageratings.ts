/**
 * Official age ratings for indexed parents' guides (data/age-ratings.json): Crunchyroll India and Netflix India
 * (India's U/A 7+, 13+, 16+ and A), and US TV ratings, each with the page it comes from. Draft until a person
 * reviews the file. Pure.
 */
import data from "@/data/age-ratings.json";

export type OfficialRating = { body: string; rating: string; reasons: string | null; url: string };
type Entry = { ratings: OfficialRating[]; confidence: "high" | "medium"; sources: string[]; notes?: string };
const DATA = data as unknown as { checked: string | null; reviewed: string | null; shows: Record<string, Entry> };
export const RATINGS_CHECKED = DATA.checked;
export const RATINGS_REVIEWED = DATA.reviewed;
export const officialRatings = (slug: string): Entry | null => (DATA.shows[slug]?.ratings.length ? DATA.shows[slug] : null);

/** "U/A 16+ on Crunchyroll and Netflix India; TV-14 in the US" for the FAQ and description. Pure. */
export function ratingsLine(e: Entry): string {
  const bodies = new Map<string, string[]>();
  for (const r of e.ratings) bodies.set(r.rating, [...(bodies.get(r.rating) ?? []), r.body === "TV (US)" ? "US TV" : r.body]);
  return [...bodies].map(([rating, by]) => `${rating} (${by.join(", ")})`).join("; ");
}
