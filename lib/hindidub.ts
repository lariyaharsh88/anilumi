/**
 * Official Hindi dubs (data/hindi-dubs.json): which platform carries a Hindi audio track for each popular
 * franchise, with the scope (seasons) and the page it was confirmed on. Checked against the platforms' own title
 * pages (Crunchyroll "Audio", Netflix India) and Indian anime news; fan trackers alone never count. Pure.
 */
import data from "@/data/hindi-dubs.json";
import franchises from "@/data/franchises.json";
import { orderSlugs, snapshotId } from "./wosnap";

export type DubPlatform = { name: string; scope: string; url: string };
export type Dub = {
  s: string; t: string; status: "available" | "past_broadcast" | "announced" | "none_found";
  confidence: "high" | "medium" | "low"; platforms: DubPlatform[]; sources: string[]; note: string;
};
export type PlatformKind = "free" | "subscription" | "tv";

const D = data as { checked: string; reviewed: string | null; entries: Dub[] };
export const DUB_CHECKED = D.checked;
export const DUB_REVIEWED = D.reviewed;

/** How you watch on each platform; unknown names read as subscription. */
const KIND: [RegExp, PlatformKind][] = [
  [/youtube|mx player/i, "free"],
  [/cartoon network|sony yay|zee caf|nickelodeon|\btv\b/i, "tv"],
];
export const platformKind = (name: string): PlatformKind => KIND.find(([re]) => re.test(name))?.[1] ?? "subscription";

const users = new Map((franchises as { franchises: { s: string; u: number; n: number }[] }).franchises.map((f) => [f.s, f]));
/** Most-watched first (Kitsu library counts). */
const byPopularity = (a: Dub, b: Dub) => (users.get(b.s)?.u ?? 0) - (users.get(a.s)?.u ?? 0);
const bySlug = new Map(D.entries.map((e) => [e.s, e]));

/** Shown as a firm answer: available entries, and "no Hindi dub" only when the check was solid. */
const answerable = (d: Dub) => d.status === "available" || (d.status === "none_found" && d.confidence !== "low");

/** Every franchise with an official Hindi dub, most-watched first. */
export const hindiDubbed = (): Dub[] => D.entries.filter((e) => e.status === "available").sort(byPopularity);
/** Popular franchises checked and found without a Hindi dub. */
export const notDubbed = (): Dub[] => D.entries.filter((e) => e.status === "none_found" && e.confidence !== "low").sort(byPopularity);

/** The dub entry for an anime: its own slug, else its franchise (any part of its watch order). */
export function dubFor(anime: { id: string; slug: string }): Dub | null {
  const own = bySlug.get(anime.slug);
  if (own) return answerable(own) ? own : null;
  const found = orderSlugs(anime.id).flatMap((s) => bySlug.get(s) ?? []).filter(answerable);
  return found.find((d) => d.status === "available") ?? found[0] ?? null;
}

/** Where a franchise's guide lives: the watch order when it has several parts, else the anime page. */
export const dubHref = (d: Dub) => ((users.get(d.s)?.n ?? 1) > 1 ? `/watch-order/${d.s}` : `/anime/${d.s}`);

/** Platform → franchises it carries in Hindi, biggest catalogue first. */
export function byPlatform(): { name: string; kind: PlatformKind; titles: { d: Dub; scope: string }[] }[] {
  const m = new Map<string, { d: Dub; scope: string }[]>();
  for (const d of hindiDubbed()) for (const p of d.platforms) {
    const list = m.get(p.name) ?? [];
    const same = list.find((x) => x.d === d); // e.g. two Dragon Ball entries on Crunchyroll: one row, scopes joined
    if (same) same.scope = [same.scope, p.scope].filter(Boolean).join("; ");
    else m.set(p.name, [...list, { d, scope: p.scope }]);
  }
  return [...m].map(([name, titles]) => ({ name, kind: platformKind(name), titles })).sort((a, b) => b.titles.length - a.titles.length || a.name.localeCompare(b.name));
}

export const dubDate = (lang: "en" | "hi" = "en", iso = DUB_CHECKED) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString(lang === "hi" ? "hi-IN" : "en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

const platformList = (d: Dub, lang: "en" | "hi") => d.platforms.map((p) => `${p.name}${p.scope ? ` (${p.scope})` : ""}`).join(lang === "hi" ? ", " : "; ");

/** The FAQ entry for "Is X dubbed in Hindi?", matching the card. */
export function dubFaq(d: Dub | null, title: string, lang: "en" | "hi" = "en"): { q: string; a: string } | null {
  if (!d) return null;
  const yes = d.status === "available";
  return lang === "hi"
    ? { q: `क्या ${title} हिंदी डब में है?`, a: yes ? `हाँ, ${title} का आधिकारिक हिंदी डब यहाँ है: ${platformList(d, "hi")}।` : `${dubDate("hi")} तक ${title} का कोई आधिकारिक हिंदी डब नहीं मिला।` }
    : { q: `Is ${title} dubbed in Hindi?`, a: yes ? `Yes. ${title} has an official Hindi dub on ${platformList(d, "en")}.` : `No official Hindi dub has been released as of ${dubDate("en")}. ${d.note}` };
}

/** Whether a franchise (by any of its slugs) has an official Hindi dub on record. */
export function hasHindiDub(slug: string): boolean {
  const id = snapshotId(slug);
  return dubFor({ id: id ?? "", slug })?.status === "available";
}
