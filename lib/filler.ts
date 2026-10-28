import { FILLER, CONTINUE, type FillerEntry, type ContinueEntry } from "@/data/filler";
import malData from "@/data/filler-mal.json";

/** One show in data/filler-mal.json, written monthly by scripts/build-filler-mal.mts from MyAnimeList's episode flags (via Jikan). */
export type MalFiller = { mal: number; title: string; episodes: number; filler: string; recap?: string; fetched: string };
const MAL = malData as Record<string, MalFiller>;

/** Hand-checked lists win; MAL flags fill in the rest. Pure given its inputs. */
export function mergeFiller(curated: Record<string, FillerEntry>, mal: Record<string, MalFiller>): Record<string, FillerEntry> {
  const out: Record<string, FillerEntry> = {};
  for (const [slug, m] of Object.entries(mal)) {
    if (!m.filler && !m.recap) continue; // a show with no flagged episodes needs no filler page
    out[slug] = { filler: m.filler, recap: m.recap, reviewed: false, checked: `MyAnimeList episode flags, ${m.fetched}`, source: "mal" };
  }
  return { ...out, ...curated };
}
const ALL = mergeFiller(FILLER, MAL);

/** "26, 97, 101-106" → Set {26, 97, 101..106}. Pure. */
export function parseRanges(spec: string | undefined): Set<number> {
  const out = new Set<number>();
  for (const part of (spec || "").split(",").map((x) => x.trim()).filter(Boolean)) {
    const m = part.match(/^(\d+)(?:\s*-\s*(\d+))?$/);
    if (!m) continue;
    const a = Number(m[1]), b = m[2] ? Number(m[2]) : a;
    for (let n = Math.min(a, b); n <= Math.max(a, b); n++) out.add(n);
  }
  return out;
}

/** Compress a set back to "1-3, 7" form for display. Pure. */
export function formatRanges(nums: Iterable<number>): string {
  const xs = [...nums].sort((a, b) => a - b);
  const out: string[] = [];
  for (let i = 0; i < xs.length; i++) {
    let j = i;
    while (j + 1 < xs.length && xs[j + 1] === xs[j] + 1) j++;
    out.push(i === j ? `${xs[i]}` : `${xs[i]}–${xs[j]}`);
    i = j;
  }
  return out.join(", ");
}

export type FillerInfo = { entry: FillerEntry; filler: Set<number>; mixed: Set<number>; recap: Set<number>; animeCanon: Set<number>; total: number; count: number; share: number; nextCanon: (n: number) => number | null };
export type EpisodeKind = "canon" | "mixed" | "filler" | "recap" | "anime-canon";

/** Filler info for a series, limited to episodes that exist (total = episode count or last aired). */
export function fillerFor(slug: string, total: number | null): FillerInfo | null {
  const entry = ALL[slug];
  if (!entry) return null;
  const all = parseRanges(entry.filler), recaps = parseRanges(entry.recap);
  const cap = total && total > 0 ? total : Math.max(0, ...all, ...recaps);
  const within = (s: Set<number>) => new Set([...s].filter((n) => n <= cap));
  const filler = within(all), recap = within(recaps);
  const mixed = within(parseRanges(entry.mixed)), animeCanon = within(parseRanges(entry.animeCanon));
  const nextCanon = (n: number) => { for (let k = n + 1; k <= cap; k++) if (!filler.has(k) && !recap.has(k)) return k; return null; };
  return { entry, filler, mixed, recap, animeCanon, total: cap, count: filler.size, share: cap ? (filler.size / cap) * 100 : 0, nextCanon };
}

export function episodeKind(f: FillerInfo, n: number): EpisodeKind {
  if (f.filler.has(n)) return "filler";
  if (f.recap.has(n)) return "recap";
  if (f.mixed.has(n)) return "mixed";
  if (f.animeCanon.has(n)) return "anime-canon";
  return "canon";
}

/** Consecutive runs of the same kind, for the arc-by-arc list. Pure. */
export function kindRuns(f: FillerInfo): { kind: EpisodeKind; from: number; to: number }[] {
  const out: { kind: EpisodeKind; from: number; to: number }[] = [];
  for (let n = 1; n <= f.total; n++) {
    const kind = episodeKind(f, n), last = out[out.length - 1];
    if (last && last.kind === kind) last.to = n;
    else out.push({ kind, from: n, to: n });
  }
  return out;
}

/** Badge text for an entry: hand-checked, generated from MAL, or still a draft. */
export function fillerSource(e: FillerEntry): { label: string; tone: "ok" | "draft" } {
  if (e.reviewed) return { label: "Reviewed", tone: "ok" };
  if (e.source === "mal") return { label: "From MyAnimeList", tone: "ok" };
  if (e.checked) return { label: "Cross-checked", tone: "ok" };
  return { label: "Draft · being verified", tone: "draft" };
}

export const fillerSlugs = (): string[] => Object.keys(ALL);
export const continuationFor = (slug: string): ContinueEntry | null => CONTINUE[slug] ?? null;
/** "chapter 39" / "volume 14": where to pick the source up. Pure. */
export const startAt = (c: ContinueEntry): string => (c.chapter ? `chapter ${c.chapter}` : `volume ${c.volume}`);
export const continuationSlugs = (): string[] => Object.keys(CONTINUE);
