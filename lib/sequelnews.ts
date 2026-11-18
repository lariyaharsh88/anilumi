/**
 * The latest official sequel news per show (data/sequel-news.json): what was announced, when, by whom and the
 * release window, from Anime News Network, official accounts and Wikipedia, two sources each. Kitsu's and AniList's
 * status lags announcements (One Piece's 2027 film, Assassination Classroom's 2026 film), so where an
 * announcement exists and the automatic answer says there's none, pages follow the announcement. Draft until a
 * person reviews the file. Pure.
 */
import data from "@/data/sequel-news.json";
import type { SequelKind } from "./sequel";

/** Why there's no sequel yet: the story is finished, source material is left, or the franchise went on another way. */
export type SequelOutlook = "complete" | "material-left" | "remake-or-spinoff" | "announced";
/**
 * `season`, `name`: the season the page answers and the franchise name people search ("High School DxD Season 5" on
 * the latest season's page; numbering can't come from the database, which splits some seasons into parts).
 * `headline`: the title's answer when the database verdict misleads, e.g. Chainsaw Man, whose "next" entry is a film
 * while a TV sequel is announced, or a placeholder date shown as real; "{asOf}" becomes the month. `label`: the whole
 * question when "Season N" doesn't fit (One Piece has no seasons: "One Piece New Episodes").
 */
export type SequelNews = { status: "announced" | "dated" | "airing" | "none"; what: string; announced: string | null; by: string | null; window: string | null; confidence: "high" | "medium"; sources: string[]; notes?: string; outlook?: SequelOutlook; why?: string; season?: number; name?: string; headline?: string; label?: string };
export const OUTLOOK_LABEL: Record<SequelOutlook, string> = { complete: "Story complete", "material-left": "Source material left", "remake-or-spinoff": "Continued another way", announced: "Announced" };
const DATA = data as unknown as { checked: string | null; reviewed: string | null; shows: Record<string, SequelNews> };
export const NEWS_CHECKED = DATA.checked;
export const NEWS_REVIEWED = DATA.reviewed;

export const sequelNews = (slug: string): SequelNews | null => DATA.shows[slug] ?? null;
/** Every show with researched sequel news, for the hub's "season 2 status" list. */
export const sequelNewsSlugs = (): string[] => Object.keys(DATA.shows);
/** An announcement the automatic verdict ("no sequel yet") hasn't caught up with. */
export const newsOverrides = (n: SequelNews | null, kind: SequelKind) => Boolean(n && (n.status === "announced" || n.status === "dated") && (kind === "none" || kind === "still-airing"));
