"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import Link from "@/components/Link";
import { track } from "@/lib/track";
/* eslint-disable @next/next/no-img-element -- tiny AniList thumbnails: plain <img> avoids an image-optimisation request per guess */
import { ATTR_LABEL, MAX_GUESSES, attrsFor, charImage, charPage, compare, dailyPick, istDay, msToNextDay, shareText, suggest, type Cell, type GChar, type GuessMode } from "@/lib/guessgame-core";

type Saved = { day: number; guesses: number[] };
type Stats = { played: number; wins: number; streak: number; max: number; lastDay: number | null };
const NO_STATS: Stats = { played: 0, wins: 0, streak: 0, max: 0, lastDay: null };
const read = <T,>(k: string, fallback: T): T => { try { const v = localStorage.getItem(k); return v ? (JSON.parse(v) as T) : fallback; } catch { return fallback; } };
const write = (k: string, v: unknown) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch { /* private mode: progress just isn't kept */ } };
const CELL: Record<Cell["s"], string> = { hit: "bg-emerald-500/85 text-white", near: "bg-amber-500/85 text-white", miss: "bg-rose-500/70 text-white", unknown: "bg-white/10 text-muted" };
const hms = (ms: number) => { const s = Math.max(0, Math.floor(ms / 1000)); return [Math.floor(s / 3600), Math.floor((s % 3600) / 60), s % 60].map((n) => String(n).padStart(2, "0")).join(":"); };

/**
 * The game: guess today's character (same for everyone in a mode, reset at midnight IST). Each guess shows how its
 * attributes compare with the answer. Today's answer is worked out here in the browser, never in the page HTML.
 */
