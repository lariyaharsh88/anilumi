"use client";
import { createContext, useContext, useEffect, useState } from "react";
import { useCommunity, send } from "@/lib/community-client";
import { track } from "@/lib/track";

type Hype = { counts: Record<string, number>; mine: Set<string> };
const Ctx = createContext<{ hype: Hype | null; toggle: (id: string) => void } | null>(null);

/** Loads hype counts for every listed anime in one request (season preview rows, upcoming lists). */
export function HypeProvider({ ids, children }: { ids: string[]; children: React.ReactNode }) {
  const data = useCommunity(ids.length ? `hype=${ids.slice(0, 120).join(",")}` : null);
  const [hype, setHype] = useState<Hype | null>(null);
  useEffect(() => { if (data?.enabled && data.hypeList) setHype({ counts: data.hypeList.counts, mine: new Set(data.hypeList.mine) }); }, [data]);
  const toggle = async (id: string) => {
    const res = await send<{ hype: { count: number; mine: boolean } }>("/api/hype", { animeId: id });
    if (res.error) return;
    track("hype", { anime_id: id, on: res.hype.mine });
    setHype((h) => {
      const mine = new Set(h?.mine);
      if (res.hype.mine) mine.add(id); else mine.delete(id);
      return { counts: { ...h?.counts, [id]: res.hype.count }, mine };
    });
  };
  return <Ctx.Provider value={{ hype, toggle }}>{children}</Ctx.Provider>;
}

export function useHype() { return useContext(Ctx); }

/** "🔥 Hyped" toggle with count. Inside a HypeProvider it uses the shared counts; alone it loads its own. */
export default function HypeButton({ animeId, compact = false }: { animeId: string; compact?: boolean }) {
  const ctx = useContext(Ctx);
  return ctx ? <Inner animeId={animeId} compact={compact} /> : <HypeProvider ids={[animeId]}><Inner animeId={animeId} compact={compact} /></HypeProvider>;
}

function Inner({ animeId, compact }: { animeId: string; compact: boolean }) {
  const ctx = useContext(Ctx)!;
  const [busy, setBusy] = useState(false);
  if (!ctx.hype) return null;
  const on = ctx.hype.mine.has(animeId);
  const n = ctx.hype.counts[animeId] || 0;
  return (
    <button type="button" disabled={busy} aria-pressed={on} onClick={async () => { setBusy(true); await ctx.toggle(animeId); setBusy(false); }}
      className={`inline-flex items-center gap-1.5 rounded-full border font-semibold transition ${compact ? "px-2.5 py-1 text-xs" : "px-4 py-2.5 text-sm"} ${on ? "border-accent bg-accent/15 text-ink" : "border-line bg-bg-2 text-ink/85 hover:border-accent"}`}>
      <span aria-hidden>🔥</span>{on ? "Hyped" : "I'm hyped"}{n > 0 && <span className="tabular-nums text-muted">{n.toLocaleString()}</span>}
    </button>
  );
}
