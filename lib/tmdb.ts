/**
 * Region-aware streaming availability from TMDB's watch-provider data (sourced from JustWatch).
 * Requires TMDB_API_KEY (v3 key) or TMDB_READ_TOKEN (v4 bearer). Without either, every function
 * returns null and the site falls back to Kitsu's region-less streaming links.
 * TMDB terms require attribution: "Streaming availability by JustWatch, via TMDB".
 */
import type { Anime } from "./kitsu";

const KEY = process.env.TMDB_API_KEY;
const TOKEN = process.env.TMDB_READ_TOKEN;
export const tmdbConfigured = () => Boolean(KEY || TOKEN);

async function tmdb<T>(path: string, params: Record<string, string> = {}, revalidate = 86400): Promise<T | null> {
  if (!tmdbConfigured()) return null;
  const qs = new URLSearchParams({ ...params, ...(KEY && !TOKEN ? { api_key: KEY } : {}) }).toString();
  try {
    const res = await fetch(`https://api.themoviedb.org/3${path}${qs ? `?${qs}` : ""}`, {
      headers: { Accept: "application/json", ...(TOKEN ? { Authorization: `Bearer ${TOKEN}` } : {}) },
      next: { revalidate },
      signal: AbortSignal.timeout(6000),
    });
    return res.ok ? ((await res.json()) as T) : null;
  } catch {
    return null;
  }
}

export type TmdbHit = { id: number; name?: string; title?: string; original_name?: string; original_title?: string; first_air_date?: string; release_date?: string; genre_ids?: number[]; origin_country?: string[]; original_language?: string; popularity?: number };
export type TmdbRef = { type: "tv" | "movie"; id: number; name: string };

const norm = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[^\p{L}\p{N}]+/gu, " ").trim();

/** Score search hits against what we know; returns the best plausible anime match or null. Pure, unit-tested. */
export function pickMatch(hits: TmdbHit[], want: { titles: string[]; year: number | null }): TmdbHit | null {
  const titles = want.titles.filter(Boolean).map(norm);
  let best: { h: TmdbHit; score: number } | null = null;
  for (const h of hits) {
    const names = [h.name, h.title, h.original_name, h.original_title].filter(Boolean).map((x) => norm(x!));
    let score = 0;
    if (h.genre_ids?.includes(16)) score += 3; // Animation
    if (h.original_language === "ja" || h.origin_country?.includes("JP")) score += 3;
    const y = Number((h.first_air_date || h.release_date || "").slice(0, 4));
    if (want.year && y && Math.abs(y - want.year) <= 1) score += 3;
    if (names.some((n) => titles.includes(n))) score += 4;
    else if (names.some((n) => titles.some((t) => n.includes(t) || t.includes(n)))) score += 2;
    if (!best || score > best.score || (score === best.score && (h.popularity || 0) > (best.h.popularity || 0))) best = { h, score };
  }
  return best && best.score >= 6 ? best.h : null;
}

/** Strip season / part / sequel suffixes so "Frieren Season 2" finds the single TMDB show. */
export function baseTitle(t: string) {
  return t.replace(/[:：]?\s*(season|part|cour)\s*\d+.*$/i, "").replace(/\s+\d+(st|nd|rd|th)\s+season.*$/i, "").replace(/\s+(ii|iii|iv|2|3|4)$/i, "").trim();
}

/** Resolve a Kitsu title to a TMDB show/movie: TVDB id via /find first, then scored title search. */
export async function findTmdb(a: Anime, mappings: Record<string, string>): Promise<TmdbRef | null> {
  if (!tmdbConfigured()) return null;
  const isMovie = a.subtype === "movie";
  const tvdb = (mappings["thetvdb/series"] || mappings["thetvdb"] || "").split("/")[0];
  if (!isMovie && tvdb) {
    const f = await tmdb<{ tv_results: TmdbHit[] }>(`/find/${tvdb}`, { external_source: "tvdb_id" }, 86400 * 7);
    const h = f?.tv_results?.[0];
    if (h) return { type: "tv", id: h.id, name: h.name || a.title };
  }
  const year = Number(a.startDate?.slice(0, 4)) || null;
  const titles = [...new Set([a.titleEn, a.title, baseTitle(a.titleEn || ""), baseTitle(a.title)].filter((x): x is string => Boolean(x)))];
  for (const q of titles.slice(0, 3)) {
    const r = await tmdb<{ results: TmdbHit[] }>(isMovie ? "/search/movie" : "/search/tv", { query: q, include_adult: "false" }, 86400 * 7);
    const h = r && pickMatch(r.results, { titles, year: isMovie || baseTitle(q) === q ? year : null });
    if (h) return { type: isMovie ? "movie" : "tv", id: h.id, name: h.name || h.title || a.title };
  }
  return null;
}

type ProviderEntry = { provider_id: number; provider_name: string; logo_path: string | null; display_priority: number };
type CountryProviders = { link?: string; flatrate?: ProviderEntry[]; free?: ProviderEntry[]; ads?: ProviderEntry[]; rent?: ProviderEntry[]; buy?: ProviderEntry[] };
export type ProvidersPayload = { results: Record<string, CountryProviders> };

export async function getProviders(ref: TmdbRef): Promise<ProvidersPayload | null> {
  return tmdb<ProvidersPayload>(`/${ref.type}/${ref.id}/watch/providers`, {}, 21600);
}

export type ProviderGroup = { kind: "stream" | "free" | "rent" | "buy"; label: string; providers: { id: number; name: string; logo: string | null }[] };

/** Group one country's providers for display; free + ads merge into one group. Pure, unit-tested. */
export function providersFor(payload: ProvidersPayload | null, country: string): { link: string | null; groups: ProviderGroup[]; countries: string[] } {
  const countries = Object.keys(payload?.results || {}).sort();
  const c = payload?.results?.[country];
  if (!c) return { link: null, groups: [], countries };
  const map = (xs?: ProviderEntry[]) => (xs || []).sort((a, b) => a.display_priority - b.display_priority).map((p) => ({ id: p.provider_id, name: p.provider_name, logo: p.logo_path ? `https://image.tmdb.org/t/p/w92${p.logo_path}` : null }));
  const freeAll = [...map(c.free), ...map(c.ads)].filter((p, i, arr) => arr.findIndex((q) => q.id === p.id) === i);
  const groups: ProviderGroup[] = [
    { kind: "stream" as const, label: "Stream with a subscription", providers: map(c.flatrate) },
    { kind: "free" as const, label: "Free (with ads)", providers: freeAll },
    { kind: "rent" as const, label: "Rent", providers: map(c.rent) },
    { kind: "buy" as const, label: "Buy", providers: map(c.buy) },
  ].filter((g) => g.providers.length);
  return { link: c.link || null, groups, countries };
}
