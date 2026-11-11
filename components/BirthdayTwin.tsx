"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import Link from "@/components/Link";

/** One date's twins: the most-loved characters and voice actors born that day, its zodiac sign and its page. */
export type TwinDay = {
  label: string; path: string; sign: string;
  c: { n: string; t: string; i: string | null; h: string | null; l: string | null }[];
  p: { n: string; i: string | null; h: string }[];
  total: number;
};

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const DAYS_IN = [31, 29, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];

/** Pick a birthday, see your anime birthday twins, share the result (the date page carries a share card). */
export default function BirthdayTwin({ origin }: { origin: string }) {
  const [m, setM] = useState(1);
  const [d, setD] = useState(1);
  const [shown, setShown] = useState<TwinDay | null>(null);
  const [copied, setCopied] = useState(false);
  const [failed, setFailed] = useState(false);
  // The year's data loads on the first search (one cached JSON file), keeping the page itself light.
  const days = useRef<Promise<Record<string, TwinDay>> | null>(null);
  const sel = "rounded-xl border border-line bg-white/[.04] px-3 py-2 text-sm text-ink focus:border-violet focus:outline-none";
  const find = async () => {
    days.current ??= fetch("/anime-birthday-twin/data.json").then((r) => { if (!r.ok) throw new Error(String(r.status)); return r.json(); });
    try {
      const all = await days.current;
      setShown(all[`${m}-${Math.min(d, DAYS_IN[m - 1])}`] ?? null);
      setFailed(false);
    } catch {
      days.current = null;
      setFailed(true);
    }
    setCopied(false);
  };
  const url = shown ? `${origin}${shown.path}` : "";
  const text = shown && shown.c[0] ? `My anime birthday twin is ${shown.c[0].n} (${shown.c[0].t})! Who shares yours?` : "Find your anime birthday twin";
  const share = async () => {
    if (!shown) return;
    try {
      if (navigator.share) { await navigator.share({ title: "My anime birthday twins", text, url }); return; }
      await navigator.clipboard.writeText(`${text} ${url}`);
      setCopied(true);
    } catch { /* the viewer closed the share sheet */ }
  };

  return (
    <div className="card p-4 sm:p-5">
      <div className="flex flex-wrap items-end gap-3">
        <label className="grid gap-1 text-xs text-muted">Month
          <select className={sel} value={m} onChange={(e) => setM(Number(e.target.value))}>
            {MONTHS.map((name, i) => <option key={name} value={i + 1}>{name}</option>)}
          </select>
        </label>
        <label className="grid gap-1 text-xs text-muted">Day
          <select className={sel} value={d} onChange={(e) => setD(Number(e.target.value))}>
            {Array.from({ length: DAYS_IN[m - 1] }, (_, i) => <option key={i} value={i + 1}>{i + 1}</option>)}
          </select>
        </label>
        <button type="button" onClick={find} className="btn-primary px-5 py-2.5 font-semibold">🎂 Find my anime twins</button>
      </div>

      {failed && <p className="mt-4 text-sm text-ink" role="alert">Couldn&apos;t load the birthdays. Check your connection and try again.</p>}
      {shown && (
        <div className="mt-5" aria-live="polite">
          <p className="text-sm text-muted">Born on <strong className="text-ink">{shown.label}</strong> · {shown.sign}</p>
          {shown.c.length ? (
            <>
              <h2 className="mt-2 text-lg font-bold text-ink">Your anime birthday twin: <span className="text-gradient">{shown.c[0].n}</span></h2>
              <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                {shown.c.map((c) => {
                  const body = (
                    <>
                      <span className="relative h-16 w-12 shrink-0 overflow-hidden rounded-md bg-bg-2">{c.i && <Image src={c.i} alt={c.n} fill sizes="48px" className="object-cover" />}</span>
                      <span className="min-w-0">
                        <span className="block truncate font-semibold text-ink">{c.n}</span>
                        <span className="block truncate text-xs text-muted">{c.t}</span>
                        {c.l && <span className="mt-0.5 block text-xs text-ink/80">{c.l}</span>}
                      </span>
                    </>
                  );
                  return <li key={c.n + c.t}>{c.h ? <Link href={c.h} className="card flex gap-3 p-2.5 hover:border-violet/60">{body}</Link> : <div className="card flex gap-3 p-2.5">{body}</div>}</li>;
                })}
              </ul>
            </>
          ) : <p className="mt-2 text-sm text-ink">No well-known anime character has this birthday on record yet.</p>}
          {shown.p.length > 0 && (
            <p className="mt-3 text-sm text-muted">Voice actors born the same day: {shown.p.map((p, i) => <span key={p.h}>{i ? ", " : ""}<Link href={p.h} className="text-violet hover:underline">{p.n}</Link></span>)}.</p>
          )}
          <div className="mt-4 flex flex-wrap gap-2 text-sm">
            <button type="button" onClick={share} className="chip">{copied ? "✓ Link copied" : "📤 Share my twins"}</button>
            <a className="chip" href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`} target="_blank" rel="noopener nofollow">WhatsApp</a>
            <a className="chip" href={`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`} target="_blank" rel="noopener nofollow">X / Twitter</a>
            <Link href={shown.path} className="chip">All {shown.total} born on {shown.label} →</Link>
          </div>
        </div>
      )}
    </div>
  );
}
