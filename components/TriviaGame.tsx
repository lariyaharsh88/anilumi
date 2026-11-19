"use client";
import { useEffect, useState } from "react";
import Link from "@/components/Link";
import { track } from "@/lib/track";
import type { TriviaQ } from "@/lib/trivia";

const ROUND = 10;
const pick = (bank: TriviaQ[]) => { const a = [...bank]; for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a.slice(0, ROUND); };

/**
 * Ten questions from the show's bank, one at a time: tap an answer, see right or wrong with the fact and its source
 * page, then a score with share buttons. Rounds are drawn after hydration (the server HTML shows the first ten in a
 * fixed order, so nothing shifts on load) and "Play again" draws a new ten.
 */
export default function TriviaGame({ show, name, emoji, bank, url }: { show: string; name: string; emoji: string; bank: TriviaQ[]; url: string }) {
  const [round, setRound] = useState<TriviaQ[]>(() => bank.slice(0, ROUND));
  const [i, setI] = useState(0);
  const [chosen, setChosen] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [copied, setCopied] = useState(false);
  useEffect(() => { setRound(pick(bank)); }, [bank]);

  const q = round[i];
  const done = i >= round.length;
  const answer = (k: number) => {
    if (chosen !== null) return;
    if (i === 0) track("trivia_start", { show });
    setChosen(k);
    if (k === q.a) setScore((s) => s + 1);
  };
  const next = () => {
    if (i + 1 >= round.length) track("trivia_finish", { show, score });
    setChosen(null);
    setI((n) => n + 1);
  };
  const again = () => { setRound(pick(bank)); setI(0); setScore(0); setChosen(null); setCopied(false); };

  if (done) {
    const text = `I scored ${score}/${round.length} on the ${name} quiz on AniLumi ${emoji} Can you beat it?`;
    const verdict = score >= 9 ? "True fan. Seriously impressive." : score >= 7 ? "Solid. You know your stuff." : score >= 4 ? "Not bad. A rewatch would help." : "Rough round. Try another ten?";
    return (
      <div className="card p-5 text-center">
        <p className="text-sm text-muted">Your score</p>
        <p className="mt-1 text-5xl font-bold text-ink">{score}<span className="text-2xl text-muted">/{round.length}</span></p>
        <p className="mt-2 text-ink/90">{verdict}</p>
        <div className="mt-5 flex flex-wrap justify-center gap-2">
          <button type="button" className="btn-primary" onClick={again}>Play again (new questions)</button>
          <a href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`} target="_blank" rel="noopener nofollow" className="btn-outline" onClick={() => track("share", { method: "whatsapp", content_type: "trivia", item_id: show })}>WhatsApp</a>
          <a href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`} target="_blank" rel="noopener nofollow" className="btn-outline" onClick={() => track("share", { method: "telegram", content_type: "trivia", item_id: show })}>Telegram</a>
          <button type="button" className="btn-outline" onClick={() => {
            const share = (navigator as Navigator & { share?: (d: ShareData) => Promise<void> }).share;
            if (share) { share.call(navigator, { text, url }).catch(() => {}); track("share", { method: "native", content_type: "trivia", item_id: show }); return; }
            navigator.clipboard?.writeText(`${text} ${url}`).then(() => setCopied(true)).catch(() => {});
            track("share", { method: "copy", content_type: "trivia", item_id: show });
          }}>{copied ? "Copied ✓" : "Share"}</button>
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5">
      <div className="flex items-center justify-between gap-3 text-xs text-muted">
        <span>Question {i + 1} of {round.length}</span>
        <span>Score {score}</span>
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10" role="progressbar" aria-valuemin={0} aria-valuemax={round.length} aria-valuenow={i}>
        <div className="h-full rounded-full bg-violet transition-all" style={{ width: `${(i / round.length) * 100}%` }} />
      </div>
      <h3 className="mt-4 text-lg font-semibold leading-snug text-ink">{q.q}</h3>
      <ul className="mt-4 grid gap-2 sm:grid-cols-2">
        {q.o.map((o, k) => {
          const state = chosen === null ? "" : k === q.a ? "border-emerald-400/70 bg-emerald-500/15" : k === chosen ? "border-rose-400/70 bg-rose-500/15" : "opacity-60";
          return (
            <li key={o}>
              <button type="button" onClick={() => answer(k)} disabled={chosen !== null} aria-pressed={chosen === k} className={`w-full rounded-xl border border-line p-3 text-left text-sm text-ink transition hover:border-violet/60 disabled:cursor-default ${state}`}>
                {o}{chosen !== null && k === q.a && " ✓"}{chosen === k && k !== q.a && " ✗"}
              </button>
            </li>
          );
        })}
      </ul>
      {chosen !== null && (
        <div className="mt-4 rounded-lg bg-white/[.05] p-3 text-sm" aria-live="polite">
          <p className="text-ink/90"><strong className={chosen === q.a ? "text-emerald-300" : "text-rose-300"}>{chosen === q.a ? "Correct!" : "Not quite."}</strong> {q.x} <Link href={q.h} className="text-violet hover:underline">Source →</Link></p>
          <button type="button" className="btn-primary mt-3" onClick={next}>{i + 1 >= round.length ? "See my score" : "Next question"}</button>
        </div>
      )}
    </div>
  );
}
