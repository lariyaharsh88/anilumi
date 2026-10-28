/** Helpers for the trace.moe scene search. Pure and unit-tested. */
export type TraceHit = {
  anilist: { id: number; idMal: number | null; isAdult: boolean; title: { native: string | null; romaji: string | null; english: string | null } } | number;
  episode: number | string | null;
  from: number;
  to: number;
  similarity: number;
  video: string;
  image: string;
};
export type Match = { anilistId: number; title: string; native: string | null; episode: number | null; at: number; similarity: number; video: string; image: string };

/** 272.19 → "4:32", 3725 → "1:02:05". */
export function timecode(sec: number): string {
  const s = Math.max(0, Math.floor(sec));
  const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), r = s % 60;
  return h ? `${h}:${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}` : `${m}:${String(r).padStart(2, "0")}`;
}

/** trace.moe's own guidance: below ~87% similarity the match is usually wrong. */
export const CONFIDENT = 0.87;

/** Drop adult titles, keep the best hit per anime + episode, best first. */
export function toMatches(hits: TraceHit[], limit = 5): { matches: Match[]; hiddenAdult: number } {
  let hiddenAdult = 0;
  const best = new Map<string, Match>();
  for (const h of hits) {
    if (typeof h.anilist === "number") continue; // requested with anilistInfo, so this shouldn't happen
    if (h.anilist.isAdult) { hiddenAdult++; continue; }
    const episode = typeof h.episode === "number" ? h.episode : Number.parseInt(String(h.episode ?? ""), 10) || null;
    const key = `${h.anilist.id}:${episode ?? "-"}`;
    const m: Match = { anilistId: h.anilist.id, title: h.anilist.title.english || h.anilist.title.romaji || h.anilist.title.native || "Unknown", native: h.anilist.title.native, episode, at: h.from, similarity: h.similarity, video: h.video, image: h.image };
    const prev = best.get(key);
    if (!prev || m.similarity > prev.similarity) best.set(key, m);
  }
  return { matches: [...best.values()].sort((a, b) => b.similarity - a.similarity).slice(0, limit), hiddenAdult };
}

/** Friendly message for trace.moe HTTP errors. */
export function traceError(status: number, detail?: string): string {
  if (status === 402) return "You've used this month's free searches (trace.moe allows 100 per person each month). Try again next month.";
  if (status === 429) return "A search is already running. Wait a few seconds and try again.";
  if (status === 413) return "That file is too large. Try a screenshot instead of a video.";
  if (status >= 500 || status === 503) return "The search service is busy right now. Try again in a minute.";
  return detail ? `Couldn't search that image: ${detail}` : "Couldn't search that image. Try a different screenshot.";
}
