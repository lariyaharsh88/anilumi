/**
 * What the platforms with Hindi-dubbed anime cost in India (data/hindi-platform-prices.json): each plan with its
 * price, period, ads and quality, kept only when two sources agree (the platform's own page counts as one).
 * Prices change, so the page shows the date checked. Pure.
 */
import data from "@/data/hindi-platform-prices.json";

export type PricePlan = { name: string; price: number; period: "month" | "quarter" | "year"; ads: boolean; quality?: string | null; notes?: string; sources?: string[] };
export type PlatformPrice = { label: string; free: boolean; plans: PricePlan[]; hindiNote?: string; sources: string[]; confidence: "high" | "medium"; notes?: string };

const D = data as unknown as { checked: string; platforms: Record<string, PlatformPrice> };
export const PRICES_CHECKED = D.checked;
export const pricesFor = (slug: string): PlatformPrice | null => D.platforms[slug] ?? null;
export const PERIOD: Record<PricePlan["period"], string> = { month: "month", quarter: "3 months", year: "year" };

/** The cheapest way in: a free platform, else the lowest monthly-equivalent plan. Pure. */
export function cheapestPlan(p: PlatformPrice): PricePlan | null {
  const perMonth = (x: PricePlan) => x.price / (x.period === "year" ? 12 : x.period === "quarter" ? 3 : 1);
  return p.plans.length ? [...p.plans].sort((a, b) => perMonth(a) - perMonth(b))[0] : null;
}

/** "From ₹99 a month or ₹999 a year": the lowest sticker price per billing period, as people compare them. Pure. */
export function startingAt(p: PlatformPrice): string | null {
  const low = (period: PricePlan["period"]) => p.plans.filter((x) => x.period === period).sort((a, b) => a.price - b.price)[0];
  const parts = (["month", "quarter", "year"] as const).map(low).filter((x): x is PricePlan => Boolean(x)).filter((x, i, arr) => i === 0 || x.period !== "quarter" || arr.length < 3);
  return parts.length ? `From ${parts.map((x) => `₹${x.price.toLocaleString("en-IN")} a ${PERIOD[x.period]}`).join(" or ")}` : null;
}
