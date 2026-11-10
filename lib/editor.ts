/**
 * The anime the site's editor has watched (data/editor-watched.json, ticked by Harsh on a private list, 10 Nov
 * 2026; one entry per series). Used for "Harsh has watched this" badges and the author page: first-hand
 * experience, stated only where it's true. A franchise counts when any of its entries is on the list. Pure.
 */
import data from "@/data/editor-watched.json";
import { orderSlugs } from "./wosnap";

type Item = { al: number; slug: string; title: string };
const D = data as { updated: string; by: string; count: number; items: Item[] };
const SLUGS = new Set(D.items.map((i) => i.slug));
const AL = new Set(D.items.map((i) => i.al));

export const WATCHED_COUNT = D.count;
export const WATCHED_UPDATED = D.updated;
export const watchedList = (): Item[] => D.items;
export const watchedAniList = (id: number | null | undefined) => Boolean(id && AL.has(id));

/** Whether the editor has watched this anime's series (this entry or another in its watch order). */
export function editorWatched(anime: { id: string; slug: string }): boolean {
  return SLUGS.has(anime.slug) || orderSlugs(anime.id).some((s) => SLUGS.has(s));
}
