/**
 * Audio and subtitle languages for a streaming link, from Kitsu's subs/dubs codes ("ja", "en", "es"…). English
 * names with a fixed locale, so server and browser render the same text. Pure.
 */
const names = new Intl.DisplayNames(["en"], { type: "language" });
const lang = (code: string) => { try { return names.of(code) || code; } catch { return code; } };
const list = (codes: string[]) => {
  const n = [...new Set(codes)].map(lang);
  return n.length <= 2 ? n.join(" & ") : `${n.slice(0, -1).join(", ")} & ${n[n.length - 1]}`;
};

/** "Japanese & English audio, English subtitles", or null when Kitsu lists neither. */
export function languageLine(l: { subs: string[]; dubs: string[] }): string | null {
  const parts = [l.dubs.length ? `${list(l.dubs)} audio` : null, l.subs.length ? `${list(l.subs)} subtitles` : null].filter(Boolean);
  return parts.length ? parts.join(", ") : null;
}
