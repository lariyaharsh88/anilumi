"use client";
import { useEffect, useState } from "react";
import { useCommunity, send, type CommunityData } from "@/lib/community-client";
import { REACTIONS, type ReactionKey } from "@/lib/community";
import { track } from "@/lib/track";

type Rx = NonNullable<CommunityData["reactions"]>;

/** One-tap emoji reactions under an aired episode. Counts appear once you've reacted (no herd effect). */
export default function EpisodeReactions({ animeId, ep }: { animeId: string; ep: number }) {
  const data = useCommunity(`anime=${animeId}&ep=${ep}`);
  const [rx, setRx] = useState<Rx | null>(null);
  const [busy, setBusy] = useState(false);
  useEffect(() => { if (data?.reactions) setRx(data.reactions); }, [data]);
  if (!data?.enabled || !rx) return null;
  const total = Object.values(rx.counts).reduce((n, c) => n + c, 0);
  const pick = async (emoji: ReactionKey) => {
    if (busy) return;
    setBusy(true);
    const res = await send<{ reactions: Rx }>("/api/react", { animeId, ep, emoji });
    setBusy(false);
    if (!res.error) { setRx(res.reactions); track("react", { anime_id: animeId, episode: ep, emoji }); }
  };
  return (
    <section className="card mt-5 p-4" aria-label={`Reactions to episode ${ep}`}>
      <h2 className="text-sm font-semibold text-ink">How was episode {ep}?</h2>
      <div className="mt-3 flex flex-wrap gap-2">
        {REACTIONS.map((r) => {
          const on = rx.mine === r.key;
          return (
            <button key={r.key} type="button" disabled={busy} aria-pressed={on} onClick={() => pick(r.key)} title={r.label}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-sm transition ${on ? "border-violet bg-violet/15 text-ink" : "border-line bg-bg-2 text-ink/85 hover:border-violet"}`}>
              <span aria-hidden className="text-base">{r.emoji}</span>
              <span>{r.label}</span>
              {rx.mine && <span className="tabular-nums text-muted">{rx.counts[r.key]}</span>}
            </button>
          );
        })}
      </div>
      <p className="mt-2 text-xs text-muted">{rx.mine ? `${total.toLocaleString()} ${total === 1 ? "reaction" : "reactions"} so far. Tap again to undo.` : "Pick one to see how others felt."}</p>
    </section>
  );
}
