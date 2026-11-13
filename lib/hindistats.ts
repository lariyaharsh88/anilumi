/**
 * Numbers for the Hindi dub hub's charts: how many of the popular anime we checked have a Hindi dub, where they
 * stream (by platform and by free / subscription / TV), and how many places each one is on. Pure given the data.
 */
import { hindiDubbed, notDubbed, byPlatform, platformKind, type Dub, type PlatformKind } from "./hindidub";
import { dubShows, premiereAt, DUBS_CHECKED, type DubShow } from "./dubschedule";
import { hindiArtists, hindiArtistPath, characterPageForHindiRole } from "./hindivoices";

/** The cheapest way to watch a dub: free anywhere beats subscription, which beats TV only. */
export function cheapestKind(d: Dub): PlatformKind {
  const k = new Set(d.platforms.map((p) => platformKind(p.name)));
  return k.has("free") ? "free" : k.has("subscription") ? "subscription" : "tv";
}

export function dubStats(top = 9) {
  const dubbed = hindiDubbed(), none = notDubbed();
  const access: Record<PlatformKind, number> = { free: 0, subscription: 0, tv: 0 };
  for (const d of dubbed) access[cheapestKind(d)]++;
  const places = (d: Dub) => new Set(d.platforms.map((p) => p.name)).size;
  const spread = [1, 2, 3, 4].map((n) => ({ label: n === 4 ? "4+" : String(n), value: dubbed.filter((d) => (n === 4 ? places(d) >= 4 : places(d) === n)).length }));
  const all = byPlatform().map((p) => ({ name: p.name, kind: p.kind, count: p.titles.length }));
  const rest = all.slice(top);
  return {
    dubbed: dubbed.length, none: none.length, checked: dubbed.length + none.length,
    share: Math.round((dubbed.length / Math.max(1, dubbed.length + none.length)) * 100),
    access, spread, multi: dubbed.filter((d) => places(d) >= 2).length, platformCount: all.length,
    platforms: all.slice(0, top), other: rest.length ? { names: rest.map((p) => p.name), count: rest.reduce((n, p) => n + p.count, 0) } : null,
  };
}

/** Broad genres worth charting (Kitsu's category titles), in the order ties are shown. */
export const BROAD_GENRES = ["Action", "Adventure", "Comedy", "Fantasy", "Drama", "Romance", "Science Fiction", "Supernatural", "Mystery", "Sports", "Slice of Life", "Horror", "Psychological", "Thriller"];

export function genreCounts(cats: string[][], top = 8) {
  const n = new Map<string, number>();
  for (const list of cats) for (const g of new Set(list)) if (BROAD_GENRES.includes(g)) n.set(g, (n.get(g) ?? 0) + 1);
  return [...n].sort((a, b) => b[1] - a[1] || BROAD_GENRES.indexOf(a[0]) - BROAD_GENRES.indexOf(b[0])).slice(0, top).map(([label, value]) => ({ label, value }));
}

export function eraCounts(years: (number | null)[]) {
  const bins = [["Before 2000", 0, 1999], ["2000s", 2000, 2009], ["2010s", 2010, 2019], ["2020s", 2020, 2099]] as const;
  return bins.map(([label, lo, hi]) => ({ label, value: years.filter((y) => y != null && y >= lo && y <= hi).length }));
}

const DAY = 86_400_000;

/** Hindi dubs that started in the `days` before the dub schedule was last checked, newest first. */
export function hindiArrivals(days = 75): DubShow[] {
  const ref = Date.parse(`${DUBS_CHECKED}T00:00:00Z`);
  const seen = new Set<string>();
  return dubShows()
    .filter((e) => e.lang === "hi" && e.status !== "announced" && premiereAt(e) >= ref - days * DAY && premiereAt(e) <= ref + 7 * DAY)
    .sort((a, b) => premiereAt(b) - premiereAt(a))
    .filter((e) => { const k = `${e.slug ?? e.t}|${e.service}`; return !seen.has(k) && Boolean(seen.add(k)); });
}

/** Announced Hindi dubs, dated ones first. */
export const hindiComing = (): DubShow[] =>
  dubShows().filter((e) => e.lang === "hi" && e.status === "announced").sort((a, b) => (premiereAt(a) || Infinity) - (premiereAt(b) || Infinity));

export type CastLine = { character: string; characterHref: string | null; artist: string; artistHref: string; dub: string };

/** The credited Hindi voice cast of a franchise (data/hindi-voice-artists.json), lead roles first as listed. */
export function hindiCast(slug: string): CastLine[] {
  const out: CastLine[] = [];
  for (const a of hindiArtists()) for (const r of a.roles.filter((x) => x.slug === slug)) {
    // One line per role: the same voice in several dubs (Goku in Z, Kai and Super; "Son Goku" and "Goku") is merged.
    const name = r.character.toLowerCase();
    const same = out.find((o) => o.artist === a.name && (o.character.toLowerCase().includes(name) || name.includes(o.character.toLowerCase())));
    if (same) continue;
    out.push({ character: r.character, characterHref: characterPageForHindiRole(a.name, r.character), artist: a.name, artistHref: hindiArtistPath(a), dub: r.dub });
  }
  // Characters with their own page (the leads, as a rule) first; otherwise as credited.
  return out.sort((x, y) => Number(Boolean(y.characterHref)) - Number(Boolean(x.characterHref)));
}

/** Franchises with the most credited Hindi voices, for the hub's cast section. */
export function castShows(n = 8): { d: Dub; cast: CastLine[] }[] {
  return hindiDubbed().map((d) => ({ d, cast: hindiCast(d.s) })).filter((x) => x.cast.length >= 2).sort((a, b) => b.cast.length - a.cast.length).slice(0, n);
}
