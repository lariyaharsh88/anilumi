/**
 * Donghua (Chinese animation) for viewers in India, the US and the UK (data/donghua.json): where each of the most
 * searched titles streams legally, with audio languages, official free channels and whether there's a Hindi track.
 * India searches donghua heavily and the results are unofficial uploads and spam pages (Keyword Planner, India, Nov
 * 2026, a month: Ne Zha 2 110K, The Daily Life of the Immortal King ~80K with variants, Lord of Mysteries 45K, To Be
 * Hero X 22K, Heaven Official's Blessing 18K, Spare Me Great Lord 18K and rising, Battle Through the Heavens 25K with
 * "btth"). Researched 23 Nov 2026 from JustWatch country pages, platform title pages and announcements; fan
 * re-uploads never count. Pure.
 */
import data from "@/data/donghua.json";
import orders from "@/data/donghua-orders.json";

export type DonghuaRegion = "IN" | "US" | "GB";
export type DonghuaService = { service: string; kind: "subscription" | "free" | "buy"; audio?: string[]; subs?: string[]; url: string | null };
export type Donghua = {
  t: string; cn: string; type: "series" | "film"; status: string;
  /** India searches a month (Keyword Planner, Nov 2026), for ordering. */
  demand: number;
  regions: Partial<Record<DonghuaRegion, DonghuaService[]>>;
  hindi: { available: boolean; where?: string; source?: string | null };
  kitsu: string | null; sources: string[]; confidence: "high" | "medium"; note?: string;
};
const D = data as unknown as { checked: string; titles: Donghua[] };
export const DONGHUA_CHECKED = D.checked;
/** Most searched in India first. */
export const donghuaList = (): Donghua[] => [...D.titles].sort((a, b) => b.demand - a.demand);
export const servicesIn = (d: Donghua, r: DonghuaRegion): DonghuaService[] => (d.regions[r] ?? []).filter((s) => s.kind !== "buy" || !(d.regions[r] ?? []).some((x) => x.kind !== "buy"));
export const freeIn = (d: Donghua, r: DonghuaRegion) => servicesIn(d, r).filter((s) => s.kind === "free");
export const inHindi = (d: Donghua) => d.hindi.available;
/** "Crunchyroll, Netflix" for a region, or null when nothing legal was found there. */
export const whereIn = (d: Donghua, r: DonghuaRegion) => { const s = [...new Set(servicesIn(d, r).map((x) => x.service))]; return s.length ? s.join(", ") : null; };

/**
 * Season-by-season watch orders for the long-running donghua (data/donghua-orders.json), researched 23 Nov 2026 from
 * Wikipedia, MyAnimeList, AniList, TheTVDB and the platforms; "battle through the heavens season 5" 1.3K a month in India,
 * "season 1" 880 (Keyword Planner, Nov 2026). Pure.
 */
export type OrderPart = { name: string; kind: "season" | "annual" | "special" | "film"; episodes: number | string; years: string; skippable?: boolean; what?: string };
export type DonghuaOrder = { slug: string; t: string; short: string; hub: string; cn?: string; start: string; status: string; novel?: string; parts: OrderPart[]; sources: string[]; note?: string };
const O = orders as unknown as { checked: string; series: DonghuaOrder[] };
export const ORDERS_CHECKED = O.checked;
export const donghuaOrders = (): DonghuaOrder[] => O.series;
export const donghuaOrder = (slug: string): DonghuaOrder | null => O.series.find((s) => s.slug === slug) ?? null;
/** Guides for a hub title (Soul Land has two: Soul Land and Soul Land 2). */
export const ordersFor = (hubTitle: string): DonghuaOrder[] => O.series.filter((s) => s.hub === hubTitle);
export const donghuaByTitle = (t: string): Donghua | null => D.titles.find((d) => d.t === t) ?? null;
export const orderPath = (slug: string) => `/donghua/${slug}`;
