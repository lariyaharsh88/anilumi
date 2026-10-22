"use client";
import { useEffect, useState } from "react";
import { useWatchlist, useSpoilerShield } from "@/lib/watchlist";

type Props = {
  animeId: string;
  ep: number;
  children: React.ReactNode;
  inline?: boolean;
  /** Replace the browser-tab title while hidden (episode pages put the episode title there). */
  safeDocTitle?: string;
};

/**
 * Hides content about episodes past the viewer's recorded progress. Server HTML keeps the content
 * (for search engines and people without a list); a pre-paint style blurs it for shows with progress
 * until this component confirms whether it's safe.
 */
export default function SpoilerGate({ animeId, ep, children, inline = false, safeDocTitle }: Props) {
  const { items, ready } = useWatchlist();
  const shield = useSpoilerShield();
  const [reveal, setReveal] = useState(false);
  const progress = items.find((i) => i.id === animeId)?.progress;
  const hidden = ready && shield.on && typeof progress === "number" && ep > progress && !reveal;

  useEffect(() => {
    if (!safeDocTitle) return;
    const original = document.title;
    if (hidden) document.title = safeDocTitle;
    return () => { document.title = original; };
  }, [hidden, safeDocTitle]);

  const Tag = inline ? "span" : "div";
  return (
    <Tag data-sp={animeId} className={inline ? "relative inline-block" : "relative"}>
      <Tag data-sp-body="" data-sp-ok={ready && !hidden ? "" : undefined} aria-hidden={hidden || undefined} style={hidden ? { filter: "blur(8px)", userSelect: "none" } : undefined}>
        {children}
      </Tag>
      {hidden && (
        <button
          type="button"
          onClick={() => setReveal(true)}
          className={inline
            ? "absolute inset-0 flex items-center justify-center rounded bg-bg/60 text-[11px] font-semibold text-ink"
            : "absolute inset-0 flex flex-col items-center justify-center gap-0.5 rounded-lg bg-bg/70 p-2 text-center text-xs text-ink"}
          title={`Episode ${ep} is past your progress (episode ${progress})`}
        >
          {inline ? "Spoiler · show" : (<><span className="font-semibold">Spoiler shield</span><span className="text-muted">Past your episode {progress} · tap to show</span></>)}
        </button>
      )}
    </Tag>
  );
}
