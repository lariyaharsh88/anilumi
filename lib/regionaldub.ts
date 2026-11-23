/**
 * Tamil and Telugu dubs (data/regional-dubs.json, checked like the Hindi list: the platform's own title page, the
 * licensor's announcement or Indian anime news, never fan lists): which anime have an official dub in each language,
 * and where. Platform names and kinds follow lib/hindidub.ts. Pure.
 */
import data from "@/data/regional-dubs.json";
import franchises from "@/data/franchises.json";
import { platformKind, type DubPlatform, type PlatformKind } from "./hindidub";
import { orderSlugs } from "./wosnap";

export const REGIONAL_LANGS = ["ta", "te"] as const;
export type RegionalLang = (typeof REGIONAL_LANGS)[number];
export const LANG: Record<RegionalLang, { name: string; native: string; path: string; other: RegionalLang }> = {
  ta: { name: "Tamil", native: "தமிழ்", path: "/tamil-dub", other: "te" },
  te: { name: "Telugu", native: "తెలుగు", path: "/telugu-dub", other: "ta" },
};

type LangDub = { status: "available" | "none_found"; confidence: "high" | "medium"; platforms: DubPlatform[]; added?: string };
type Entry = { s: string; t: string; ta?: LangDub; te?: LangDub; sources: string[]; note?: string; checked?: string };
const D = data as unknown as { checked: string; entries: Entry[] };
export const REGIONAL_CHECKED = D.checked;
export const REGIONAL_SCANNED = (D as { lastScan?: string }).lastScan ?? D.checked;

/** One anime's dub in one language, shaped like a Hindi dub entry so the same list and helpers work. */
export type RegionalDub = { s: string; t: string; confidence: "high" | "medium"; platforms: DubPlatform[]; checked: string; added?: string };

const users = new Map((franchises as { franchises: { s: string; u: number }[] }).franchises.map((f) => [f.s, f.u]));

/** Every anime with an official dub in `lang`, most-watched first. */
export function dubbedIn(lang: RegionalLang, entries: Entry[] = D.entries): RegionalDub[] {
  return entries.flatMap((e) => {
    const x = e[lang];
    return x?.status === "available" && x.platforms.length ? [{ s: e.s, t: e.t, confidence: x.confidence, platforms: x.platforms, checked: e.checked ?? D.checked, added: x.added }] : [];
  }).sort((a, b) => (users.get(b.s) ?? 0) - (users.get(a.s) ?? 0));
}

const bySlug = new Map(D.entries.map((e) => [e.s, e]));
/** An anime's confirmed dub in `lang`: its own entry, else its franchise's (any part of its watch order). */
export function regionalFor(anime: { id: string; slug: string }, lang: RegionalLang): RegionalDub | null {
  for (const s of [anime.slug, ...orderSlugs(anime.id)]) {
    const e = bySlug.get(s), x = e?.[lang];
    if (e && x?.status === "available" && x.platforms.length) return { s: e.s, t: e.t, confidence: x.confidence, platforms: x.platforms, checked: e.checked ?? D.checked };
  }
  return null;
}

/** Free when any platform is free, else subscription, else TV. Pure. */
export function cheapest(d: RegionalDub): PlatformKind {
  const k = new Set(d.platforms.map((p) => platformKind(p.name)));
  return k.has("free") ? "free" : k.has("subscription") ? "subscription" : "tv";
}

/** Platform → anime it carries in this language, biggest catalogue first. */
export function platformsFor(dubs: RegionalDub[]): { name: string; kind: PlatformKind; titles: RegionalDub[] }[] {
  const m = new Map<string, RegionalDub[]>();
  for (const d of dubs) for (const name of new Set(d.platforms.map((p) => p.name))) m.set(name, [...(m.get(name) ?? []), d]);
  return [...m].map(([name, titles]) => ({ name, kind: platformKind(name), titles })).sort((a, b) => b.titles.length - a.titles.length || a.name.localeCompare(b.name));
}

/** "15 November 2026": when the list was last checked. */
export const regionalDate = () => new Date(`${D.checked}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/**
 * Single-show Tamil and Telugu pages (/anime/<slug>/tamil-dub, /telugu-dub): every anime with its own confirmed dub in
 * that language has one, and the most-watched REGIONAL_PAGES are indexed ("anime tamil" 18.1K + "anime in tamil" 12.1K a
 * month in India, "naruto shippuden tamil" 3.6K; Keyword Planner, Nov 2026). Pure.
 */
export const REGIONAL_PAGES = 25;
export const regionalPath = (slug: string, lang: RegionalLang) => `/anime/${slug}/${lang === "ta" ? "tamil" : "telugu"}-dub`;
/** The dub in `lang` on this exact slug (not inherited from the franchise): the page exists only for these. */
export function regionalPageEntry(slug: string, lang: RegionalLang): RegionalDub | null {
  const e = bySlug.get(slug), x = e?.[lang];
  return e && x?.status === "available" && x.platforms.length ? { s: e.s, t: e.t, confidence: x.confidence, platforms: x.platforms, checked: e.checked ?? D.checked, added: x.added } : null;
}
const top: Partial<Record<RegionalLang, Set<string>>> = {};
export const topRegional = (slug: string, lang: RegionalLang) => (top[lang] ??= new Set(dubbedIn(lang).slice(0, REGIONAL_PAGES).map((d) => d.s))).has(slug);
