/**
 * Where to watch, by country (data/where-to-watch.json): which legal services carry each popular franchise in the
 * US, India and the UK, with audio (sub, English dub, Hindi dub), what the service covers and how you pay.
 * Researched from the services' own title pages, JustWatch and official announcements, two sources where
 * possible; entries confirmed by one source are marked "medium". TMDB's provider API needs a commercial licence,
 * so this file is the region data. Pure.
 */
import data from "@/data/where-to-watch.json";
import franchises from "@/data/franchises.json";
import { orderSlugs } from "./wosnap";

export const REGIONS = ["US", "IN", "GB"] as const;
export type Region = (typeof REGIONS)[number];
export const REGION_NAME: Record<Region, string> = { US: "United States", IN: "India", GB: "United Kingdom" };
export const REGION_SHORT: Record<Region, string> = { US: "US", IN: "India", GB: "UK" };
export const REGION_FLAG: Record<Region, string> = { US: "🇺🇸", IN: "🇮🇳", GB: "🇬🇧" };
export const isRegion = (c: string | null | undefined): c is Region => REGIONS.includes(c as Region);

export type ServiceKind = "subscription" | "free" | "buy";
export type Service = { service: string; kind: ServiceKind; audio: string[]; subs: string[]; scope: string; url: string | null; confidence?: "high" | "medium" };
export type Streams = { s: string; t: string; regions: Partial<Record<Region, Service[]>>; note: string; sources: string[] };

const D = data as { checked: string; reviewed: string | null; entries: Streams[] };
export const STREAMS_CHECKED = D.checked;
export const STREAMS_REVIEWED = D.reviewed;

const users = new Map((franchises as { franchises: { s: string; u: number }[] }).franchises.map((f) => [f.s, f.u]));
const bySlug = new Map(D.entries.map((e) => [e.s, e]));

/** Links go only to the services' own https pages. */
export const safeUrl = (u: string | null | undefined) => (u && /^https:\/\/[^\s"<>]+$/.test(u) ? u : null);

/** A service row worth showing: named, with a known way to pay. */
const valid = (x: Service) => Boolean(x.service) && ["subscription", "free", "buy"].includes(x.kind);
export const servicesIn = (e: Streams, r: Region): Service[] => (e.regions[r] ?? []).filter(valid);
export const hasAny = (e: Streams) => REGIONS.some((r) => servicesIn(e, r).length > 0);

/** Every researched franchise with at least one service, most-watched first. */
export const allStreams = (): Streams[] => D.entries.filter(hasAny).sort((a, b) => (users.get(b.s) ?? 0) - (users.get(a.s) ?? 0));
export const streamsBySlug = (slug: string): Streams | null => { const e = bySlug.get(slug); return e && hasAny(e) ? e : null; };

/** The entry for an anime: its own slug, else its franchise (any part of its watch order). */
export function streamsFor(anime: { id: string; slug: string }): Streams | null {
  return streamsBySlug(anime.slug) ?? orderSlugs(anime.id).map(streamsBySlug).find(Boolean) ?? null;
}

export const streamsPath = (slug: string) => `/anime/${slug}/where-to-watch`;

const AUDIO: Record<string, string> = { ja: "Japanese", en: "English dub", hi: "Hindi dub", ta: "Tamil dub", te: "Telugu dub", es: "Spanish dub", pt: "Portuguese dub", fr: "French dub", de: "German dub" };
/** "Sub + English dub + Hindi dub": Japanese audio with subtitles reads as "Sub". */
export function audioLine(x: Service): string {
  const parts = x.audio.map((a) => (a === "ja" ? (x.subs.length ? "Sub" : "Japanese") : AUDIO[a] ?? a.toUpperCase()));
  return [...new Set(parts)].join(" + ") || (x.subs.length ? "Sub" : "");
}
export const KIND_LABEL: Record<ServiceKind, string> = { subscription: "Subscription", free: "Free", buy: "Buy or rent" };

/** Whether any service in the region has the language's audio. */
export const dubbedIn = (e: Streams, r: Region, lang: string) => servicesIn(e, r).some((x) => x.audio.includes(lang));
export const freeIn = (e: Streams, r: Region) => servicesIn(e, r).filter((x) => x.kind === "free");

/** Service → franchises it carries in a region, biggest catalogue first. */
export function catalogue(r: Region): { service: string; kind: ServiceKind; titles: Streams[] }[] {
  const m = new Map<string, { service: string; kind: ServiceKind; titles: Streams[] }>();
  for (const e of allStreams()) for (const x of servicesIn(e, r)) {
    if (x.kind === "buy") continue;
    const row = m.get(x.service) ?? { service: x.service, kind: x.kind, titles: [] };
    if (!row.titles.includes(e)) row.titles.push(e);
    m.set(x.service, row);
  }
  return [...m.values()].sort((a, b) => b.titles.length - a.titles.length);
}

/** "10 November 2026". */
export const streamsDate = () => new Date(`${STREAMS_CHECKED}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });
