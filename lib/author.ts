/**
 * The person who checks AniLumi's guides. One Person entity with a stable @id, used by the author page
 * (ProfilePage), the Organization's founder and every guide's reviewedBy, so search engines see one author.
 */
import { site, abs } from "./site";

export const AUTHOR = {
  name: site.founder.name,
  path: "/author/harsh-lariya",
  /** Their own site, listed as sameAs. */
  home: site.founder.url,
};
export const AUTHOR_ID = `${abs(AUTHOR.path)}#person`;

/** A reference to the author, for reviewedBy / founder / author fields. */
export const authorRef = () => ({ "@type": "Person", "@id": AUTHOR_ID, name: AUTHOR.name, url: abs(AUTHOR.path) });
