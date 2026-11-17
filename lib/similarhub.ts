/**
 * The "anime like X" pages the sitemap lists: every one Google already shows plus each title whose fan picks are
 * strong (lib/picks.ts, the page's own test). Shared by the sitemap, the /similar hub and the cross-links between
 * similar pages, so all three always agree on which pages are indexed.
 */
import aliases from "@/data/aliases.json";
import { kitsuByAniListIds, type Anime } from "./kitsu";
import { similarSlugs } from "./indexing";
import { strongSimilarIds } from "./picks";

export type SimilarPage = { slug: string; title: string };

let titles: Map<string, string> | null = null;
const aliasTitle = (slug: string) => (titles ??= new Map((aliases as { anime: { s: string; t: string }[] }).anime.map((a) => [a.s, a.t]))).get(slug);
const pretty = (slug: string) => slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

export async function indexedSimilar(): Promise<SimilarPage[]> {
  const strong = await kitsuByAniListIds(strongSimilarIds()).catch(() => new Map<number, Anime>());
  const out = new Map<string, string>();
  for (const s of similarSlugs()) out.set(s, aliasTitle(s) ?? pretty(s));
  for (const a of strong.values()) if (!out.has(a.slug)) out.set(a.slug, a.titleEn && a.titleEn.length <= 40 ? a.titleEn : a.title);
  return [...out].map(([slug, title]) => ({ slug, title }));
}
