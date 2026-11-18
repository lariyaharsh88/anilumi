/**
 * The "anime like X" pages the sitemap lists: the ones Google already shows. Shared by the sitemap, the /similar hub
 * and the cross-links between similar pages, so all three always agree on which pages are indexed.
 *
 * Until Nov 2026 every title with strong fan picks was listed too (296 pages); in four weeks of Search Console data
 * 15 earned an impression, and Google had stopped indexing even the site's best pages ("crawled, not indexed"), so
 * the rest went: they stay reachable, noindexed.
 */
import aliases from "@/data/aliases.json";
import { similarSlugs } from "./indexing";

export type SimilarPage = { slug: string; title: string };

let titles: Map<string, string> | null = null;
const aliasTitle = (slug: string) => (titles ??= new Map((aliases as { anime: { s: string; t: string }[] }).anime.map((a) => [a.s, a.t]))).get(slug);
const pretty = (slug: string) => slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export async function indexedSimilar(): Promise<SimilarPage[]> {
  return similarSlugs().map((slug) => ({ slug, title: aliasTitle(slug) ?? pretty(slug) }));
}
