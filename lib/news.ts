/**
 * Anime news from Anime News Network's public RSS. We show the headline and ANN's own one-line summary,
 * credit ANN and link to the full article; nothing else is copied. Pure parsing helpers are unit-tested.
 */
import data from "@/data/aliases.json";
import { norm, type AliasEntry } from "./aliases";

export type NewsItem = { id: string; title: string; summary: string; url: string; date: string; category: string; anime: { slug: string; title: string }[] };

const FEED = "https://www.animenewsnetwork.com/news/rss.xml?ann-edition=w";
const ENT: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const entities = (s: string) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m);
// Decode entities before stripping tags: ANN escapes inline markup (&lt;cite&gt;) inside descriptions.
const decode = (s: string) =>
  entities(s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1"))
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** Parse RSS 2.0 items. Pure. */
export function parseRss(xml: string): Omit<NewsItem, "anime">[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].flatMap(([, it]) => {
    const tag = (t: string) => decode(it.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`))?.[1] || "");
    const url = tag("link");
    const title = tag("title");
    if (!url.startsWith("https://") || !title) return [];
    const when = Date.parse(tag("pubDate"));
    return [{ id: tag("guid") || url, title, summary: tag("description"), url, date: Number.isNaN(when) ? "" : new Date(when).toISOString(), category: tag("category") || "News" }];
  });
}

/**
 * Titles worth matching in headlines: full names of popular anime, at least 6 characters once
 * normalised, so short or generic names ("op", "Bleach" stays, "K" doesn't) don't create false links.
 */
type Matcher = { key: string; slug: string; title: string; rank: number };
let matchers: Matcher[] | null = null;
export function buildMatchers(entries: AliasEntry[], max = 800): Matcher[] {
  const out: Matcher[] = [];
  for (const e of entries.slice(0, max)) {
    const key = norm(e.t);
    if (key.length >= 6) out.push({ key, slug: e.s, title: e.t, rank: e.r });
  }
  return out.sort((a, b) => b.key.length - a.key.length || a.rank - b.rank);
}

/** Popular anime whose title appears in the headline, longest/most specific first, one per franchise slug root. Pure. */
export function animeInHeadline(headline: string, ms: Matcher[], limit = 2): { slug: string; title: string }[] {
  const h = norm(headline);
  const found: Matcher[] = [];
  for (const m of ms) {
    if (!h.includes(m.key)) continue;
    if (found.some((f) => f.key.includes(m.key))) continue; // "Jujutsu Kaisen Season 2" already covers "Jujutsu Kaisen"
    found.push(m);
    if (found.length >= limit) break;
  }
  return found.map(({ slug, title }) => ({ slug, title }));
}

export async function getNews(): Promise<NewsItem[]> {
  try {
    const res = await fetch(FEED, { headers: { Accept: "application/rss+xml", "User-Agent": "AniLumi/1.0 (+https://anilumi.in)" }, next: { revalidate: 3600 }, signal: AbortSignal.timeout(8000) });
    if (!res.ok) return [];
    matchers ??= buildMatchers((data as { anime: AliasEntry[] }).anime);
    return parseRss(await res.text()).map((n) => ({ ...n, anime: animeInHeadline(n.title, matchers!) }));
  } catch {
    return [];
  }
}

/** News that mentions a given anime (by its title variants), newest first. */
export function newsAbout(items: NewsItem[], titles: (string | null | undefined)[]): NewsItem[] {
  const keys = [...new Set(titles.filter(Boolean).map((t) => norm(t!)).filter((k) => k.length >= 6))];
  return items.filter((n) => keys.some((k) => norm(n.title).includes(k)));
}
