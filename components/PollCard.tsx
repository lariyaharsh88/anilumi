"use client";
import { useEffect, useState } from "react";
import { send } from "@/lib/community-client";
import { track } from "@/lib/track";
import type { Poll } from "@/data/polls";

/** Weekly poll: vote, then see the split. Hidden if the database isn't available. */
export default function PollCard({ poll }: { poll: Poll }) {
  const [counts, setCounts] = useState<number[] | null>(null);
  const [mine, setMine] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    fetch(`/api/poll?id=${poll.id}`, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).then((j) => { if (j?.enabled) { setCounts(j.counts); setMine(j.mine); } }).catch(() => {});
  }, [poll.id]);
  if (!counts) return null;
  const total = counts.reduce((a, b) => a + b, 0);
  const vote = async (option: number) => {
    setBusy(true);
    const res = await send<{ counts: number[]; mine: number }>("/api/poll", { pollId: poll.id, option });
    setBusy(false);
    if (!res.error) { setCounts(res.counts); setMine(res.mine); track("poll_vote", { poll_id: poll.id, option }); }
  };
  return (
    <section className="card reveal p-5 sm:p-6" aria-labelledby="poll-h">
      <p className="text-xs font-semibold uppercase tracking-wider text-accent-2">Poll of the week</p>
      <h2 id="poll-h" className="mt-1 text-lg font-bold text-ink">{poll.question}</h2>
      <ul className="mt-4 space-y-2">
        {poll.options.map((o, i) => {
          const pct = total ? Math.round((counts[i] / total) * 100) : 0;
          return (
            <li key={o}>
              <button type="button" disabled={busy} aria-pressed={mine === i} onClick={() => vote(i)}
                className={`relative w-full overflow-hidden rounded-lg border px-3 py-2.5 text-left text-sm transition ${mine === i ? "border-violet" : "border-line hover:border-violet"}`}>
                {mine !== null && <span aria-hidden className="absolute inset-y-0 left-0 bg-violet/15" style={{ width: `${pct}%` }} />}
                <span className="relative flex justify-between gap-3"><span className="text-ink">{mine === i ? "✓ " : ""}{o}</span>{mine !== null && <span className="tabular-nums text-muted">{pct}%</span>}</span>
              </button>
            </li>
          );
        })}
      </ul>
      <p className="mt-3 text-xs text-muted">{mine !== null ? `${total.toLocaleString()} ${total === 1 ? "vote" : "votes"}. Tap another answer to change yours.` : "Vote to see the results."}</p>
    </section>
  );
}
