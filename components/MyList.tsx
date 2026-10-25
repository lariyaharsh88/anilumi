"use client";
import Link from "@/components/Link";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { useWatchlist, useSpoilerShield, type WatchItem } from "@/lib/watchlist";
import Countdown from "./Countdown";
import MyListStats from "./MyListStats";
import CalendarLinks from "./CalendarLinks";
import ImportAniList from "./ImportAniList";
import ImportMal from "./ImportMal";

export default function MyList() {
  const { items, ready, remove, update, setProgress } = useWatchlist();
  const shield = useSpoilerShield();
  const refreshed = useRef(false);

  useEffect(() => {
    if (!ready || refreshed.current || !items.length) return;
    refreshed.current = true;
    fetch(`/api/anime?ids=${items.map((i) => i.id).join(",")}`, { cache: "no-cache" })
      .then((r) => r.json())
      .then((d: { items: Partial<WatchItem>[] }) => update(d.items))
      .catch(() => {});
  }, [ready, items, update]);

  if (!ready) return <p className="text-sm text-muted">Loading your list…</p>;
  if (!items.length)
    return (
      <div className="card p-8 text-center">
        <p className="font-semibold">Your list is empty.</p>
        <p className="mt-1 text-sm text-muted">Press “+ My list” on any anime page, or import your AniList or MyAnimeList list. It is saved in this browser only, no account needed.</p>
        <div className="mx-auto mt-4 flex max-w-md flex-col items-center gap-3">
          <ImportAniList compact />
          <ImportMal compact />
          <Link href="/schedule" className="text-sm text-violet hover:underline">Or browse the schedule →</Link>
        </div>
      </div>
    );
  const airing = items.filter((i) => i.status === "current").sort((a, b) => (a.nextRelease || "9").localeCompare(b.nextRelease || "9"));
  const rest = items.filter((i) => i.status !== "current");
  // A render function, not a component: defining a component inside render remounts every row
  // on each update, which drops keyboard focus from the progress buttons.
  const row = (i: (typeof items)[number]) => (
    <li key={i.id} className="card flex items-center gap-3 p-3">
      <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded bg-bg-2">{i.poster && <Image src={i.poster} alt="" fill sizes="44px" className="object-cover" loading="eager" />}</div>
      <div className="min-w-0 flex-1">
        <Link href={`/anime/${encodeURIComponent(i.slug)}`} className="line-clamp-1 font-semibold hover:text-violet">{i.title}</Link>
        {(i.listStatus || i.progress !== undefined) && (
          <div className="mt-1 flex items-center gap-1.5 text-xs">
            {i.listStatus && <span className="rounded bg-white/5 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-muted">{i.listStatus}</span>}
            <button type="button" onClick={() => setProgress(i.id, (i.progress || 0) - 1)} className="rounded px-1.5 text-muted hover:bg-white/5 hover:text-ink" aria-label={`One episode less of ${i.title}`}>−</button>
            <span className="tabular-nums text-ink/90">Ep {i.progress || 0}{i.episodeCount ? ` of ${i.episodeCount}` : ""}</span>
            <button type="button" onClick={() => setProgress(i.id, (i.progress || 0) + 1)} className="rounded px-1.5 text-muted hover:bg-white/5 hover:text-ink" aria-label={`One more episode of ${i.title}`}>+</button>
          </div>
        )}
        <p className="text-xs text-muted">
          {i.status === "current" && i.nextRelease ? <>Next: {new Date(i.nextRelease).toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })} · <Countdown iso={i.nextRelease} label="in" /></> : i.status === "current" ? "Airing · next date TBA" : i.status === "upcoming" ? "Upcoming" : "Finished"}
        </p>
      </div>
      <button type="button" onClick={() => remove(i.id)} className="text-xs text-muted hover:text-accent-2" aria-label={`Remove ${i.title}`}>Remove</button>
    </li>
  );
  const calendarIds = items.filter((i) => i.status === "current" || i.status === "upcoming").map((i) => i.id);
  return (
    <div className="space-y-8">
      <MyListStats items={items} />
      <section className="card flex flex-wrap items-center justify-between gap-3 p-4">
        <div className="min-w-0">
          <h2 className="font-semibold">Spoiler shield {shield.on ? "on" : "off"}</h2>
          <p className="mt-1 text-sm text-muted">Hides titles, synopses and stills for episodes past your progress, for every show where you&apos;ve set an episode. Each hidden item has a “show” button.</p>
        </div>
        <button type="button" role="switch" aria-checked={shield.on} onClick={() => shield.set(!shield.on)} className={shield.on ? "btn bg-violet-strong text-white" : "btn-outline"}>
          {shield.on ? "Turn off" : "Turn on"}
        </button>
      </section>
      <div className="grid gap-4 md:grid-cols-2"><ImportAniList /><ImportMal /></div>
      <Link href="/my/wrapped" className="card group flex items-center justify-between gap-3 bg-gradient-to-r from-accent/15 to-violet/15 p-4 transition hover:border-white/20">
        <span><span className="block font-semibold text-ink">Your {new Date().getFullYear()} Anime Wrapped ✨</span><span className="block text-sm text-muted">Hours watched, top genres and your anime personality, as a card to share.</span></span>
        <span className="text-violet transition group-hover:translate-x-1" aria-hidden>→</span>
      </Link>
      {calendarIds.length > 0 && (
        <section className="card p-4">
          <h2 className="font-semibold">Put your episodes in your calendar</h2>
          <p className="mt-1 text-sm text-muted">Subscribe once and your calendar app pulls the next episode of every airing show on your list, plus premiere dates for upcoming ones. It refreshes on its own every few hours.</p>
          <CalendarLinks ids={calendarIds} />
          <p className="mt-2 text-xs text-muted">The subscription covers the {calendarIds.length} show{calendarIds.length === 1 ? "" : "s"} saved right now. Subscribe again after adding new ones.</p>
        </section>
      )}
      {airing.length > 0 && (
        <section>
          <h2 className="h-section mb-3">Airing · next episodes</h2>
          <ul className="space-y-2">{airing.map(row)}</ul>
        </section>
      )}
      {rest.length > 0 && (
        <section>
          <h2 className="h-section mb-3">Everything else</h2>
          <ul className="space-y-2">{rest.map(row)}</ul>
        </section>
      )}
    </div>
  );
}
