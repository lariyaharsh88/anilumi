"use client";
import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "@/components/Link";

export type RandomItem = { slug: string; title: string; poster: string | null; genres: string[]; eps: number | null; movie: boolean; year: number | null; score: number | null; themes: string[]; hindi: boolean };

const LENGTHS = { any: "Any length", movie: "Movie", short: "Up to 13 episodes", medium: "14–26 episodes", long: "27+ episodes" } as const;
type Len = keyof typeof LENGTHS;
const fits = (x: RandomItem, len: Len) =>
  len === "any" || (len === "movie" ? x.movie : !x.movie && x.eps !== null && (len === "short" ? x.eps <= 13 : len === "medium" ? x.eps > 13 && x.eps <= 26 : x.eps > 26));

/** Filters plus a "pick one" button over the most-followed anime; every pick says why it's worth a try. */
export default function RandomPicker({ items, genres }: { items: RandomItem[]; genres: string[] }) {
  const [genre, setGenre] = useState("");
  const [len, setLen] = useState<Len>("any");
  const [min, setMin] = useState(0);
  const [hindi, setHindi] = useState(false);
  const [pick, setPick] = useState<RandomItem | null>(null);
  const pool = useMemo(() => items.filter((x) => (!genre || x.genres.includes(genre)) && fits(x, len) && (x.score ?? 0) >= min && (!hindi || x.hindi)), [items, genre, len, min, hindi]);
  const roll = () => {
    if (!pool.length) { setPick(null); return; }
    let next = pool[Math.floor(Math.random() * pool.length)];
    if (pool.length > 1 && next.slug === pick?.slug) next = pool[(pool.indexOf(next) + 1) % pool.length];
    setPick(next);
  };
  const sel = "rounded-xl border border-line bg-white/[.04] px-3 py-2 text-sm text-ink focus:border-violet focus:outline-none";

  return (
    <div className="card p-4 sm:p-5">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="grid gap-1 text-xs text-muted">Genre
          <select id="rnd-genre" className={sel} value={genre} onChange={(e) => setGenre(e.target.value)}>
            <option value="">Any genre</option>
            {genres.map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-muted">Length
          <select id="rnd-len" className={sel} value={len} onChange={(e) => setLen(e.target.value as Len)}>
            {Object.entries(LENGTHS).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-muted">Minimum score
          <select id="rnd-min" className={sel} value={min} onChange={(e) => setMin(Number(e.target.value))}>
            {[0, 7, 7.5, 8, 8.5].map((m) => <option key={m} value={m}>{m ? `${m}+ on AniList` : "Any score"}</option>)}
          </select>
        </label>
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink">
          <input id="rnd-hindi" type="checkbox" checked={hindi} onChange={(e) => setHindi(e.target.checked)} className="h-4 w-4 accent-violet" /> Has a Hindi dub
        </label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={roll} disabled={!pool.length} className="btn-primary px-5 py-2.5 font-semibold disabled:opacity-50">🎲 {pick ? "Pick another" : "Pick a random anime"}</button>
        <span className="text-sm text-muted" role="status">{pool.length ? `${pool.length} anime match` : "Nothing matches; loosen a filter."}</span>
      </div>
      {pick && (
        <div className="mt-5 flex gap-4 rounded-2xl border border-violet/40 bg-violet/[.06] p-4" aria-live="polite">
          {pick.poster && <Image src={pick.poster} alt="" width={96} height={144} className="h-36 w-24 shrink-0 rounded-lg object-cover" />}
          <div className="min-w-0">
            <Link href={`/anime/${pick.slug}`} className="text-lg font-bold text-ink hover:text-violet-2">{pick.title}</Link>
            <p className="text-sm text-muted">{[pick.movie ? "Movie" : pick.eps ? `${pick.eps} episodes` : null, pick.year, pick.score ? `${pick.score.toFixed(1)}/10 on AniList` : null, pick.hindi ? "🇮🇳 Hindi dub" : null].filter(Boolean).join(" · ")}</p>
            <p className="mt-2 text-sm text-ink/85">{pick.genres.slice(0, 3).join(", ")}{pick.themes.length ? `. Themes: ${pick.themes.join(", ")}.` : "."}</p>
            <p className="mt-3 flex flex-wrap gap-2 text-sm">
              <Link href={`/anime/${pick.slug}`} className="chip">About it</Link>
              <Link href={`/anime/${pick.slug}#watch`} className="chip">Where to watch</Link>
              <Link href={`/similar/${pick.slug}`} className="chip">More like this</Link>
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
