"use client";
import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef } from "react";
import { useWatchlist, type WatchItem } from "@/lib/watchlist";
import Countdown from "./Countdown";
import MyListStats from "./MyListStats";
import CalendarLinks from "./CalendarLinks";

export default function MyList() {
  const { items, ready, remove, update } = useWatchlist();
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
        <p className="mt-1 text-sm text-muted">Press “+ My list” on any anime page. It is saved in this browser only, no account needed.</p>
        <Link href="/schedule" className="btn-primary mt-4">Browse the schedule</Link>
      </div>
    );
  const airing = items.filter((i) => i.status === "current").sort((a, b) => (a.nextRelease || "9").localeCompare(b.nextRelease || "9"));
  const rest = items.filter((i) => i.status !== "current");
  const Row = ({ i }: { i: (typeof items)[number] }) => (
    <li className="card flex items-center gap-3 p-3">
      <div className="relative h-16 w-11 shrink-0 overflow-hidden rounded bg-bg-2">{i.poster && <Image src={i.poster} alt="" fill sizes="44px" className="object-cover" loading="eager" />}</div>
      <div className="min-w-0 flex-1">
        <Link href={`/anime/${encodeURIComponent(i.slug)}`} className="line-clamp-1 font-semibold hover:text-violet">{i.title}</Link>
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
          <ul className="space-y-2">{airing.map((i) => <Row key={i.id} i={i} />)}</ul>
        </section>
      )}
      {rest.length > 0 && (
        <section>
          <h2 className="h-section mb-3">Everything else</h2>
          <ul className="space-y-2">{rest.map((i) => <Row key={i.id} i={i} />)}</ul>
        </section>
      )}
    </div>
  );
}
