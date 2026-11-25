/**
 * The pages the current release changed in template or wording (data/release-urls.json). Their data files' dates
 * don't move for that, so without this the sitemap kept their old dates and the IndexNow job skipped them; Bing
 * flagged them as "recently published pages not submitted via IndexNow" (Nov 2026). Pure.
 */
import data from "@/data/release-urls.json";

const D = data as { date: string; paths: string[] };
const paths = new Set(D.paths);
export const RELEASE_DATE = D.date;
export const inRelease = (path: string) => paths.has(path);
