"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "@/components/Link";

export type RandomItem = { slug: string; title: string; poster: string | null; genres: string[]; eps: number | null; movie: boolean; year: number | null; score: number | null; themes: string[]; hindi: boolean; watched: boolean };

const LENGTHS = { any: "Any length", movie: "Movie", short: "Up to 13 episodes", medium: "14–26 episodes", long: "27+ episodes" } as const;
type Len = keyof typeof LENGTHS;
const fits = (x: RandomItem, len: Len) =>
  len === "any" || (len === "movie" ? x.movie : !x.movie && x.eps !== null && (len === "short" ? x.eps <= 13 : len === "medium" ? x.eps > 13 && x.eps <= 26 : x.eps > 26));

/** Moods as genre sets (any of them matches); "cozy" also keeps it short. */
const MOODS = [
  { k: "", label: "Any mood", genres: [] as string[] },
  { k: "feelgood", label: "😊 Feel-good", genres: ["Comedy", "Slice of Life"] },
  { k: "sad", label: "😢 Something sad", genres: ["Drama"] },
  { k: "hype", label: "🔥 Hype action", genres: ["Action"] },
  { k: "mind", label: "🧠 Mind-bending", genres: ["Psychological", "Mystery", "Thriller"] },
  { k: "love", label: "💕 Romance", genres: ["Romance"] },
  { k: "scary", label: "👻 Scary", genres: ["Horror"] },
  { k: "cozy", label: "☕ Cozy & short", genres: ["Slice of Life"], short: true },
];

/** One pick: what it is, why, and where to go next. */
function PickCard({ pick }: { pick: RandomItem }) {
  return (
    <div className="flex gap-4 rounded-2xl border border-violet/40 bg-violet/[.06] p-4">
      {pick.poster && <Image src={pick.poster} alt={`${pick.title} poster`} width={96} height={144} className="h-36 w-24 shrink-0 rounded-lg object-cover" />}
      <div className="min-w-0">
        <Link href={`/anime/${pick.slug}`} className="text-lg font-bold text-ink hover:text-violet-2">{pick.title}</Link>
        <p className="text-sm text-muted">{[pick.movie ? "Movie" : pick.eps ? `${pick.eps} episodes` : null, pick.year, pick.score ? `${pick.score.toFixed(1)}/10 on AniList` : null, pick.hindi ? "🇮🇳 Hindi dub" : null, pick.watched ? "✓ Harsh has watched it" : null].filter(Boolean).join(" · ")}</p>
        <p className="mt-2 text-sm text-ink/85">{pick.genres.slice(0, 3).join(", ")}{pick.themes.length ? `. Themes: ${pick.themes.join(", ")}.` : "."}</p>
        <p className="mt-3 flex flex-wrap gap-2 text-sm">
          <Link href={`/anime/${pick.slug}`} className="chip">About it</Link>
          <Link href={`/anime/${pick.slug}#watch`} className="chip">Where to watch</Link>
          <Link href={`/similar/${pick.slug}`} className="chip">More like this</Link>
        </p>
      </div>
    </div>
  );
}

/** Filters plus a "pick one" button over the most-followed anime; every pick says why it's worth a try. */
export default function RandomPicker({ items, genres }: { items: RandomItem[]; genres: string[] }) {
  const [genre, setGenre] = useState("");
  const [len, setLen] = useState<Len>("any");
  const [min, setMin] = useState(0);
  const [hindi, setHindi] = useState(false);
  const [mine, setMine] = useState(false);
  const [mood, setMood] = useState("");
  const [picks, setPicks] = useState<RandomItem[]>([]);
  const [note, setNote] = useState("");
  const moodDef = MOODS.find((m) => m.k === mood) ?? MOODS[0];
  const pool = useMemo(() => items.filter((x) => (!genre || x.genres.includes(genre)) && (!moodDef.genres.length || moodDef.genres.some((g) => x.genres.includes(g))) && fits(x, moodDef.short && len === "any" ? "short" : len) && (x.score ?? 0) >= min && (!hindi || x.hindi) && (!mine || x.watched)), [items, genre, moodDef, len, min, hindi, mine]);
  // A shared link (?pick=<slug>) opens on that pick.
  useEffect(() => {
    const slug = new URLSearchParams(window.location.search).get("pick");
    const hit = slug ? items.find((x) => x.slug === slug) : null;
    if (hit) setPicks([hit]);
  }, [items]);
  const roll = (n: number) => {
    setNote("");
    if (!pool.length) { setPicks([]); return; }
    const last = new Set(picks.map((p) => p.slug));
    const fresh = pool.filter((x) => !last.has(x.slug));
    const from = [...(fresh.length >= n ? fresh : pool)];
    const out: RandomItem[] = [];
    while (out.length < n && from.length) out.push(from.splice(Math.floor(Math.random() * from.length), 1)[0]);
    setPicks(out);
  };
  const share = async () => {
    if (!picks[0]) return;
    const url = `${window.location.origin}/random-anime-generator?pick=${picks[0].slug}`;
    try {
      if (navigator.share) await navigator.share({ title: `Watch ${picks[0].title}`, text: `The random anime generator picked ${picks[0].title} for me.`, url });
      else { await navigator.clipboard.writeText(url); setNote("Link copied"); }
    } catch { /* the viewer closed the share sheet */ }
  };
  const sel = "rounded-xl border border-line bg-white/[.04] px-3 py-2 text-sm text-ink focus:border-violet focus:outline-none";

  return (
    <div className="card p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap gap-2" role="group" aria-label="Mood">
        {MOODS.map((m) => <button key={m.k} type="button" onClick={() => setMood(m.k)} aria-pressed={mood === m.k} className={`chip ${mood === m.k ? "chip-active" : ""}`}>{m.label}</button>)}
      </div>
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
        <label className="flex items-center gap-2 self-end pb-2 text-sm text-ink">
          <input id="rnd-mine" type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} className="h-4 w-4 accent-violet" /> Only ones Harsh has watched
        </label>
      </div>
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <button type="button" onClick={() => roll(1)} disabled={!pool.length} className="btn-primary px-5 py-2.5 font-semibold disabled:opacity-50">🎲 {picks.length ? "Pick another" : "Pick a random anime"}</button>
        <button type="button" onClick={() => roll(3)} disabled={pool.length < 3} className="btn-outline px-4 py-2.5 disabled:opacity-50">Pick 3</button>
        {picks.length > 0 && <button type="button" onClick={share} className="chip">{note || "📤 Share"}</button>}
        <span className="text-sm text-muted" role="status">{pool.length ? `${pool.length} anime match` : "Nothing matches; loosen a filter."}</span>
      </div>
      {picks.length > 0 && <div className="mt-5 grid gap-3" aria-live="polite">{picks.map((p) => <PickCard key={p.slug} pick={p} />)}</div>}
    </div>
  );
}
