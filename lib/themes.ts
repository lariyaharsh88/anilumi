/**
 * Openings and endings from AnimeThemes (https://animethemes.moe, free, no key), matched by MAL id.
 * We show song data and link out for playback rather than hotlinking their videos.
 */
import { getMalId } from "./kitsu";

export type ThemeEntry = { version: number | null; episodes: string | null; spoiler: boolean; nsfw: boolean };
export type Theme = { type: "OP" | "ED"; sequence: number; slug: string; song: string | null; artists: string[]; entries: ThemeEntry[] };
export type Themes = { atSlug: string; themes: Theme[] };

type AtTheme = { type: string; sequence: number | null; slug: string; song: { title: string | null; artists: { name: string; artistsong?: { as: string | null } | null }[] } | null; animethemeentries: { version: number | null; episodes: string | null; spoiler: boolean; nsfw: boolean }[] };

/** Normalise and sort: openings first, then endings, by sequence. Pure. */
export function normaliseThemes(raw: AtTheme[]): Theme[] {
  return raw
    .filter((t) => t.type === "OP" || t.type === "ED")
    .map((t) => ({
      type: t.type as Theme["type"],
      sequence: t.sequence ?? 1,
      slug: t.slug,
      song: t.song?.title || null,
      artists: (t.song?.artists || []).map((a) => (a.artistsong?.as ? `${a.name} (as ${a.artistsong.as})` : a.name)),
      entries: (t.animethemeentries || []).map((e) => ({ version: e.version, episodes: e.episodes, spoiler: Boolean(e.spoiler), nsfw: Boolean(e.nsfw) })),
    }))
    .sort((x, y) => (x.type === y.type ? x.sequence - y.sequence : x.type === "OP" ? -1 : 1));
}

export async function getThemes(kitsuId: string): Promise<Themes | null> {
  const mal = await getMalId(kitsuId);
  if (!mal) return null;
  const url = `https://api.animethemes.moe/anime?filter[has]=resources&filter[site]=MyAnimeList&filter[external_id]=${mal}&include=animethemes.animethemeentries,animethemes.song.artists&fields[anime]=slug&fields[song]=title&fields[artist]=name&fields[animetheme]=type,sequence,slug&fields[animethemeentry]=version,episodes,spoiler,nsfw`;
  // One retry: AnimeThemes allows 90 requests a minute and occasionally times out under build load.
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json", "User-Agent": "AniLumi/1.0 (+https://anilumi.in)" }, next: { revalidate: 86400 * 3 }, signal: AbortSignal.timeout(8000) });
      if (res.status === 429 || res.status >= 500) { await new Promise((r) => setTimeout(r, 1500)); continue; }
      if (!res.ok) return null;
      const j = (await res.json()) as { anime?: { slug: string; animethemes: AtTheme[] }[] };
      const a = j.anime?.[0];
      return a ? { atSlug: a.slug, themes: normaliseThemes(a.animethemes || []) } : null;
    } catch {
      if (attempt) return null;
    }
  }
  return null;
}

/** "OP2", "ED1" → "Opening 2", "Ending 1". */
export const themeLabel = (t: Pick<Theme, "type" | "sequence">) => `${t.type === "OP" ? "Opening" : "Ending"} ${t.sequence}`;
export const youtubeSearch = (q: string) => `https://www.youtube.com/results?search_query=${encodeURIComponent(q)}`;
export const spotifySearch = (q: string) => `https://open.spotify.com/search/${encodeURIComponent(q)}`;
