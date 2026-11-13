"use client";
import { useMemo, useState } from "react";
import Image from "next/image";
import Link from "@/components/Link";
import type { PlatformKind } from "@/lib/hindidub";

export type DubCard = {
  s: string; t: string; href: string; poster: string | null; year: number | null; cheapest: PlatformKind;
  platforms: { name: string; scope: string; url: string; kind: PlatformKind }[];
};
const KIND: Record<PlatformKind, string> = { free: "Free", subscription: "Subscription", tv: "TV channel" };
const KIND_CLASS: Record<PlatformKind, string> = { free: "border-emerald-500/40 text-emerald-300", subscription: "border-line text-muted", tv: "border-amber-400/40 text-amber-200" };

/**
 * Every Hindi dub as a poster card, with a search box, a free / subscription / TV filter and a platform filter. All
 * cards are in the HTML; filtering only hides them.
 */
export default function HindiDubList({ items, platforms }: { items: DubCard[]; platforms: string[] }) {
  const [q, setQ] = useState("");
  const [kind, setKind] = useState<PlatformKind | "all">("all");
  const [platform, setPlatform] = useState("");
  const shown = useMemo(() => {
    const words = q.toLowerCase().split(/\s+/).filter(Boolean);
    return new Set(items.filter((d) =>
      words.every((w) => d.t.toLowerCase().includes(w)) &&
      (kind === "all" || d.platforms.some((p) => p.kind === kind)) &&
      (!platform || d.platforms.some((p) => p.name === platform)),
    ).map((d) => d.s));
  }, [items, q, kind, platform]);
  const counts = (k: PlatformKind) => items.filter((d) => d.platforms.some((p) => p.kind === k)).length;

  return (
    <div>
      <div className="flex flex-wrap items-center gap-2">
        <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search a title…" aria-label="Search Hindi dubbed anime" className="min-w-0 flex-1 rounded-xl border border-line bg-white/[.04] px-3 py-2 text-sm text-ink placeholder:text-muted sm:max-w-xs" />
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="How you watch">
          {(["all", "free", "subscription", "tv"] as const).map((k) => (
            <button key={k} type="button" aria-pressed={kind === k} onClick={() => setKind(k)} className={`chip text-xs ${kind === k ? "chip-active" : ""}`}>{k === "all" ? `All ${items.length}` : `${KIND[k]} ${counts(k)}`}</button>
          ))}
        </div>
        <select value={platform} onChange={(e) => setPlatform(e.target.value)} aria-label="Platform" className="rounded-xl border border-line bg-white/[.04] px-2.5 py-2 text-sm text-ink">
          <option value="">Any platform</option>
          {platforms.map((p) => <option key={p} value={p}>{p}</option>)}
        </select>
      </div>
      <p className="mt-2 text-xs text-muted" aria-live="polite">{shown.size === items.length ? `${items.length} anime` : `${shown.size} of ${items.length} anime`}</p>
      <ul className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
        {items.map((d) => (
          <li key={d.s} hidden={!shown.has(d.s)} className="card flex gap-3 p-3">
            <Link href={d.href} tabIndex={-1} aria-hidden className="relative h-[104px] w-[74px] shrink-0 overflow-hidden rounded-lg border border-line bg-bg-2">
              {d.poster && <Image src={d.poster} alt="" fill sizes="74px" className="object-cover" />}
            </Link>
            <div className="min-w-0 flex-1">
              <div className="flex items-start justify-between gap-2">
                <Link href={d.href} className="font-semibold leading-snug text-ink hover:text-violet-2">{d.t}</Link>
                {d.cheapest === "free" && <span className="shrink-0 rounded-full bg-emerald-500/15 px-2 py-0.5 text-[11px] font-semibold text-emerald-300">Free</span>}
              </div>
              {d.year && <p className="text-xs text-muted">Since {d.year}</p>}
              <ul className="mt-2 space-y-1.5">
                {d.platforms.map((p) => (
                  <li key={p.name + p.scope} className="text-xs">
                    <span className="flex flex-wrap items-center gap-x-1.5 gap-y-0.5">
                      <span className="font-medium text-ink/90">{p.name}</span>
                      <span className={`rounded-full border px-1.5 py-px text-[10px] font-medium ${KIND_CLASS[p.kind]}`}>{KIND[p.kind]}</span>
                      <a href={p.url} target="_blank" rel="noopener nofollow" className="ml-auto text-violet hover:underline" aria-label={`Source for ${d.t} on ${p.name}`}>source ↗</a>
                    </span>
                    {p.scope && <span className="mt-0.5 block leading-snug text-muted">{p.scope}</span>}
                  </li>
                ))}
              </ul>
            </div>
          </li>
        ))}
      </ul>
      {shown.size === 0 && <p className="card mt-3 p-4 text-sm text-muted">No Hindi dub matches. It may not have one yet: see the list of popular anime without a Hindi dub below.</p>}
    </div>
  );
}
