"use client";
import { useEffect, useState } from "react";
import { useCommunity, send, type CommunityData } from "@/lib/community-client";
import { RATING_SNIPPET_MIN } from "@/lib/community";
import { track } from "@/lib/track";

type R = NonNullable<CommunityData["rating"]>;

/** "Rate this anime" 1–10 with the AniLumi fan average. Renders nothing until the database answers. */
export default function RatingWidget({ animeId, title }: { animeId: string; title: string }) {
  const data = useCommunity(`anime=${animeId}`);
  const [r, setR] = useState<R | null>(null);
  const [hover, setHover] = useState(0);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  useEffect(() => { if (data?.rating) setR(data.rating); }, [data]);
  if (!data?.enabled || !r) return null;

  const rate = async (score: number) => {
    if (busy) return;
    setBusy(true); setErr("");
    const res = await send<{ rating: R }>("/api/rate", { animeId, score });
    setBusy(false);
    if (res.error) return setErr(res.error);
    setR(res.rating);
    track("rate", { anime_id: animeId, score });
  };
  const shown = hover || r.mine || 0;
  return (
    <div className="card p-4" aria-label={`Rate ${title}`}>
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="text-xs font-semibold uppercase tracking-wider text-muted">AniLumi fans</h2>
        {r.avg !== null && <p className="text-sm"><strong className="text-lg text-ink">{r.avg.toFixed(1)}</strong><span className="text-muted">/10 · {r.count.toLocaleString()} {r.count === 1 ? "rating" : "ratings"}</span></p>}
      </div>
      <p className="mt-2 text-sm text-ink/90">{r.mine ? `You rated it ${r.mine}/10. Tap to change.` : "How would you rate it?"}</p>
      <div className="mt-2 flex gap-0.5" role="radiogroup" aria-label="Your rating out of 10" onMouseLeave={() => setHover(0)}>
        {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={r.mine === n}
            aria-label={`${n} out of 10`}
            disabled={busy}
            onMouseEnter={() => setHover(n)}
            onFocus={() => setHover(n)}
            onBlur={() => setHover(0)}
            onClick={() => rate(n)}
            className={`grid h-8 flex-1 place-items-center rounded-md text-xs font-bold transition ${n <= shown ? "bg-gold text-[#1a1306]" : "bg-bg-2 text-muted hover:text-ink"}`}
          >
            {n}
          </button>
        ))}
      </div>
      {err && <p className="mt-2 text-xs text-accent-2" role="alert">{err}</p>}
      {r.count > 0 && r.count < RATING_SNIPPET_MIN && <p className="mt-2 text-xs text-muted">The fan score settles once more people rate it.</p>}
    </div>
  );
}
