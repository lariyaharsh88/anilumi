/**
 * Affiliate plumbing. Links degrade to plain URLs while a tag is unset.
 *  Amazon Associates tags, one per store (they're public, so they live here; env overrides for testing):
 *    NEXT_PUBLIC_AMAZON_TAG       amazon.com, e.g. anilumi-20
 *    NEXT_PUBLIC_AMAZON_TAG_IN    amazon.in,  e.g. anilumi-21
 *  NEXT_PUBLIC_AFFILIATE_WRAP   e.g. https://go.skimresources.com/?id=XXX&url=  → wraps streaming URLs
 */
export type Store = "us" | "in";

// From Associates Central (affiliate-program.amazon.com and affiliate.amazon.in), once the accounts are approved.
const DEFAULT_TAGS: Record<Store, string> = { us: "harshmedia98-20", in: "harshmedia98-21" };
const TAGS: Record<Store, string> = {
  us: process.env.NEXT_PUBLIC_AMAZON_TAG || DEFAULT_TAGS.us,
  in: process.env.NEXT_PUBLIC_AMAZON_TAG_IN || DEFAULT_TAGS.in,
};
const HOST: Record<Store, string> = { us: "www.amazon.com", in: "www.amazon.in" };
const WRAP = process.env.NEXT_PUBLIC_AFFILIATE_WRAP || "";

export function streamLink(url: string): string {
  return WRAP ? `${WRAP}${encodeURIComponent(url)}` : url;
}

// Search departments, which each store names differently: books (manga, light novels), video (Blu-ray), toys
// (figures). "all" searches every department (posters, apparel).
export type Dept = "books" | "video" | "toys" | "all";
const DEPT: Record<Exclude<Dept, "all">, Record<Store, string>> = { books: { us: "stripbooks", in: "stripbooks" }, video: { us: "movies-tv", in: "dvd" }, toys: { us: "toys-and-games", in: "toys" } };

/** A search on one Amazon store and department, with that store's tag when set. Pure. */
export function amazonSearch(query: string, store: Store = "us", dept: Dept = "books"): string {
  const u = new URL(`https://${HOST[store]}/s`);
  u.searchParams.set("k", query);
  if (dept !== "all") u.searchParams.set("i", DEPT[dept][store]);
  if (TAGS[store]) u.searchParams.set("tag", TAGS[store]);
  return u.toString();
}

/** Whether any Amazon link earns a commission (then the Associates disclosure must show). */
export const amazonTagged = () => Boolean(TAGS.us || TAGS.in);

/** Amazon store for a visitor's time zone: India gets amazon.in, everyone else amazon.com. Pure. */
export const storeForZone = (tz: string | undefined): Store => (tz === "Asia/Kolkata" || tz === "Asia/Calcutta" ? "in" : "us");

export const affiliateRel = "noopener nofollow sponsored";
