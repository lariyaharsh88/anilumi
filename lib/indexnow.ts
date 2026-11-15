/**
 * IndexNow (Bing, Yandex, Seznam, Naver; Bing also feeds DuckDuckGo): tells them a URL changed. Bing flags one big
 * daily list as "batch mode" (14 Nov 2026), so URLs go as they change: a new episode as it airs
 * (scripts/send-alerts.mts), and once a day only the pages whose data really changed (scripts/submit-sitemap.mts).
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
