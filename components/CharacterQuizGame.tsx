"use client";
import { useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "@/components/Link";
import { track } from "@/lib/track";
import { TRAITS, bestMatch, type QuizQuestion, type QuizCharacter, type Trait } from "@/lib/charquiz-core";

type Card = QuizCharacter & { href: string; image: string | null };

/**
 * The quiz itself: one question at a time, then the closest character with share buttons. The result rides in the
 * URL hash (#itachi), so a shared link shows what a friend got without any server work, and invites a retake.
 */
export default function CharacterQuizGame({ franchise, path, questions, cards }: { franchise: string; path: string; questions: QuizQuestion[]; cards: Card[] }) {
  const [answers, setAnswers] = useState<number[]>([]);
  const [shared, setShared] = useState<Card | null>(null);
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const key = window.location.hash.slice(1);
    const c = cards.find((x) => x.key === key);
    if (c) setShared(c);
  }, [cards]);

  const done = answers.length === questions.length;
  const result = useMemo(() => {
    if (!done) return null;
    const totals = Object.fromEntries(TRAITS.map((t) => [t, 0])) as Record<Trait, number>;
    answers.forEach((a, i) => { for (const [t, n] of Object.entries(questions[i].options[a].w)) totals[t as Trait] += n ?? 0; });
    return cards.find((c) => c.key === bestMatch(totals, cards).key)!;
  }, [done, answers, questions, cards]);

  useEffect(() => {
    if (!result) return;
    history.replaceState(null, "", `#${result.key}`);
    track("quiz_result", { quiz: franchise, result: result.key });
  }, [result, franchise]);

  const url = result ? `https://anilumi.in${path}#${result.key}` : "";
  const text = result ? `I got ${result.name} in AniLumi's "Which ${franchise} character are you?" quiz. Which one are you?` : "";
  const restart = () => { setAnswers([]); setShared(null); history.replaceState(null, "", path); };

  if (result) {
    return (
      <div className="card p-5 text-center">
        <p className="text-sm text-muted">You are…</p>
        {result.image && <span className="relative mx-auto mt-3 block h-40 w-32 overflow-hidden rounded-xl border border-line"><Image src={result.image} alt={result.name} fill sizes="128px" className="object-cover object-top" /></span>}
        <p className="mt-3 text-2xl font-extrabold text-ink">{result.name}</p>
        <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink/85">{result.why}</p>
        <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm">
          <a href={`https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`} target="_blank" rel="noopener" className="btn-outline" onClick={() => track("share", { method: "whatsapp", content_type: "quiz" })}>Share on WhatsApp</a>
          <a href={`https://t.me/share/url?url=${encodeURIComponent(url)}&text=${encodeURIComponent(text)}`} target="_blank" rel="noopener" className="btn-outline" onClick={() => track("share", { method: "telegram", content_type: "quiz" })}>Telegram</a>
          <button type="button" className="btn-outline" onClick={() => { navigator.clipboard?.writeText(`${text} ${url}`).then(() => setCopied(true)).catch(() => {}); track("share", { method: "copy", content_type: "quiz" }); }}>{copied ? "Copied" : "Copy link"}</button>
        </div>
        <p className="mt-4 text-sm"><Link href={result.href} className="text-violet hover:underline">More about {result.name} →</Link> · <button type="button" onClick={restart} className="text-violet hover:underline">Take it again</button></p>
      </div>
    );
  }

  const i = answers.length;
  const q = questions[i];
  return (
    <div className="card p-5">
      {shared && i === 0 && (
        <p className="mb-4 rounded-lg bg-white/[.05] p-3 text-sm text-ink/90">Your friend got <strong className="text-ink">{shared.name}</strong>. Take the quiz to see who you are.</p>
      )}
      <div className="flex items-center justify-between text-xs text-muted">
        <span>Question {i + 1} of {questions.length}</span>
        {i > 0 && <button type="button" onClick={() => setAnswers(answers.slice(0, -1))} className="hover:text-ink">← Back</button>}
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden><div className="h-full rounded-full bg-violet" style={{ width: `${(i / questions.length) * 100}%` }} /></div>
      <p className="mt-4 text-lg font-semibold text-ink">{q.q}</p>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        {q.options.map((o, k) => (
          <button key={o.text} type="button" onClick={() => setAnswers([...answers, k])} className="rounded-xl border border-line bg-white/[.03] px-4 py-3 text-left text-sm text-ink transition hover:border-violet hover:bg-white/[.06]">{o.text}</button>
        ))}
      </div>
    </div>
  );
}
