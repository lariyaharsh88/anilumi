/**
 * Trailers and PVs for upcoming seasons (/anime-trailers): AniList's trailer for each show in the season previews
 * (lib/preview.ts). Kitsu rarely has a trailer before a show airs; AniList has one for almost every announced
 * show (48 of the first 50 of Winter 2027, Nov 2026). YouTube only, since that's what the page embeds.
 */
import { anilist } from "./anilist";
import type { PreviewItem } from "./preview";

type Raw = { id: number; trailer: { id: string | null; site: string | null } | null };
const QUERY = "query($ids:[Int]){Page(perPage:50){media(id_in:$ids){id trailer{id site}}}}";

/** AniList id → YouTube video id, for the ids that have a YouTube trailer. */
export async function youtubeTrailers(ids: number[]): Promise<Map<number, string>> {
  const out = new Map<number, string>();
  for (let i = 0; i < ids.length; i += 50) {
    const page = await anilist<{ Page: { media: Raw[] } }>(QUERY, { ids: ids.slice(i, i + 50) }, 86400);
    for (const m of page?.Page.media ?? []) if (m.trailer?.site === "youtube" && m.trailer.id && /^[\w-]{6,20}$/.test(m.trailer.id)) out.set(m.id, m.trailer.id);
  }
  return out;
}

export type TrailerItem = PreviewItem & { video: string };

/** The shows with a trailer, most anticipated (AniList popularity) first. Pure. */
export function withTrailers(items: PreviewItem[], videos: Map<number, string>): TrailerItem[] {
  return items.flatMap((i) => (videos.has(i.id) ? [{ ...i, video: videos.get(i.id)! }] : [])).sort((a, b) => b.popularity - a.popularity);
}
