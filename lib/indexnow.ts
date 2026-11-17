/**
 * IndexNow (Bing, Yandex, Seznam, Naver; Bing also feeds DuckDuckGo): tells them a URL changed. Bing flags one big
 * daily list as "batch mode" (14 Nov 2026), so URLs go as they change: a new episode as it airs
 * (scripts/send-alerts.mts), and once a day only the pages whose data really changed (scripts/submit-sitemap.mts).
 * The daily job sends those in small groups (at most CHUNK_SIZE URLs, a pause between groups, a few groups per run;
 * the rest wait for the next run) and skips any URL it already sent in the last SENT_WINDOW_MS: after a release two
 * runs 90 minutes apart sent the same 91 URLs twice (16 Nov 2026). What was sent is a small JSON log
 * (url → time sent) kept between runs by actions/cache (.github/workflows/sitemap.yml).
 * No account; the key is the public file /<key>.txt.
 */
const SITE = "https://anilumi.in";
export const INDEXNOW_KEY = "67e58fb83b0e42898f42b207fa29073d";

/** The pages a newly aired episode changes: the episode itself, the show and its episode list. Pure. */
export const episodeUrls = (episodeUrl: string) => {
  const show = episodeUrl.replace(/\/episode\/\d+$/, "");
  return [`${SITE}${episodeUrl}`, `${SITE}${show}`, `${SITE}${show}/episodes`];
};

/**
 * Sitemap entries worth sending: those with a real change date. Hourly and daily pages (home, schedule, airing
 * shows, current season) carry the time the sitemap was built, not a change, so they're left to the crawl; new
 * episodes on them are sent as they air. Pure.
 */
export function changedEntries(xml: string, since: number): string[] {
  return [...xml.matchAll(/<url>([\s\S]*?)<\/url>/g)]
    .map(([, u]) => ({ loc: u.match(/<loc>([^<]+)<\/loc>/)?.[1], mod: Date.parse(u.match(/<lastmod>([^<]+)<\/lastmod>/)?.[1] || ""), freq: u.match(/<changefreq>([^<]+)<\/changefreq>/)?.[1] }))
    .filter((u) => u.loc && u.mod >= since && u.freq !== "hourly" && u.freq !== "daily")
    .map((u) => u.loc!);
}

/** POST a list of URLs; returns the HTTP status (200/202 accepted, 403 key file unreachable, 422 wrong host). */
export async function submitIndexNow(urls: string[]): Promise<number> {
  const res = await fetch("https://api.indexnow.org/indexnow", {
    method: "POST",
    headers: { "content-type": "application/json; charset=utf-8" },
    body: JSON.stringify({ host: "anilumi.in", key: INDEXNOW_KEY, keyLocation: `${SITE}/${INDEXNOW_KEY}.txt`, urlList: urls }),
    signal: AbortSignal.timeout(20_000),
  });
  return res.status;
}

/** URLs per IndexNow request from the daily job: small groups, not one big list. */
export const CHUNK_SIZE = 20;
/** A URL sent within this long isn't sent again (the daily job's lookback must not be longer, or it would be). */
export const SENT_WINDOW_MS = 72 * 3600_000;

/** url → when it was last sent (ms since epoch). */
export type SentLog = Record<string, number>;

/** The URLs not sent within windowMs before now, deduplicated, in their original order. Pure. */
export function freshUrls(urls: string[], sentLog: SentLog, now: number, windowMs = SENT_WINDOW_MS): string[] {
  return [...new Set(urls)].filter((u) => !(now - (sentLog[u] ?? -Infinity) < windowMs));
}

/** A new log with urls marked as sent at now and entries older than windowMs dropped. Pure. */
export function recordSent(sentLog: SentLog, urls: string[], now: number, windowMs = SENT_WINDOW_MS): SentLog {
  const kept = Object.entries(sentLog).filter(([, at]) => Number.isFinite(at) && now - at < windowMs);
  return { ...Object.fromEntries(kept), ...Object.fromEntries(urls.map((u) => [u, now])) };
}

/** Splits a list into groups of at most size. Pure. */
export function chunk<T>(items: T[], size = CHUNK_SIZE): T[][] {
  if (!(size >= 1)) throw new Error(`chunk size must be at least 1, got ${size}`);
  const out: T[][] = [];
  for (let i = 0; i < items.length; i += size) out.push(items.slice(i, i + size));
  return out;
}
