/**
 * Which guides a person has checked, and how many are still drafts, read from the guide data itself so the
 * author and "how we check" pages never overstate it. Server-only (imports the data files).
 */
import { WATCH_ORDER_OVERRIDES } from "@/data/watch-orders";
import { NOTES } from "@/data/notes";
import { FILLER } from "@/data/filler";
import aliases from "@/data/aliases.json";
import { ARCS_REVIEWED, ARCS_CHECKED } from "./arcs";
import arcData from "@/data/arcs.json";
import { DUB_CHECKED, DUB_REVIEWED } from "./hindidub";
import dubData from "@/data/hindi-dubs.json";
import { ADAPT_CHECKED, ADAPT_REVIEWED } from "./mangaseasons";
import mangaData from "@/data/manga-seasons.json";
import { VOL_CHECKED, VOL_REVIEWED, VOL_COUNT } from "./mangavolumes";

export type CheckedGuide = { kind: "Watch order" | "Editor's take" | "Filler list"; title: string; href: string; date: string };

const titles = new Map((aliases as { anime: { s: string; t: string }[] }).anime.map((a) => [a.s, a.t]));
const titleOf = (slug: string) => titles.get(slug) || slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export function checkedGuides(): CheckedGuide[] {
  const out: CheckedGuide[] = [
    ...Object.entries(WATCH_ORDER_OVERRIDES).flatMap(([slug, w]) => (w.checked ? [{ kind: "Watch order" as const, title: w.label || titleOf(slug), href: `/watch-order/${slug}`, date: w.checked }] : [])),
    ...Object.entries(NOTES).flatMap(([slug, n]) => (n.reviewed && n.checked ? [{ kind: "Editor's take" as const, title: titleOf(slug), href: `/anime/${slug}`, date: n.checked }] : [])),
    ...Object.entries(FILLER).flatMap(([slug, f]) => (f.reviewed && f.reviewedOn ? [{ kind: "Filler list" as const, title: titleOf(slug), href: `/anime/${slug}/filler-list`, date: f.reviewedOn }] : [])),
  ];
  return out.sort((a, b) => b.date.localeCompare(a.date) || a.kind.localeCompare(b.kind) || a.title.localeCompare(b.title));
}

/** Guides published as drafts (cross-checked against sources, not yet signed off by a person). */
export function draftCounts() {
  return {
    watchOrders: Object.values(WATCH_ORDER_OVERRIDES).filter((w) => !w.checked).length,
    takes: Object.values(NOTES).filter((n) => !n.reviewed).length,
    filler: Object.values(FILLER).filter((f) => !f.reviewed).length,
    arcShows: ARCS_REVIEWED ? 0 : Object.keys((arcData as { shows: object }).shows).length,
    arcsChecked: ARCS_CHECKED,
    dubs: DUB_REVIEWED ? 0 : (dubData as { entries: unknown[] }).entries.length,
    dubsChecked: DUB_CHECKED,
    mangaSeasons: ADAPT_REVIEWED ? 0 : Object.keys((mangaData as { seasons: object }).seasons).length,
    mangaChecked: ADAPT_CHECKED,
    volumes: VOL_REVIEWED ? 0 : VOL_COUNT,
    volumesChecked: VOL_CHECKED,
  };
}
