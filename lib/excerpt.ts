/**
 * Short excerpts of third-party text (Kitsu synopses and character bios, AniList staff bios). Pages quote a few
 * sentences with a credit and link, rather than republishing the whole text other sites also carry, so each
 * page leads with AniLumi's own answers. Pure.
 */

/** Credit lines the sources append: "(Source: Crunchyroll)", "[Written by MAL Rewrite]", "Note: …". */
const CREDIT = /\s*(\((source|sources)\s*:[^)]*\)|\[written by[^\]]*\]|source\s*:\s*\S.*)\s*$/i;

export function excerpt(text: string | null | undefined, max: number): string {
  if (!text) return "";
  let t = text.replace(/\r/g, "").replace(/\n{3,}/g, "\n\n").trim();
  for (let i = 0; i < 3 && CREDIT.test(t); i++) t = t.replace(CREDIT, "").trim();
  if (t.length <= max) return t;
  const cut = t.slice(0, max);
  // End on a full sentence when one finishes past the halfway point, else on a word.
  const sentence = Math.max(cut.lastIndexOf(". "), cut.lastIndexOf("! "), cut.lastIndexOf("? "), cut.lastIndexOf(".\n"));
  if (sentence >= max / 2) return cut.slice(0, sentence + 1).trim();
  return cut.replace(/\s+\S*$/, "").replace(/[,;:\s]+$/, "") + "…";
}
