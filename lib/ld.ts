/**
 * schema.org builders shared by pages. Entities carry stable @ids (site, organisation, each anime) so the
 * separate JSON-LD blocks on a page, and across pages, resolve to the same things in Google's graph. Pure.
 */
import { site, abs } from "./site";
import { animePath, type Anime } from "./kitsu";
import { authorRef } from "./author";

const CTX = "https://schema.org";
export const SITE_ID = `${site.url}/#website`;
export const ORG_ID = `${site.url}/#organization`;

/** Sitewide graph: the publisher and the site with its search box. Rendered once in the root layout. */
export function siteGraph() {
  return {
    "@context": CTX,
    "@graph": [
      {
        "@type": "Organization",
        "@id": ORG_ID,
        name: site.name,
        url: site.url,
        logo: { "@type": "ImageObject", url: abs("/brand/anilumi-mark-1024.png"), width: 1024, height: 1024 },
        description: site.description,
        founder: authorRef(),
      },
      {
        "@type": "WebSite",
        "@id": SITE_ID,
        name: site.name,
        url: site.url,
        description: site.tagline,
        inLanguage: "en",
        publisher: { "@id": ORG_ID },
        potentialAction: {
          "@type": "SearchAction",
          target: { "@type": "EntryPoint", urlTemplate: `${site.url}/search?q={search_term_string}` },
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
}

export const workType = (a: Pick<Anime, "subtype">) => (a.subtype === "movie" ? "Movie" : "TVSeries");
export const workId = (a: Pick<Anime, "slug">) => `${abs(animePath(a))}#work`;

/** Reference to an anime's main entity, for `about`, `partOfSeries` and list items. */
export const workRef = (a: Pick<Anime, "slug" | "subtype" | "title">) => ({ "@type": workType(a), "@id": workId(a), name: a.title, url: abs(animePath(a)) });

export type LdListItem = { url: string; name: string; image?: string | null };

/** ItemList of on-site URLs (Google's "summary page" carousel format). `url` may be a path. */
export function itemList(name: string, items: LdListItem[], start = 1) {
  return {
    "@context": CTX,
    "@type": "ItemList",
    name,
    numberOfItems: items.length,
    itemListElement: items.map((it, i) => ({
      "@type": "ListItem",
      position: start + i,
      url: it.url.startsWith("http") ? it.url : abs(it.url),
      name: it.name,
      ...(it.image ? { image: it.image } : {}),
    })),
  };
}

/** A page about one anime (filler list, cast, runtime…): ties the page to the anime's entity. */
export function pageAbout(a: Pick<Anime, "slug" | "subtype" | "title">, path: string, name: string, description?: string, lang = "en") {
  return {
    "@context": CTX,
    "@type": "WebPage",
    "@id": abs(path),
    url: abs(path),
    name,
    description,
    inLanguage: lang,
    isPartOf: { "@id": SITE_ID },
    about: workRef(a),
  };
}

/** A topical page (hub, tool) that isn't about one anime. */
export function webPage(type: "WebPage" | "CollectionPage" | "AboutPage" | "ContactPage", path: string, name: string, description?: string) {
  return { "@context": CTX, "@type": type, "@id": abs(path), url: abs(path), name, description, inLanguage: "en", isPartOf: { "@id": SITE_ID }, publisher: { "@id": ORG_ID } };
}

/** `lastReviewed` + `reviewedBy` for a page a person has checked (spread into a WebPage); empty when unchecked. */
export const reviewedBy = (iso?: string | null) =>
  iso ? { lastReviewed: iso, reviewedBy: authorRef() } : {};

/** "PT1H30M" from minutes. */
export function isoDuration(min: number): string {
  const h = Math.floor(min / 60), m = Math.round(min % 60);
  return `PT${h ? `${h}H` : ""}${m || !h ? `${m}M` : ""}`;
}
