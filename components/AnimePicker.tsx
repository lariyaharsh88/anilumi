"use client";
import { useState } from "react";
import Image from "next/image";
import Link from "@/components/Link";
import { track } from "@/lib/track";
import { LENGTHS, MOODS, pick, type Answers, type PickItem } from "@/lib/picker";

const START: Answers = { mood: "any", length: "any", finished: false, hindi: false, free: false };
const hours = (min: number | null) => (min ? `~${Math.max(1, Math.round(min / 60))} h` : "");

/** Five taps, then three picks with reasons; "3 more" pages through the rest. All in the browser. */
export default function AnimePicker({ items }: { items: PickItem[] }) {
  const [step, setStep] = useState(0);
  const [a, setA] = useState<Answers>(START);
  const [page, setPage] = useState(0);
  const set = (patch: Partial<Answers>) => { setA((x) => ({ ...x, ...patch })); setStep((s) => s + 1); };
  const done = step >= 4;
  const { list, relaxed } = done ? pick(items, a) : { list: [], relaxed: [] };
  const shown = list.slice(page * 3, page * 3 + 3);
  const restart = () => { setA(START); setStep(0); setPage(0); };
  const Opt = ({ on, children, active = false }: { on: () => void; children: React.ReactNode; active?: boolean }) => (
    <button type="button" onClick={on} className={`card w-full p-3 text-left text-sm transition hover:border-violet/60 ${active ? "border-violet/70" : ""}`}>{children}</button>
  );
  const Q = ({ n, title, children }: { n: number; title: string; children: React.ReactNode }) => (
    <div>
      <p className="text-xs font-semibold uppercase tracking-wider text-muted">Question {n} of 4</p>
      <h2 className="mt-1 text-lg font-bold text-ink">{title}</h2>
      <div className="mt-3 grid gap-2 sm:grid-cols-2">{children}</div>
    </div>
  );

  return (
    <div className="card p-5">
      {step === 0 && (
        <Q n={1} title="What are you in the mood for?">
          {MOODS.map((m) => <Opt key={m.key} on={() => { track("picker_start", { mood: m.key }); set({ mood: m.key }); }}>{m.emoji} {m.label}</Opt>)}
          <Opt on={() => { track("picker_start", { mood: "any" }); set({ mood: "any" }); }}>🎲 Surprise me</Opt>
        </Q>
      )}
      {step === 1 && (
        <Q n={2} title="How much time do you have?">
          {LENGTHS.map((l) => <Opt key={l.key} on={() => set({ length: l.key })}><strong className="text-ink">{l.label}</strong> <span className="text-muted">· {l.hint}</span></Opt>)}
        </Q>
      )}
      {step === 2 && (
        <Q n={3} title="Finished shows only?">
          <Opt on={() => set({ finished: true })}><strong className="text-ink">Yes, finished</strong> <span className="text-muted">· no waiting for episodes</span></Opt>
          <Opt on={() => set({ finished: false })}><strong className="text-ink">Airing is fine</strong></Opt>
        </Q>
      )}
      {step === 3 && (
        <Q n={4} title="Language and price">
          <Opt on={() => set({ hindi: true, free: false })}>🇮🇳 <strong className="text-ink">Hindi dub</strong></Opt>
          <Opt on={() => set({ hindi: true, free: true })}>🇮🇳 <strong className="text-ink">Hindi dub, free only</strong></Opt>
          <Opt on={() => set({ hindi: false, free: false })}>🇯🇵 <strong className="text-ink">Any audio</strong> <span className="text-muted">· subtitles are fine</span></Opt>
          <Opt on={() => set({ hindi: false, free: true })}>🆓 <strong className="text-ink">Anything free</strong> <span className="text-muted">· legal free streams in India</span></Opt>
        </Q>
      )}
      {done && (
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className="text-lg font-bold text-ink">{shown.length ? "Watch one of these" : "Nothing matched"}</h2>
            <button type="button" onClick={restart} className="chip">↺ Start over</button>
          </div>
          {relaxed.length > 0 && shown.length > 0 && <p className="mt-1 text-xs text-muted">Fewer than 3 titles matched every answer, so these ignore: {relaxed.join(", ")}.</p>}
          <ol className="mt-4 space-y-3">
            {shown.map((x) => (
              <li key={x.s} className="flex gap-3">
                <span className="relative h-28 w-20 shrink-0 overflow-hidden rounded-lg bg-bg-2">{x.p && <Image src={x.p} alt={`${x.t} poster`} fill sizes="80px" className="object-cover" />}</span>
                <span className="min-w-0">
                  <Link href={`/anime/${x.s}`} className="font-semibold text-ink hover:text-violet-2" onClick={() => track("picker_open", { anime: x.s })}>{x.t}</Link>
                  <span className="block text-xs text-muted">★ {x.sc.toFixed(1)} · {x.sub === "movie" ? "Film" : `${x.e ?? "?"} episodes`}{x.min ? ` · ${hours(x.min)}` : ""}{x.y ? ` · ${x.y}` : ""}{x.st !== "finished" ? " · airing" : ""}</span>
                  {x.why.length > 0 && <span className="mt-1 block text-sm text-ink/85">{x.why.join(", ")}</span>}
                  <span className="mt-1 block text-xs">{x.hi.length ? <span className="text-orange-300">🇮🇳 Hindi on {x.hi.join(", ")}</span> : null}{x.free ? <span className="ml-2 text-emerald-400">Free option</span> : null}</span>
                </span>
              </li>
            ))}
          </ol>
          {shown.length > 0 && list.length > (page + 1) * 3 && <button type="button" onClick={() => { setPage((p) => p + 1); track("picker_more", {}); }} className="btn-outline mt-4">Show me 3 more</button>}
          {!shown.length && <p className="mt-2 text-sm text-muted">Try different answers, or browse the <Link href="/best-anime" className="text-violet hover:underline">best anime of all time</Link>.</p>}
        </div>
      )}
      {!done && step > 0 && <button type="button" onClick={() => setStep((s) => s - 1)} className="mt-4 text-xs text-muted hover:text-ink">← Back</button>}
    </div>
  );
}
