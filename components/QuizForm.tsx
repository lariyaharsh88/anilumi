"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { m, AnimatePresence } from "motion/react";
import { QUIZ } from "@/lib/quiz";

/** One question at a time; the last answer jumps to the server-rendered results page. */
export default function QuizForm() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [ans, setAns] = useState<Record<string, string>>({});
  const q = QUIZ[step];
  const choose = (v: string) => {
    const next = { ...ans, [q.key]: v };
    setAns(next);
    if (step < QUIZ.length - 1) setStep(step + 1);
    else router.push(`/quiz/results?${new URLSearchParams(next).toString()}`);
  };
  return (
    <div className="card mx-auto mt-8 max-w-2xl p-5 sm:p-7">
      <div className="flex items-center justify-between text-xs text-muted">
        <span>Question {step + 1} of {QUIZ.length}</span>
        {step > 0 && <button type="button" onClick={() => setStep(step - 1)} className="hover:text-ink">← Back</button>}
      </div>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-white/10" aria-hidden><div className="h-full rounded-full bg-gradient-to-r from-accent to-violet transition-all duration-500" style={{ width: `${((step + 1) / QUIZ.length) * 100}%` }} /></div>
      <AnimatePresence mode="wait">
        <m.fieldset key={q.key} initial={{ opacity: 0, x: 24 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -24 }} transition={{ duration: 0.22 }} className="mt-5">
          <legend className="text-2xl font-black tracking-tight text-ink">{q.q}</legend>
          <div className="mt-4 grid gap-2 sm:grid-cols-2">
            {q.options.map(([v, label]) => (
              <button key={v} type="button" onClick={() => choose(v)} className={`rounded-xl border px-4 py-3 text-left text-[15px] font-medium transition hover:-translate-y-0.5 hover:border-violet/60 hover:bg-white/[.04] ${ans[q.key] === v ? "border-accent bg-accent/10" : "border-line bg-bg-2"}`}>{label}</button>
            ))}
          </div>
        </m.fieldset>
      </AnimatePresence>
    </div>
  );
}
