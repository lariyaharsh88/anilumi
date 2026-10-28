/**
 * Anime news from Anime News Network's public RSS. We show the headline and ANN's own one-line summary,
 * credit ANN and link to the full article; nothing else is copied. Pure parsing helpers are unit-tested.
 */
import data from "@/data/aliases.json";
import { norm, type AliasEntry } from "./aliases";

export type NewsItem = { id: string; title: string; summary: string; url: string; date: string; category: string; source: string; anime: { slug: string; title: string }[] };

// Two outlets: if one blocks or rate-limits our host, the other still fills the page.
const FEEDS = [
  { source: "Anime News Network", url: "https://www.animenewsnetwork.com/news/rss.xml?ann-edition=w" },
  { source: "MyAnimeList", url: "https://myanimelist.net/rss/news.xml" },
];
const ENT: Record<string, string> = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const entities = (s: string) =>
  s
    .replace(/&#(\d+);/g, (_, n) => String.fromCodePoint(Number(n)))
    .replace(/&#x([0-9a-f]+);/gi, (_, n) => String.fromCodePoint(parseInt(n, 16)))
    .replace(/&([a-z]+);/gi, (m, n) => ENT[n.toLowerCase()] ?? m);
// Decode entities before stripping tags: ANN escapes inline markup (&lt;cite&gt;) inside descriptions.
// Twice: some feeds double-escape (&amp;#039;).
const decode = (s: string) =>
  entities(entities(s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")))
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();

/** First sentence, at most ~160 characters: a teaser, not the article. Pure. */
export function teaser(s: string, max = 160): string {
  // Break only at a full stop followed by a capital: titles like "Mairimashita!" contain "!".
  const first = s.split(/(?<=\.)\s(?=[A-Z"'“])/)[0] || s;
  const t = first.length <= max ? first : `${first.slice(0, max).replace(/\s+\S*$/, "")}…`;
  return t.trim();
}

/** Parse RSS 2.0 items. Pure. */
export function parseRss(xml: string, source = "News"): Omit<NewsItem, "anime">[] {
  return [...xml.matchAll(/<item>([\s\S]*?)<\/item>/g)].flatMap(([, it]) => {
    const tag = (t: string) => decode(it.match(new RegExp(`<${t}[^>]*>([\\s\\S]*?)</${t}>`))?.[1] || "");
    const url = tag("link");
    const title = tag("title");
    if (!url.startsWith("https://") || !title) return [];
    const when = Date.parse(tag("pubDate"));
    return [{ id: tag("guid") || url, title, summary: teaser(tag("description")), url, date: Number.isNaN(when) ? "" : new Date(when).toISOString(), category: tag("category") || "News", source }];
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

async function fetchFeed(f: (typeof FEEDS)[number]): Promise<Omit<NewsItem, "anime">[]> {
  try {
    const res = await fetch(f.url, {
      headers: { Accept: "application/rss+xml, application/xml;q=0.9, */*;q=0.8", "User-Agent": "Mozilla/5.0 (compatible; AniLumi/1.0; +https://anilumi.in)" },
      next: { revalidate: 3600 },
      signal: AbortSignal.timeout(8000),
    });
    if (!res.ok) { console.warn(`[news] ${f.source}: HTTP ${res.status}`); return []; }
    return parseRss(await res.text(), f.source);
  } catch (err) {
    console.warn(`[news] ${f.source}: ${(err as Error).name}`);
    return [];
  }
}

/** Merge feeds newest first, dropping the same headline from a second outlet. Pure. */
export function mergeNews(lists: Omit<NewsItem, "anime">[][], limit = 50): Omit<NewsItem, "anime">[] {
  const seen = new Set<string>();
  return lists
    .flat()
    .sort((a, b) => (b.date || "").localeCompare(a.date || ""))
    .filter((n) => { const k = norm(n.title); if (seen.has(k)) return false; seen.add(k); return true; })
    .slice(0, limit);
}

export async function getNews(): Promise<NewsItem[]> {
  const lists = await Promise.all(FEEDS.map(fetchFeed));
  matchers ??= buildMatchers((data as { anime: AliasEntry[] }).anime);
  return mergeNews(lists).map((n) => ({ ...n, anime: animeInHeadline(n.title, matchers!) }));
}

/** News that mentions a given anime (by its title variants), newest first. */
export function newsAbout(items: NewsItem[], titles: (string | null | undefined)[]): NewsItem[] {
  const keys = [...new Set(titles.filter(Boolean).map((t) => norm(t!)).filter((k) => k.length >= 6))];
  return items.filter((n) => keys.some((k) => norm(n.title).includes(k)));
}
