/**
 * Titles that fit a search result. Google shows about 60 characters before cutting the title off, so pages offer
 * several titles, most informative first, and use the first that fits, with " | AniLumi" when there's room for it
 * (search words matter more than the site name); failing that, the shortest. Pure.
 */
import type { Metadata } from "next";
import { site } from "./site";

export const TITLE_MAX = 62;
const SUFFIX = ` | ${site.name}`;

export function fitTitle(candidates: (string | null | false | undefined)[], max = TITLE_MAX): NonNullable<Metadata["title"]> {
  // Decorative marks in official titles ("Madoka★Magica") are spaces to a searcher ("madoka magica").
  const list = [...new Set(candidates.filter((c): c is string => Boolean(c)).map((c) => c.replace(/[★☆♪♡♥]/g, " ").replace(/\s+/g, " ").trim()))];
  const fits = list.find((c) => c.length <= max);
  if (fits) return fits.length + SUFFIX.length <= max ? fits : { absolute: fits };
  return { absolute: list.reduce((a, b) => (b.length < a.length ? b : a)) };
}

/** Meta descriptions: Google shows about 155–160 characters and Bing flags longer ones, so a description is cut at
 *  the last sentence that fits, else at a word, with an ellipsis. */
export const DESCRIPTION_MAX = 160;
export function fitDescription(text: string, max = DESCRIPTION_MAX): string {
  const s = text.replace(/\s+/g, " ").trim();
  if (s.length <= max) return s;
  const cut = s.slice(0, max);
  const sentence = cut.lastIndexOf(". ");
  const word = cut.lastIndexOf(" ");
  // A whole sentence when it fills most of the snippet (or nothing longer fits); otherwise as many words as fit.
  // Stopping at any sentence past 80 characters left snippets like "X from Y: age 15, 170 cm tall." at 96.
  if (sentence >= 0 && (sentence >= 120 || word <= sentence + 1)) return cut.slice(0, sentence + 1);
  return `${cut.slice(0, word).replace(/[,;:–-]$/, "")}…`;
}
