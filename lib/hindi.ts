/**
 * Hindi guide pages (/hi): one per franchise with an editorial watch order, built only from data the English
 * pages already use (no Hindi dub claims: no free source records them). Pure helpers.
 */
import { WATCH_ORDER_OVERRIDES } from "@/data/watch-orders";
import type { WatchEntry } from "./kitsu";

/** Franchises that get a Hindi guide: every editorial watch order with a searched name. */
export const HINDI_SLUGS: string[] = Object.entries(WATCH_ORDER_OVERRIDES).filter(([, o]) => o.label).map(([slug]) => slug);
export const hindiPath = (slug: string) => `/hi/anime/${slug}`;
export const hasHindi = (slug: string) => HINDI_SLUGS.includes(slug);

export const KIND_HI: Record<WatchEntry["kind"], string> = {
  main: "मुख्य सीरीज़",
  movie: "मूवी",
  side: "साइड स्टोरी / OVA",
  recap: "रीकैप",
  spinoff: "स्पिन-ऑफ़",
  alt: "दूसरा वर्ज़न",
};

const MONTHS_HI = ["जनवरी", "फ़रवरी", "मार्च", "अप्रैल", "मई", "जून", "जुलाई", "अगस्त", "सितंबर", "अक्टूबर", "नवंबर", "दिसंबर"];

/** 2215 → "36 घंटे 55 मिनट"; 45 → "45 मिनट". */
export function hiDuration(min: number): string {
  const h = Math.floor(min / 60), m = Math.round(min % 60);
  if (!h) return `${m} मिनट`;
  return m ? `${h} घंटे ${m} मिनट` : `${h} घंटे`;
}

/** Days at two hours a day, at least 1. */
export const hiDays = (min: number) => Math.max(1, Math.ceil(min / 120));

/** "2027-01-10" → "10 जनवरी 2027"; "2027-01" → "जनवरी 2027"; null → null. */
export function hiDate(iso: string | null | undefined): string | null {
  const m = (iso || "").match(/^(\d{4})-(\d{2})(?:-(\d{2}))?/);
  if (!m) return null;
  const month = MONTHS_HI[Number(m[2]) - 1];
  return m[3] ? `${Number(m[3])} ${month} ${m[1]}` : `${month} ${m[1]}`;
}

/** "January 2027" (AniList's expected month) → "जनवरी 2027"; a bare year stays as is. */
export function hiExpected(expected: string | null | undefined): string | null {
  if (!expected) return null;
  const en = ["january", "february", "march", "april", "may", "june", "july", "august", "september", "october", "november", "december"];
  const [word, year] = expected.split(" ");
  const i = en.indexOf((word || "").toLowerCase());
  return i >= 0 && year ? `${MONTHS_HI[i]} ${year}` : expected;
}

/** "1 मूवी", "3 मूवीज़": counts with the Hindi/Hinglish plural people write. */
export const hiCount = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;
