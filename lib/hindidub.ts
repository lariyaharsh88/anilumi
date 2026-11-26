/**
 * Official Hindi dubs (data/hindi-dubs.json): which platform carries a Hindi audio track for each popular
 * franchise, with the scope (seasons) and the page it was confirmed on. Checked against the platforms' own title
 * pages (Crunchyroll "Audio", Netflix India) and Indian anime news; fan trackers alone never count. Pure.
 */
import data from "@/data/hindi-dubs.json";
import franchises from "@/data/franchises.json";
import schedule from "@/data/dub-schedule.json";
import { orderSlugs, snapshotId } from "./wosnap";

export type DubPlatform = { name: string; scope: string; url: string };
export type Dub = {
  s: string; t: string; status: "available" | "past_broadcast" | "announced" | "none_found";
  confidence: "high" | "medium" | "low"; platforms: DubPlatform[]; sources: string[]; note: string;
  /** When the dub was added to the list (YYYY-MM-DD), for /new-dubs; when this entry was last re-checked. */
  added?: string; checked?: string;
};
export type PlatformKind = "free" | "subscription" | "tv";

const RAW = data as { checked: string; reviewed: string | null; entries: Dub[] };
/**
 * Apple TV India lists many anime "with Hindi audio" that actually stream through its Prime Video channel. Those rows
 * are Prime Video for viewers (the price, the "how to switch" steps, the Prime Video page), with Apple's listing kept as
 * the link that confirms the Hindi audio. Without this the Prime Video page showed 8 titles and missed 27. Pure.
 */
export function viaPrimeVideo(p: DubPlatform): DubPlatform {
  if (!/^apple tv/i.test(p.name) || !/via prime video/i.test(p.scope)) return p;
  const scope = p.scope.replace(/,?\s*(?:streams? )?via prime video(;?)\s*/i, (_m, semi: string) => (semi ? "; " : "")).replace(/[;\s]+$/, "").trim();
  return { ...p, name: "Prime Video", scope: `${scope ? `${scope}; ` : ""}Hindi audio confirmed on Apple TV India's listing` };
}
const D = { ...RAW, entries: RAW.entries.map((e) => ({ ...e, platforms: e.platforms.map(viaPrimeVideo) })) };
export const DUB_CHECKED = D.checked;
/** When the list was last scanned for new or changed dubs (scripts/apply-dub-check.mts). */
export const DUB_SCANNED = (D as { lastScan?: string }).lastScan ?? D.checked;
export const DUB_REVIEWED = D.reviewed;