export default function GuessGame({ mode, pool, title, url, fallbackHref }: { mode: GuessMode; pool: GChar[]; title: string; url: string; fallbackHref: string }) {
  const attrs = attrsFor(mode);
  const byId = useMemo(() => new Map(pool.map((c) => [c.id, c])), [pool]);
  const [day, setDay] = useState<number | null>(null);
  const [guesses, setGuesses] = useState<number[]>([]);
  const [stats, setStats] = useState<Stats>(NO_STATS);
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const [left, setLeft] = useState(0);
  const [copied, setCopied] = useState(false);
  const input = useRef<HTMLInputElement>(null);
  const KEY = `anilumi-guess:${mode}`;
  const SKEY = `anilumi-guess-stats:${mode}`;

  // After hydration: the day and saved progress only exist in the browser.
  useEffect(() => {
    const d = istDay();
    setDay(d);
    const saved = read<Saved | null>(KEY, null);
    if (saved?.day === d) setGuesses(saved.guesses.filter((id) => byId.has(id)));
    setStats(read(SKEY, NO_STATS));
  }, [KEY, SKEY, byId]);

  const answer = day === null || !pool.length ? null : dailyPick(pool, mode, day);
  const rows = useMemo(() => (answer ? guesses.flatMap((id) => { const g = byId.get(id); return g ? [{ g, cells: compare(g, answer, attrs) }] : []; }) : []), [guesses, answer, byId, attrs]);
  const won = !!answer && guesses.includes(answer.id);
  const done = won || guesses.length >= MAX_GUESSES;
  const hits = useMemo(() => suggest(pool, q, new Set(guesses)), [pool, q, guesses]);

  useEffect(() => {
    if (!done) return;
    setLeft(msToNextDay());
    const t = setInterval(() => { const ms = msToNextDay(); setLeft(ms); if (ms <= 1000) window.location.reload(); }, 1000);
    return () => clearInterval(t);
  }, [done]);

  function guess(c: GChar) {
    if (!answer || done || day === null) return;
    const next = [...guesses, c.id];
    setGuesses(next);
    setQ("");
    setActive(0);
    write(KEY, { day, guesses: next } satisfies Saved);
    if (next.length === 1) track("game_start", { mode });
    const isWin = c.id === answer.id;
    if (isWin || next.length >= MAX_GUESSES) {
      const prev = read(SKEY, NO_STATS);
      if (prev.lastDay !== day) {
        const streak = isWin ? (prev.lastDay === day - 1 ? prev.streak + 1 : 1) : 0;
        const s: Stats = { played: prev.played + 1, wins: prev.wins + (isWin ? 1 : 0), streak, max: Math.max(prev.max, streak), lastDay: day };
        write(SKEY, s);
        setStats(s);
      }
      if (isWin) track("game_win", { mode, guesses: next.length });
    } else input.current?.focus();
  }

  async function share() {
    if (!answer || day === null) return;
    const text = shareText(title, day, rows.map((r) => r.cells), won, url);
    track("game_share", { mode });
    try {
      if (navigator.share && /Mobi|Android/i.test(navigator.userAgent)) { await navigator.share({ text }); return; }
      await navigator.clipboard.writeText(text);
    } catch {
      const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); } catch { /* nothing more to try */ }
      ta.remove();
    }
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  }

  if (day === null || !answer) return <div className="card grid min-h-40 place-items-center p-6 text-sm text-muted">Loading today&apos;s character…</div>;

  return (
    <div className="space-y-4">
      {!done && (
        <div className="card relative p-4">
          <label htmlFor="guess-input" className="text-sm font-semibold text-ink">Guess {guesses.length + 1} of {MAX_GUESSES}: type a character&apos;s name</label>
          <input
            ref={input} id="guess-input" value={q} autoComplete="off" spellCheck={false} placeholder={`e.g. ${pool.slice(0, 3).map((c) => c.n.split(" ")[0]).join(", ")}…`} className="input mt-2 w-full"
            role="combobox" aria-expanded={hits.length > 0} aria-controls="guess-list" aria-autocomplete="list"
            onChange={(e) => { setQ(e.target.value); setActive(0); }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(a + 1, hits.length - 1)); }
              else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(a - 1, 0)); }
              else if (e.key === "Enter" && hits[active]) { e.preventDefault(); guess(hits[active]); }
            }}
          />
          {hits.length > 0 && (
            <ul id="guess-list" role="listbox" className="absolute inset-x-4 z-20 mt-1 max-h-72 overflow-y-auto rounded-xl border border-line bg-bg-2 shadow-xl">
              {hits.map((c, i) => (
                <li key={c.id} role="option" aria-selected={i === active}>
                  <button type="button" onMouseDown={(e) => e.preventDefault()} onClick={() => guess(c)} className={`flex w-full items-center gap-3 px-3 py-2 text-left text-sm ${i === active ? "bg-white/10" : "hover:bg-white/5"}`}>
                    {charImage(c) && <img src={charImage(c)!} alt="" width={28} height={40} loading="lazy" className="h-10 w-7 shrink-0 rounded object-cover" />}
                    <span className="min-w-0"><span className="block truncate font-medium text-ink">{c.n}</span>{c.t && <span className="block truncate text-xs text-muted">{c.t}</span>}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      {rows.length > 0 && (
        <div className="card overflow-x-auto p-3">
          <table className="w-full min-w-[560px] border-separate border-spacing-1 text-center text-xs">
            <thead><tr><th className="px-1 py-1 text-left font-semibold text-muted">Character</th>{attrs.map((a) => <th key={a} className="px-1 py-1 font-semibold text-muted">{ATTR_LABEL[a]}</th>)}</tr></thead>
            <tbody>
              {[...rows].reverse().map(({ g, cells }) => (
                <tr key={g.id}>
                  <td className="w-36 py-1 pr-1 text-left"><span className="flex items-center gap-2">{charImage(g) && <img src={charImage(g)!} alt="" width={28} height={40} loading="lazy" className="h-10 w-7 shrink-0 rounded object-cover" />}<span className="line-clamp-2 font-medium text-ink">{g.n}</span></span></td>
                  {cells.map((c) => (
                    <td key={c.k} className={`h-12 rounded-lg px-1 font-semibold ${CELL[c.s]}`} title={c.s === "unknown" ? "Not known for one of the two" : undefined}>
                      <span className="line-clamp-2 leading-tight">{c.v}{c.dir && <span aria-label={c.dir === "up" ? "answer is higher" : "answer is lower"}> {c.dir === "up" ? "↑" : "↓"}</span>}</span>
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-2 px-1 text-[11px] text-muted">🟩 match · 🟨 close (birthday within a month, height within 5 cm, age within 3) · 🟥 no match · ⬛ unknown · ↑↓ the answer is higher or lower</p>
        </div>
      )}

      {done && (
        <div className="card p-5 text-center">
          <p className="text-lg font-bold text-ink">{won ? `🎉 Got it in ${guesses.length}!` : "Out of guesses"}</p>
          <div className="mx-auto mt-3 flex max-w-sm items-center justify-center gap-4 text-left">
            {charImage(answer) && <img src={charImage(answer)!} alt={`${answer.n}`} width={72} height={104} className="h-26 w-18 shrink-0 rounded-lg object-cover" />}
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wider text-muted">Today&apos;s character</p>
              <p className="text-xl font-bold text-ink">{answer.n}</p>
              {answer.t && <p className="text-sm text-muted">{answer.t}</p>}
              <Link href={charPage(answer) ?? fallbackHref} className="mt-1 inline-block text-sm text-violet hover:underline">{charPage(answer) ? `About ${answer.n} →` : "See the full cast →"}</Link>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <button type="button" onClick={share} className="btn-primary">{copied ? "Copied ✓" : "Share result"}</button>
          </div>
          <dl className="mx-auto mt-4 grid max-w-sm grid-cols-4 gap-2 text-center">
            {([["Played", stats.played], ["Win %", stats.played ? Math.round((stats.wins / stats.played) * 100) : 0], ["Streak", stats.streak], ["Best", stats.max]] as const).map(([k, v]) => (
              <div key={k}><dd className="text-lg font-bold text-ink">{v}</dd><dt className="text-[11px] text-muted">{k}</dt></div>
            ))}
          </dl>
          <p className="mt-4 text-sm text-muted">Next character in <span className="font-mono text-ink">{hms(left)}</span> (midnight IST)</p>
        </div>
      )}
    </div>
  );
}
