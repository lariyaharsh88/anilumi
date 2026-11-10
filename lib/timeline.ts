/**
 * Where each film fits in the story (data/film-timeline.json), for "<franchise> chronological order": the TV
 * episode each film follows and whether it's canon, from the franchise wikis, Wikipedia and published watch
 * guides, two sources where possible ("medium" when one). Keyed by the watch-order override key. Pure.
 */
import data from "@/data/film-timeline.json";

export type FilmSpot = {
  slug: string; title: string; when: string; canon: boolean;
  afterEpisode: { series: string; episode: number } | null; note?: string; confidence?: "high" | "medium"; sources?: string[];
};
const D = data as unknown as { checked: string; reviewed: string | null; franchises: Record<string, FilmSpot[]> };
export const TIMELINE_CHECKED = D.checked;

/** Films in story order for a franchise (by its override key), or null. */
export const timelineFor = (key: string | null | undefined): FilmSpot[] | null => (key && D.franchises[key]?.length ? D.franchises[key].filter((f) => f.slug && f.when) : null);