/** How you watch on each platform; unknown names read as subscription. */
const KIND: [RegExp, PlatformKind][] = [
  [/youtube|mx player/i, "free"],
  // "Apple TV" is a streaming service, not a channel.
  [/cartoon network|sony yay|zee caf|nickelodeon|\bsonic$|pogo|hungama|disney channel|discovery kids|(?<!apple )\btv\b/i, "tv"],
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

type ScheduleRow = { t: string; slug: string | null; lang: string; service: string; status: string; weekday?: string | null; note?: string | null; url: string; sources?: string[]; premiere?: string | null };
/**
 * A Hindi dub known only from the dub schedule (data/dub-schedule.json): new simuldubs land there first (Crunchyroll
 * adds several a season), and 38 of them had no entry here (Nov 2026), so their anime pages said nothing about Hindi
 * while ChatGPT sent people to them asking exactly that. Out or finished only; announced dubs stay on /new-dubs.
 */
function fromSchedule(slug: string): Dub | null {
  const rows = (schedule as { entries: ScheduleRow[] }).entries.filter((e) => e.lang === "hi" && e.slug === slug && (e.status === "airing" || e.status === "complete"));
  if (!rows.length) return null;
  return {
    s: slug, t: rows[0].t, status: "available", confidence: "high", note: rows[0].note ?? "",
    platforms: rows.map((e) => ({ name: e.service, scope: e.status === "airing" ? `New episodes${e.weekday ? ` every ${e.weekday}` : " weekly"}` : "Hindi dub", url: e.url })),
    sources: [...new Set(rows.flatMap((e) => e.sources ?? [e.url]))],
    added: rows[0].premiere?.slice(0, 10),
  };
}

export type PendingDub = { service: string; premiere: string | null };
/**
 * A Hindi dub announced for this exact season but not out yet (data/dub-schedule.json), so a sequel's page doesn't
 * answer "Yes" from its franchise's entry: Black Clover Season 2 (201K searches in India, Oct 2026) said "Yes" because
 * Season 1 is in Hindi, while Season 2's dub was only announced.
 */
export function pendingDub(slug: string): PendingDub | null {
  const row = (schedule as { entries: ScheduleRow[] }).entries.find((e) => e.lang === "hi" && e.slug === slug && e.status === "announced");
  return row ? { service: row.service, premiere: row.premiere?.slice(0, 10) ?? null } : null;
}

/** The dub entry for an anime: its own slug, else its franchise (any part of its watch order), else the dub schedule. */
export function dubFor(anime: { id: string; slug: string }): Dub | null {
  const own = bySlug.get(anime.slug);
  if (own) return answerable(own) ? own : null;
  const found = orderSlugs(anime.id).flatMap((s) => bySlug.get(s) ?? []).filter(answerable);
  return found.find((d) => d.status === "available") ?? found[0] ?? fromSchedule(anime.slug);
}

/** The dub entry for this exact slug (or the dub schedule), ignoring the franchise. */
export function dubBySlug(slug: string): Dub | null {
  const own = bySlug.get(slug);
  return own ? (answerable(own) ? own : null) : fromSchedule(slug);
}

/** Every slug with dub research or a Hindi row in the dub schedule. */
export const dubSlugs = () => [...new Set([...D.entries.map((e) => e.s), ...(schedule as { entries: ScheduleRow[] }).entries.flatMap((e) => (e.lang === "hi" && e.slug ? [e.slug] : []))])];

/** Per-anime Hindi dub pages (/anime/<slug>/hindi-dub): every available dub has one; the most-watched are indexed. */
export const HINDI_DUB_PAGES = 30;
export const hindiDubPath = (s: string) => `/anime/${s}/hindi-dub`;
/** The available dub entry for this exact slug: the page exists only for these. */
export const dubPageEntry = (s: string): Dub | null => { const d = bySlug.get(s); return d?.status === "available" ? d : null; };
let top: Set<string> | null = null;
/**
 * Kids' shows people search in Hindi ("shinchan in hindi" 6.6K, "doraemon in hindi" 3.6K, "pokemon in hindi" 1.3K,
 * "beyblade in hindi" 2.8K a month, Keyword Planner, Nov 2026): indexed although they rank below the top 30 here.
 */
// "doraemon in hindi" means the TV series (doraemon-2005, on JioHotstar), not the Stand by Me Doraemon films, whose
// page stays up, noindexed.
const KIDS_INDEXED = ["crayon-shin-chan", "doraemon-2005", "pokemon", "beyblade-burst"];
/**
 * Same reason, other shows: "my dress up darling hindi dubbed" 210 + "…in hindi" 140, "darling in the franxx hindi"
 * 170, "dragon ball super in hindi" 1K. Then every dubbed show with at least 90 "<name> hindi dubbed" searches a month
 * (Keyword Planner, India, Nov 2026): Black Clover 1K, Tokyo Revengers 880, Solo Leveling 880, Weathering with You
 * 390, Suzume 390, Vinland Saga 320, Classroom of the Elite 320, Gintama, Spy x Family, Chainsaw Man, Blue Lock,
 * Horimiya and Lookism 210, Black Butler and Mushoku Tensei 140, Terror in Resonance, Arifureta, Detective Conan and
 * Gachiakuta 110, Rent-a-Girlfriend, Baki, Kaiju No. 8 and Wind Breaker 90. Not Ghost in the Shell: its 140 "…in
 * hindi" are most likely the 2017 film. Your Name added 23 Nov 2026: "your name hindi dubbed" 390 a month, 1,300 in
 * December 2025, and on Bing's queries ("anime hindi dub your name"). Overgeared (Kitsu: Temppal) added 23 Nov:
 * "overgeared hindi dubbed" 480 a month in Oct 2026, from nothing in August.
 */
const SEARCHED_INDEXED = [
  "sono-bisque-doll-wa-koi-wo-suru", "darling-in-the-franxx", "dragon-ball",
  "black-clover-tv", "tokyo-revengers", "solo-leveling", "tenki-no-ko-weathering-with-you", "suzume-no-tojimari", "vinland-saga",
  "youkoso-jitsuryoku-shijou-shugi-no-kyoushitsu-e-tv", "gintama", "spy-x-family", "chainsaw-man", "blue-lock", "horimiya",
  "oemojisangjuui", "black-butler", "mushoku-tensei-isekai-ittara-honki-dasu", "zankyou-no-terror",
  "arifureta-shokugyou-de-sekai-saikyou", "detective-conan", "gachiakuta", "kanojo-okarishimasu", "baki-ona", "kaijuu-8-gou",
  "wind-breaker", "kimi-no-na-wa", "temppal-item-no-chikara",
];

/**
 * Parts of a franchise people search by their own name, which its entry already covers ("naruto shippuden hindi
 * dubbed" 2.9K a month, "dragon ball super in hindi" 1K; Keyword Planner, Nov 2026; Pokémon Horizons is in Bing's queries). `title` names them on the page;
 * the answer restates the entry's own scope and its sources (Crunchyroll and Anime News Network, checked 18 Nov 2026).
 */
export const HINDI_PARTS: Record<string, { title: string; q: string; a: string }> = {
  naruto: {
    title: "Naruto & Naruto Shippuden",
    q: "Is Naruto Shippuden available in Hindi?",
    a: "Yes. Crunchyroll India has streamed Naruto Shippuden in Hindi since 6 July 2026, starting with the first 220 episodes, released in batches; Sony YAY! airs it in Hindi on TV.",
  },
  pokemon: {
    title: "Pokémon & Pokémon Horizons",
    q: "Is Pokémon Horizons available in Hindi?",
    a: "Yes, and free: Pokémon Horizons streams in Hindi on the official Pokémon Asia Hindi YouTube channel, which added the Orange Islands and Diamond & Pearl seasons from October 2025.",
  },
  "dragon-ball": {
    title: "Dragon Ball Super & Daima",
    q: "Is Dragon Ball Super available in Hindi?",
    a: "Yes. Dragon Ball Super: Beerus, the remastered edition of Dragon Ball Super, streams in Hindi on Crunchyroll, with a new episode every Thursday since 12 November 2026, four weeks behind the subtitled version. Dragon Ball Daima is on Crunchyroll in Hindi too.",
  },
};
/**
 * The part's own URL people (and AI answers) guess, "/anime/naruto-shippuden/hindi-dub", sends them to the page that
 * covers it (HINDI_PARTS), instead of a 404. Only parts the entry's own scope names.
 */
export const HINDI_PART_OF: Record<string, string> = {
  "naruto-shippuden": "naruto",
  "dragon-ball-super": "dragon-ball",
  "dragon-ball-super-beerus": "dragon-ball",
};
export const topHindiDub = (s: string) => (top ??= new Set([...hindiDubbed().slice(0, HINDI_DUB_PAGES).map((d) => d.s), ...[...KIDS_INDEXED, ...SEARCHED_INDEXED].filter((k) => dubPageEntry(k))])).has(s);

/**
 * Where a dub links to: its own Hindi dub page for the most-watched, else the watch order when the franchise has
 * several parts, else the anime page.
 */
export const dubHref = (d: Pick<Dub, "s">) => (topHindiDub(d.s) ? hindiDubPath(d.s) : (users.get(d.s)?.n ?? 1) > 1 ? `/watch-order/${d.s}` : `/anime/${d.s}`);
/** Platform page (/hindi-dub/<slug>) and price key for a dub platform name, when it has one. */
export const platformFor = (name: string) => HINDI_PLATFORMS.find((p) => p.match.test(name)) ?? null;

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
export function dubFaq(d: Dub | null, title: string, lang: "en" | "hi" = "en", pending: PendingDub | null = null): { q: string; a: string } | null {
  if (!d) return null;
  if (pending && lang === "en") return { q: `Is ${title} dubbed in Hindi?`, a: `Not yet. ${pending.service} has announced a Hindi dub of ${title}${pending.premiere ? ` from ${pendingDate(pending.premiere)}` : ", with no start date yet"} (checked ${dubDate("en")}).${d.status === "available" ? ` Earlier seasons are in Hindi on ${platformList(d, "en")}.` : ""}` };
  const yes = d.status === "available";
  return lang === "hi"
    ? { q: `क्या ${title} हिंदी डब में है?`, a: yes ? `हाँ, ${title} का आधिकारिक हिंदी डब यहाँ है: ${platformList(d, "hi")}।` : `${dubDate("hi")} तक ${title} का कोई आधिकारिक हिंदी डब नहीं मिला।` }
    : { q: `Is ${title} dubbed in Hindi?`, a: yes ? `Yes. ${title} has an official Hindi dub on ${platformList(d, "en")}.` : `No official Hindi dub has been released as of ${dubDate("en")}. ${d.note}` };
}

const pendingDate = (iso: string) => new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

/** Whether a franchise (by any of its slugs) has an official Hindi dub on record. */
export function hasHindiDub(slug: string): boolean {
  const id = snapshotId(slug);
  return dubFor({ id: id ?? "", slug })?.status === "available";
}

/** Platform pages (/hindi-dub/<slug>): the platforms people search with "hindi dubbed anime". */
export const HINDI_PLATFORMS = [
  { slug: "crunchyroll", label: "Crunchyroll", match: /^crunchyroll/i, how: "Open the episode, then pick Hindi under Audio in the settings menu (the gear icon on the web, the three dots in the app)." },
  // "muse india anime" 2.9K a month (Keyword Planner, Nov 2026): its own page, though its titles are on the YouTube one too.
  { slug: "muse-india", label: "Muse India (YouTube, free)", match: /muse/i, how: "Search \"Muse India\" on YouTube: full episodes are free with ads. Playlists can come down when a licence ends, so watch them while they're up." },
  { slug: "youtube", label: "YouTube (free)", match: /youtube/i, how: "Search the channel name on YouTube; full episodes are free with ads and stay up for months, though some playlists are removed when the licence ends." },
  { slug: "netflix", label: "Netflix India", match: /^netflix/i, how: "Open the title, start an episode, then choose Hindi under Audio & Subtitles." },
  { slug: "prime-video", label: "Prime Video (Anime Times)", match: /^(?!.*mx player).*(prime video|anime times)/i, how: "Titles listed as Prime Video play with a Prime membership; titles listed as Anime Times need that paid channel inside Prime Video India. Start an episode, then pick Hindi in the audio menu." },
  { slug: "jiohotstar", label: "JioHotstar", match: /hotstar/i, how: "Open the series and choose Hindi in the language menu before you press play." },
  // Amazon folded MX Player into Prime Video in India (announced May 2026): its free shows moved to Prime Video's free
  // tier. The slug and "MX Player" stay, since that's what people search for.
  { slug: "mx-player", label: "MX Player (now Prime Video free)", match: /mx player/i, how: "Free with ads and no Prime membership needed: MX Player's shows are now on Prime Video's free tier (Amazon folded MX Player into Prime Video in 2026). On Android the MX Player app still works; on iPhone, TV and the web it opens Prime Video. The Hindi version is usually listed as its own show." },
  // "sony yay anime" 1.6K and "sony yay naruto" 880 a month (Keyword Planner, Nov 2026).
  { slug: "sony-yay", label: "Sony YAY!", match: /sony yay/i, how: "A kids' TV channel with a Hindi audio feed: check its schedule on your DTH or cable guide. It isn't a streaming app; for on-demand Hindi episodes, see the other platforms on the Hindi dub list." },
  { slug: "cartoon-network", label: "Cartoon Network India", match: /cartoon network/i, how: "A TV channel: check its schedule; some shows also stream on JioHotstar." },
  // Kids' channels people search with "anime" ("hungama tv anime", "disney channel india anime", "nickelodeon anime
  // hindi"): their pages are the channel pages of /hindi-dub/kids-tv (lib/kidstv.ts), with or without dub rows here.
  { slug: "hungama", label: "Hungama TV", match: /^hungama/i, how: "A kids' TV channel with a Hindi feed, sold in DTH and cable packs: check its schedule in your operator's guide. It isn't a streaming app; for on-demand Hindi episodes, see where each show streams below." },
  { slug: "disney-channel", label: "Disney Channel India", match: /disney channel/i, how: "A kids' TV channel with a Hindi feed, sold in DTH and cable packs: check its schedule in your operator's guide. Doraemon also streams in Hindi on JioHotstar." },
  { slug: "nickelodeon", label: "Nickelodeon India (Nick)", match: /^(nickelodeon|nick|sonic)\b/i, how: "Nick and its sister channel Sonic are kids' TV channels with Hindi feeds, sold in DTH and cable packs: check their schedules in your operator's guide." },
] as const;
export type HindiPlatform = (typeof HINDI_PLATFORMS)[number];
export const hindiPlatform = (slug: string) => HINDI_PLATFORMS.find((p) => p.slug === slug) ?? null;

/** Every dub on a platform page, most-watched first, with that platform's rows. */
export function dubsOn(p: HindiPlatform): { d: Dub; rows: DubPlatform[] }[] {
  return hindiDubbed().flatMap((d) => { const rows = d.platforms.filter((x) => p.match.test(x.name)); return rows.length ? [{ d, rows }] : []; });
}
