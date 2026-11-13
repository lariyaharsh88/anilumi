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
  // "Apple TV" is a streaming service, not a channel.
  [/cartoon network|sony yay|zee caf|nickelodeon|(?<!apple )\btv\b/i, "tv"],
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

/** Platform pages (/hindi-dub/<slug>): the platforms people search with "hindi dubbed anime". */
export const HINDI_PLATFORMS = [
  { slug: "crunchyroll", label: "Crunchyroll", match: /^crunchyroll/i, how: "Open the episode, then pick Hindi under Audio in the settings menu (the gear icon on the web, the three dots in the app)." },
  { slug: "youtube", label: "YouTube (free)", match: /youtube/i, how: "Search the channel name on YouTube; full episodes are free with ads and stay up for months, though some playlists are removed when the licence ends." },
  { slug: "netflix", label: "Netflix India", match: /^netflix/i, how: "Open the title, start an episode, then choose Hindi under Audio & Subtitles." },
  { slug: "prime-video", label: "Prime Video (Anime Times)", match: /^(?!.*mx player).*(prime video|anime times)/i, how: "Anime Times is a paid channel inside Prime Video India; subscribe to the channel, then pick Hindi in the audio menu." },
  { slug: "jiohotstar", label: "JioHotstar", match: /hotstar/i, how: "Open the series and choose Hindi in the language menu before you press play." },
  // Amazon folded MX Player into Prime Video in India (announced May 2026): its free shows moved to Prime Video's free
  // tier. The slug and "MX Player" stay, since that's what people search for.
  { slug: "mx-player", label: "MX Player (now Prime Video free)", match: /mx player/i, how: "Free with ads and no Prime membership needed: MX Player's shows are now on Prime Video's free tier (Amazon folded MX Player into Prime Video in 2026). On Android the MX Player app still works; on iPhone, TV and the web it opens Prime Video. The Hindi version is usually listed as its own show." },
  { slug: "cartoon-network", label: "Cartoon Network India", match: /cartoon network/i, how: "A TV channel: check its schedule; some shows also stream on JioHotstar." },
] as const;
export type HindiPlatform = (typeof HINDI_PLATFORMS)[number];
export const hindiPlatform = (slug: string) => HINDI_PLATFORMS.find((p) => p.slug === slug) ?? null;

/** Every dub on a platform page, most-watched first, with that platform's rows. */
export function dubsOn(p: HindiPlatform): { d: Dub; rows: DubPlatform[] }[] {
  return hindiDubbed().flatMap((d) => { const rows = d.platforms.filter((x) => p.match.test(x.name)); return rows.length ? [{ d, rows }] : []; });
}
