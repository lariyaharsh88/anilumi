/**
 * Kids' TV channels that air anime in Hindi (data/kids-tv.json): which channel shows which anime, since when, and the
 * latest dated report of it on air. A show is listed only when a dated news report, trade-press article or the
 * channel's own page confirms it; schedules are never guessed. Channels with `page` get /hindi-dub/<slug> (the same
 * URL as their Hindi dub platform page); sister channels (`parent`) show as a section on their parent's page. Pure.
 */
import data from "@/data/kids-tv.json";
import { dubBySlug, dubHref, platformKind, type Dub } from "./hindidub";
import { filmsPath } from "./franchisefilms";

export type KidsShowRow = { show: string; since: string | null; lastSeen?: string | null; note: string; sources: string[] };
export type KidsChannel = { slug: string; name: string; owner: string; mrp?: number; page?: boolean; parent?: string; summary: string; sources: string[]; shows: KidsShowRow[] };
export type KidsShow = { id: string; t: string; dub?: string; films?: string };

const D = data as unknown as { checked: string; mrp: { asOf: string; source: string; note: string }; shows: Record<string, Omit<KidsShow, "id">>; channels: KidsChannel[] };
export const KIDS_TV_CHECKED = D.checked;
/** TRAI's list of pay-channel prices (MRP a month, before taxes) that the channels' `mrp` comes from. */
export const KIDS_TV_MRP = D.mrp;
export const KIDS_TV_PATH = "/hindi-dub/kids-tv";

export const kidsChannels = (): KidsChannel[] => D.channels;
/** Channels with their own page, in the order of the data file (busiest first). */
export const kidsPageChannels = () => D.channels.filter((c) => c.page);
export const kidsChannel = (slug: string): KidsChannel | null => D.channels.find((c) => c.slug === slug) ?? null;
/** A channel page's sister channels (Super Hungama on Hungama's page). */
export const sisterChannels = (slug: string) => D.channels.filter((c) => c.parent === slug);
/** Where a channel is covered: its own page, or a section on its parent's page. */
export const channelHref = (c: KidsChannel) => (c.page ? `/hindi-dub/${c.slug}` : c.parent ? `/hindi-dub/${c.parent}#${c.slug}` : `${KIDS_TV_PATH}#${c.slug}`);

export const kidsShow = (id: string): KidsShow => {
  const s = D.shows[id];
  if (!s) throw new Error(`kids-tv.json: unknown show ${id}`);
  return { id, ...s };
};
/** The show's Hindi dub entry (data/hindi-dubs.json), when we have one. */
export const showDub = (s: KidsShow): Dub | null => (s.dub ? dubBySlug(s.dub) : null);
/** Where the show's name links: its Hindi dub page (or watch order) when we have the dub, else nowhere. */
export const showHref = (s: KidsShow) => { const d = showDub(s); return d?.status === "available" ? dubHref(d) : null; };
export const showFilmsHref = (s: KidsShow) => (s.films ? filmsPath(s.films) : null);
/** Official places that stream it in Hindi now (not TV channels), from the Hindi dub list. */
export const streamsNow = (s: KidsShow) => { const d = showDub(s); return d?.status === "available" ? d.platforms.filter((p) => platformKind(p.name) !== "tv") : []; };

const monthsBetween = (a: string, b: string) => (Number(b.slice(0, 4)) - Number(a.slice(0, 4))) * 12 + Number(b.slice(5, 7)) - Number(a.slice(5, 7));
/** Reported on air within three months of the check: said as "on air" (still "as of" that month). */
export const recentlyOnAir = (r: KidsShowRow, checked = KIDS_TV_CHECKED) => Boolean(r.lastSeen && monthsBetween(r.lastSeen, checked) <= 3);
export const monthLabel = (ym: string) => new Date(`${ym}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", year: "numeric", timeZone: "UTC" });
/** The "Still airing?" cell: yes only for a recent report, else the last dated report, else not confirmed. */
export const airingLabel = (r: KidsShowRow, checked = KIDS_TV_CHECKED) =>
  recentlyOnAir(r, checked) ? `Yes, as of ${monthLabel(r.lastSeen!)}` : r.lastSeen ? `Last reported ${monthLabel(r.lastSeen)}` : "Not confirmed";

/** Rows of a channel, most recently reported first (then the longest-running). */
export const channelRows = (c: KidsChannel) => [...c.shows].sort((a, b) => (b.lastSeen ?? "").localeCompare(a.lastSeen ?? "") || (a.since ?? "9").localeCompare(b.since ?? "9"));

/** Every show with the channels that air or aired it: the "which channel shows X in Hindi?" index, most channels first. */
export function showIndex(): { s: KidsShow; on: { c: KidsChannel; r: KidsShowRow }[] }[] {
  const m = new Map<string, { c: KidsChannel; r: KidsShowRow }[]>();
  for (const c of D.channels) for (const r of c.shows) m.set(r.show, [...(m.get(r.show) ?? []), { c, r }]);
  const order = Object.keys(D.shows);
  return [...m].map(([id, on]) => ({ s: kidsShow(id), on: on.sort((a, b) => (b.r.lastSeen ?? "").localeCompare(a.r.lastSeen ?? "")) }))
    .sort((a, b) => b.on.length - a.on.length || order.indexOf(a.s.id) - order.indexOf(b.s.id));
}

/** "A, B and C". */
export const andList = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} and ${xs[xs.length - 1]}`);
/** A channel's shows, its sisters' included, deduplicated by show. */
export const channelShowIds = (c: KidsChannel) => [...new Set([c, ...sisterChannels(c.slug)].flatMap((x) => x.shows.map((r) => r.show)))];
