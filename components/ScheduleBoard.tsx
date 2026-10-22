"use client";
import Link from "next/link";
import Image from "next/image";
import { useState } from "react";
import { useWatchlist } from "@/lib/watchlist";
import Countdown from "./Countdown";
import LocalTime from "./LocalTime";
import WatchButton from "./WatchButton";

export type BoardItem = { id: string; slug: string; title: string; poster: string | null; rating: number | null; userCount: number; nextRelease: string | null; estimated: boolean; jst: string | null; status: string };
export type BoardDay = { day: string; items: BoardItem[] };

export default function ScheduleBoard({ days, today, tba }: { days: BoardDay[]; today: string; tba: BoardItem[] }) {
  const { has, ready, items: saved } = useWatchlist();
  const [mine, setMine] = useState(false);
  const filter = (xs: BoardItem[]) => (mine ? xs.filter((x) => has(x.id)) : xs);
  return (
    <>
      <div className="mt-4 flex flex-wrap items-center gap-2">
        {days.map(({ day }) => (
          <a key={day} href={`#${day.toLowerCase()}`} className={`chip ${day === today ? "chip-active" : ""}`}>{day === today ? `Today · ${day}` : day}</a>
        ))}
        {ready && saved.length > 0 && (
          <label className="ml-auto flex cursor-pointer items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={mine} onChange={(e) => setMine(e.target.checked)} className="accent-[#8b7cff]" /> Only my list ({saved.length})
          </label>
        )}
      </div>
      {days.map(({ day, items }) => {
        const list = filter(items);
        return (
          <section key={day} id={day.toLowerCase()} className="mt-10 scroll-mt-20">
            <h2 className="h-section mb-3">{day}{day === today ? <span className="ml-2 rounded-md bg-accent px-2 py-0.5 text-xs font-bold uppercase text-white">Today</span> : null}</h2>
            {list.length ? (
              <ul className="grid gap-3 sm:grid-cols-2">
                {list.map((a) => (
                  <li key={a.id} className="card flex gap-3 p-3 transition hover:border-violet">
                    <Link href={`/anime/${encodeURIComponent(a.slug)}`} className="relative h-20 w-14 shrink-0 overflow-hidden rounded-md bg-bg-2">
                      {a.poster && <Image src={a.poster} alt="" fill sizes="56px" className="object-cover" />}
                    </Link>
                    <div className="min-w-0 flex-1">
                      <Link href={`/anime/${encodeURIComponent(a.slug)}`} className="line-clamp-2 font-semibold hover:text-violet">{a.title}</Link>
                      <p className="text-xs text-accent-2">{a.estimated ? `Weekly on ${day}s · time not listed` : `${a.jst} JST`}{!a.estimated && a.nextRelease && <LocalTime iso={a.nextRelease} />}</p>
                      <p className="text-xs text-muted">{a.rating ? `★ ${(a.rating / 10).toFixed(1)} · ` : ""}{a.userCount.toLocaleString()} fans{!a.estimated && a.nextRelease && <> · <Countdown iso={a.nextRelease} label="in" /></>}</p>
                    </div>
                    <div className="self-start"><WatchButton compact item={{ id: a.id, slug: a.slug, title: a.title, poster: a.poster, status: a.status, nextRelease: a.nextRelease }} /></div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted">{mine ? "None of your shows air on this day." : `No tracked premieres on ${day}.`}</p>
            )}
          </section>
        );
      })}
      {filter(tba).length > 0 && (
        <section className="mt-10">
          <h2 className="h-section mb-3">Also airing · no weekly slot</h2>
          <div className="flex flex-wrap gap-2">
            {filter(tba).map((a) => (
              <Link key={a.id} href={`/anime/${encodeURIComponent(a.slug)}`} className="chip">{a.title}</Link>
            ))}
          </div>
        </section>
      )}
    </>
  );
}
