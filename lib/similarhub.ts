/**
 * The "anime like X" pages the sitemap lists: the ones Google already shows, plus those searched by name
 * (lib/indexing.ts SIMILAR_SEARCHED). Shared by the sitemap, the /similar hub
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

/** The English names people search, for hub links where the alias file has the romaji ("Ore Dake Level Up na Ken"). */
const ENGLISH: Record<string, string> = {
  "solo-leveling": "Solo Leveling", "kimetsu-no-yaiba": "Demon Slayer", "kimi-no-na-wa": "Your Name", "naruto-shippuden": "Naruto Shippuden",
  "spy-x-family": "Spy x Family", "attack-on-titan": "Attack on Titan", "haikyuu": "Haikyuu!!", "youjo-senki": "The Saga of Tanya the Evil",
  "jibaku-shounen-hanako-kun": "Toilet-Bound Hanako-kun", "shinsekai-yori": "From the New World", "akatsuki-no-yona": "Yona of the Dawn",
  "kimi-ni-todoke": "Kimi ni Todoke: From Me to You",
};

export async function indexedSimilar(): Promise<SimilarPage[]> {
  return similarSlugs().map((slug) => ({ slug, title: ENGLISH[slug] ?? aliasTitle(slug) ?? pretty(slug) }));
}
