"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "@/components/Link";
import { useWatchlist } from "@/lib/watchlist";
import { yourShows, JUST_AIRED_MS, type AirTimes, type NextEp } from "@/lib/yourshows";

export type { AirTimes, NextEp };


function until(ms: number): string {
  const m = Math.round(ms / 60_000);
  if (m < 60) return `in ${Math.max(1, m)}m`;
  const h = Math.floor(m / 60);
  return h < 24 ? `in ${h}h ${String(m % 60).padStart(2, "0")}m` : `in ${Math.floor(h / 24)}d ${h % 24}h`;
}

function Row({ id, title, link, items, now }: { id: string; title: string; link: { href: string; label: string }; items: NextEp[]; now: number | null }) {
  return (
    <section aria-labelledby={id} className="mb-5">
      <div className="mb-2 flex items-baseline justify-between gap-3">
        <h2 id={id} className="flex items-center gap-2 text-sm font-bold uppercase tracking-wider text-ink">
          <span className="live-dot" aria-hidden /> {title}
        </h2>
        <Link href={link.href} className="text-xs font-semibold text-violet hover:text-violet-2">{link.label} →</Link>
      </div>
      <ul className="-mx-4 flex snap-x scroll-px-4 gap-2.5 overflow-x-auto px-4 pb-1 [scrollbar-width:none] sm:mx-0 sm:px-0 [&::-webkit-scrollbar]:hidden">
        {items.map((x) => {
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
                  <span className="mt-0.5 block text-xs text-muted">{x.episode ? `Ep ${x.episode}` : "Next episode"} · <span suppressHydrationWarning>{when}</span></span>
                  {now !== null && (
                    <span className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs font-semibold tabular-nums">
                      <span className={aired ? "text-emerald-400" : "text-accent-2"}>{aired ? "Out now" : until(t.getTime() - now)}</span>
                      {x.behind ? <span className="text-[#ffc857]">{x.behind} to catch up</span> : null}
                    </span>
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

/**
 * Home page strips above the hero, so phones see anime on the first screen. "Your shows": the visitor's saved
 * airing shows, when they have any. "Airing next": the next episodes of the most-followed airing shows. The
 * server renders Japan times; after hydration cards show the viewer's local time and a countdown, and drop
 * episodes that aired more than 2 hours ago (the page is cached for up to an hour).
 */
export default function AiringNext({ items, times }: { items: NextEp[]; times: AirTimes }) {
  const [now, setNow] = useState<number | null>(null);
  const { items: list, ready } = useWatchlist();
  useEffect(() => {
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), 60_000);
    return () => clearInterval(id);
  }, []);
  const mine = ready && now !== null ? yourShows(list, times, now).slice(0, 12) : [];
  const own = new Set(mine.map((x) => x.href));
  const shown = (now === null ? items : items.filter((x) => new Date(x.at).getTime() > now - JUST_AIRED_MS && !own.has(x.href))).slice(0, 12);
  return (
    <>
      {mine.length > 0 && <Row id="your-shows-h" title="Your shows" link={{ href: "/my", label: "My list" }} items={mine} now={now} />}
      {shown.length > 0 && <Row id="airing-next-h" title="Airing next" link={{ href: "/schedule", label: "Full schedule" }} items={shown} now={now} />}
    </>
  );
}
