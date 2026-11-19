/**
 * Comic Con India editions (data/comic-con.json): dates, venues, ticket prices and what's there for anime fans, from
 * the official ticket pages (shop.comicconindia.com) with news reports as second sources; checked by hand. Dates are
 * Indian (IST) calendar days. Pure.
 */
import data from "@/data/comic-con.json";

export type CcTicket = { type: string; price: number; note: string };
export type CcEdition = {
  city: string; slug: string; name: string; start: string; end: string; venue: string; address: string;
  metro?: string; timings?: string; tickets: CcTicket[]; buy: { name: string; url: string }[];
  anime?: string[]; rules?: string[]; sources: string[]; confidence: "high" | "medium"; status: string; note?: string;
};
export type CcPast = { city: string; name: string; start: string; end: string; note: string; source: string };
const D = data as unknown as { checked: string; organizer: string; tickets: string; editions: CcEdition[]; past: CcPast[]; cosplay: { name: string; summary: string; sources: string[] } };

export const CC_CHECKED = D.checked;
export const CC_ORGANIZER = D.organizer;
export const CC_TICKETS = D.tickets;
export const CC_COSPLAY = D.cosplay;
export const ccPast = () => D.past;

/** Today's date in India as YYYY-MM-DD. */
export const istDay = (now = new Date()) => new Date(now.getTime() + 5.5 * 3600_000).toISOString().slice(0, 10);

/** Editions that haven't ended yet on `today` (IST), soonest first; ended ones drop off without a data edit. */
export const ccUpcoming = (today = istDay()) => [...D.editions].filter((e) => e.end >= today).sort((a, b) => a.start.localeCompare(b.start));
/** The edition on now or next. */
export const ccNext = (today = istDay()) => ccUpcoming(today)[0] ?? null;
/** True while an edition is running. */
export const ccLive = (e: CcEdition, today = istDay()) => e.start <= today && today <= e.end;
/** Doors open at 11 am IST on the first day (the official pages list 11 am). */
export const ccOpens = (e: CcEdition) => `${e.start}T11:00:00+05:30`;
/** The cheapest paid ticket, or 0 when entry is free. */
export const ccFrom = (e: CcEdition) => Math.min(...e.tickets.map((t) => t.price));
export const ccEdition = (slug: string) => D.editions.find((e) => e.slug === slug) ?? null;

const MONTH = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "5-6 Dec 2026", or "28 Nov - 2 Dec 2026" across months. */
export function ccDates(e: { start: string; end: string }): string {
  const [y1, m1, d1] = e.start.split("-").map(Number);
  const [y2, m2, d2] = e.end.split("-").map(Number);
  if (e.start === e.end) return `${d1} ${MONTH[m1 - 1]} ${y1}`;
  if (y1 === y2 && m1 === m2) return `${d1}–${d2} ${MONTH[m1 - 1]} ${y1}`;
  return `${d1} ${MONTH[m1 - 1]}${y1 !== y2 ? ` ${y1}` : ""} – ${d2} ${MONTH[m2 - 1]} ${y2}`;
}
export const inr = (n: number) => (n === 0 ? "Free" : `₹${n.toLocaleString("en-IN")}`);
