/**
 * Pages a person has reviewed (data/reviews.json), by path: the page shows "Checked by <author> on <date>" and its
 * structured data gets reviewedBy. Researched pages without an entry show only their method and checked date.
 */
import data from "@/data/reviews.json";

const D = data as { reviews: Record<string, string> };
export const reviewedOn = (path: string): string | null => D.reviews[path] ?? null;
