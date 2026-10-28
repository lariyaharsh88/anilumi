"use client";
import { useEffect, useState } from "react";
import type { RatingSummary, ReactionKey } from "./community";

export type CommunityData = {
  enabled: boolean;
  rating?: RatingSummary & { mine: number | null };
  hype?: { count: number; mine: boolean };
  reactions?: { counts: Record<ReactionKey, number>; mine: ReactionKey | null };
  hypeList?: { counts: Record<string, number>; mine: string[] };
};

// One request per distinct URL per page view, shared by every widget that asks for it.
const inflight = new Map<string, Promise<CommunityData | null>>();
export function loadCommunity(qs: string): Promise<CommunityData | null> {
  const url = `/api/community?${qs}`;
  if (!inflight.has(url)) inflight.set(url, fetch(url, { cache: "no-store" }).then((r) => (r.ok ? r.json() : null)).catch(() => null));
  return inflight.get(url)!;
}

export function useCommunity(qs: string | null): CommunityData | null {
  const [data, setData] = useState<CommunityData | null>(null);
  useEffect(() => {
    if (!qs) return;
    let live = true;
    loadCommunity(qs).then((d) => { if (live) setData(d); });
    return () => { live = false; };
  }, [qs]);
  return data;
}

/** POST JSON to a community/lead endpoint; resolves to the parsed body, or { error } on failure. */
export async function send<T>(url: string, body: Record<string, unknown>): Promise<T & { error?: string }> {
  try {
    const res = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await res.json().catch(() => ({}));
    return res.ok ? j : { ...j, error: j.error || "Something went wrong. Please try again." };
  } catch {
    return { error: "You seem to be offline. Please try again." } as T & { error: string };
  }
}
