/**
 * Affiliate plumbing. Everything is env-driven so links degrade to plain URLs when unset.
 *  NEXT_PUBLIC_AMAZON_TAG       e.g. anilumi-20  → manga / Blu-ray search links carry the tag
 *  NEXT_PUBLIC_AFFILIATE_WRAP   e.g. https://go.skimresources.com/?id=XXX&url=  → wraps streaming URLs
 */
const AMAZON_TAG = process.env.NEXT_PUBLIC_AMAZON_TAG || "";
const WRAP = process.env.NEXT_PUBLIC_AFFILIATE_WRAP || "";

export function streamLink(url: string): string {
  return WRAP ? `${WRAP}${encodeURIComponent(url)}` : url;
}

export function amazonSearch(query: string): string {
  const u = new URL("https://www.amazon.com/s");
  u.searchParams.set("k", query);
  u.searchParams.set("i", "stripbooks");
  if (AMAZON_TAG) u.searchParams.set("tag", AMAZON_TAG);
  return u.toString();
}

export const affiliateRel = "noopener nofollow sponsored";
