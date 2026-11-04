"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "@/components/Link";

export type NextEp = { href: string; title: string; poster: string | null; episode: number; at: string };

const JUST_AIRED_MS = 2 * 3600_000;

function until(ms: number): string {
  const m = Math.round(ms / 60_000);
  if (m < 60) return `in ${Math.max(1, m)}m`;
  const h = Math.floor(m / 60);
  return h < 24 ? `in ${h}h ${String(m % 60).padStart(2, "0")}m` : `in ${Math.floor(h / 24)}d ${h % 24}h`;
}

/**
 * Home page strip of the next episodes to air (airing snapshot, most-followed shows), so phones see anime on the
 * first screen. The server renders Japan times; after hydration each card shows the viewer's local time and a
 * countdown, and drops episodes that aired more than 2 hours ago (the page is cached for up to an hour).
 */
export default function AiringNext({ items }: { items: NextEp[] }) {
  const [now, setNow] = useState<number | null>(null);
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  const shown = (now === null ? items : items.filter((x) => new Date(x.at).getTime() > now - JUST_AIRED_MS)).slice(0, 12);
  if (!shown.length) return null;
  return (
    <section aria-labelledby="airing-next-h" className="mb-5">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 id="airing-next-h" className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ink">
          <span className="live-dot" aria-hidden /> Airing next
        </h2>
        <Link href="/schedule" className="text-xs font-semibold text-violet hover:text-violet-2">Full schedule →</Link>
      </div>
      <ul className="-mx-4 flex snap-x scroll-px-4 gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        {shown.map((x) => {
          const t = new Date(x.at);
          const aired = now !== null && t.getTime() <= now;
          const when = now === null
            ? `${t.toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit", timeZone: "Asia/Tokyo" })} JST`
            : t.toLocaleString("en-US", { weekday: "short", hour: "numeric", minute: "2-digit" });
          return (
            <li key={`${x.href}-${x.episode}`} className="w-[15.5rem] shrink-0 snap-start">
              <Link href={x.href} className="card group flex h-full items-center gap-3 p-2 pr-3 transition hover:border-violet/60">
                <span className="relative h-[66px] w-[46px] shrink-0 overflow-hidden rounded-md bg-bg-2">
                  {x.poster && <Image src={x.poster} alt="" fill sizes="46px" className="object-cover" />}
                </span>
                <span className="min-w-0 flex-1">
                  <span className="line-clamp-2 text-sm font-semibold leading-snug text-ink group-hover:text-violet-2">{x.title}</span>
                  <span className="mt-0.5 block text-xs text-muted">Ep {x.episode} · <span suppressHydrationWarning>{when}</span></span>
                  {now !== null && (
                    <span className={`mt-0.5 block text-xs font-semibold tabular-nums ${aired ? "text-emerald-400" : "text-accent-2"}`}>{aired ? "Out now" : until(t.getTime() - now)}</span>
                  )}
                </span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
