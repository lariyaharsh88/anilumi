/**
 * Community features (ratings, reactions, hype, polls) and lead capture: shared constants and pure
 * helpers, safe to import from client and server. Storage lives in lib/db.ts; see docs/plan-db-and-leads.md.
 */

export const REACTIONS = [
  { key: "love", emoji: "😍", label: "Loved it" },
  { key: "lol", emoji: "😂", label: "Funny" },
  { key: "sad", emoji: "😭", label: "Emotional" },
  { key: "shock", emoji: "🤯", label: "Mind-blown" },
  { key: "meh", emoji: "😴", label: "Boring" },
] as const;
export type ReactionKey = (typeof REACTIONS)[number]["key"];
export const isReaction = (k: unknown): k is ReactionKey => REACTIONS.some((r) => r.key === k);

/** Google review snippets only once a title has this many genuine AniLumi ratings. */
export const RATING_SNIPPET_MIN = 10;

export const LEAD_KINDS = ["alert", "digest", "cheatsheet", "guide"] as const;
export type LeadKind = (typeof LEAD_KINDS)[number];

export const isScore = (n: unknown): n is number => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 10;
/** Kitsu anime ids are numeric strings. */
export const isAnimeId = (s: unknown): s is string => typeof s === "string" && /^\d{1,9}$/.test(s);
export const isEpisode = (n: unknown): n is number => Number.isInteger(n) && (n as number) >= 1 && (n as number) <= 5000;
/** CTA ids like "anime-alert" or "preview-cheatsheet". */
export const isSource = (s: unknown): s is string => typeof s === "string" && /^[a-z0-9-]{2,40}$/.test(s);

/** Trimmed, lower-cased email, or null if it doesn't look deliverable. Pure. */
export function normalizeEmail(raw: unknown): string | null {
  if (typeof raw !== "string") return null;
  const e = raw.trim().toLowerCase();
  if (e.length > 254 || !/^[^\s@]+@[^\s@]+\.[a-z]{2,}$/.test(e)) return null;
  return e;
}

/** Short free text from a form: trimmed, control characters removed, capped. Pure. */
export function cleanText(raw: unknown, max: number): string {
  if (typeof raw !== "string") return "";
  return raw.replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "").trim().slice(0, max);
}

export type RatingStats = { count: number; sum: number; dist: number[] };
export type RatingSummary = { count: number; avg: number | null; dist: number[] };

/** Average to one decimal and a 10-slot distribution. Pure. */
export function summarize(s: Partial<RatingStats> | null | undefined): RatingSummary {
  const count = Math.max(0, s?.count || 0);
  const dist = Array.from({ length: 10 }, (_, i) => Math.max(0, s?.dist?.[i] || 0));
  return { count, avg: count ? Math.round(((s?.sum || 0) / count) * 10) / 10 : null, dist };
}

/** `$inc` for rating_stats when a visitor rates (prev = their earlier score, if any). Pure. */
export function ratingDelta(score: number, prev: number | null): Record<string, number> {
  if (prev === score) return {};
  const inc: Record<string, number> = { sum: score - (prev || 0), [`dist.${score - 1}`]: 1 };
  if (prev) inc[`dist.${prev - 1}`] = -1;
  else inc.count = 1;
  return inc;
}

/** schema.org aggregateRating once there are enough ratings, else undefined. Pure. */
export function aggregateRating(s: RatingSummary) {
  if (s.count < RATING_SNIPPET_MIN || s.avg === null) return undefined;
  return { "@type": "AggregateRating", ratingValue: s.avg, bestRating: 10, worstRating: 1, ratingCount: s.count };
}

/** One CSV cell: quoted, and neutralised if a spreadsheet would read it as a formula. Pure. */
export function csvCell(v: unknown): string {
  let s = v === null || v === undefined ? "" : v instanceof Date ? v.toISOString() : String(v);
  if (/^[=+\-@\t\r]/.test(s)) s = `'${s}`;
  return `"${s.replace(/"/g, '""')}"`;
}
export const toCsv = (header: string[], rows: unknown[][]) => [header, ...rows].map((r) => r.map(csvCell).join(",")).join("\r\n");
