"use client";
import { useState } from "react";

type Props = { title: string; episodes: number; episodeLength: number; totalMinutes: number; status: string };

function fmt(min: number) {
  const h = Math.floor(min / 60);
  const m = Math.round(min % 60);
  return h ? `${h}h${m ? ` ${m}m` : ""}` : `${m}m`;
}

export default function BingePlanner({ title, episodes, episodeLength, totalMinutes, status }: Props) {
  const [hoursPerDay, setHours] = useState(2);
  const [skipOp, setSkipOp] = useState(false);
  const perEp = skipOp ? Math.max(episodeLength - 3, 1) : episodeLength;
  const total = episodes ? episodes * perEp : totalMinutes;
  const epsPerDay = Math.max(1, Math.floor((hoursPerDay * 60) / perEp));
  const days = episodes ? Math.ceil(episodes / epsPerDay) : Math.ceil(total / (hoursPerDay * 60));
  const weekendOnly = Math.ceil(days / 2);

  return (
    <section className="card mt-8 p-5">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 className="h-section">Binge planner</h2>
        <p className="text-sm text-muted">{episodes ? `${episodes} episodes × ${perEp} min` : "Runtime"} = <strong className="text-ink">{fmt(total)}</strong></p>
      </div>
      <p className="mt-1 text-sm text-muted">How long to finish {title}{status === "current" ? " so far" : ""}? Set how much you watch per day.</p>
      <div className="mt-4 grid gap-4 sm:grid-cols-[1fr_auto] sm:items-center">
        <label className="block text-sm">
          <span className="flex justify-between"><span>Hours per day</span><strong>{hoursPerDay} h</strong></span>
          <input type="range" min={0.5} max={8} step={0.5} value={hoursPerDay} onChange={(e) => setHours(Number(e.target.value))} className="mt-2 w-full accent-[#ff4d6d]" aria-label="Hours per day" />
        </label>
        {episodes > 0 && (
          <label className="flex items-center gap-2 text-sm text-muted">
            <input type="checkbox" checked={skipOp} onChange={(e) => setSkipOp(e.target.checked)} className="accent-[#ff4d6d]" /> Skip openings & endings
          </label>
        )}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-3 text-center">
        <div className="rounded-xl bg-bg-2 p-3"><p className="text-2xl font-extrabold text-accent-2">{days}</p><p className="text-xs text-muted">{days === 1 ? "day" : "days"} to finish</p></div>
        <div className="rounded-xl bg-bg-2 p-3"><p className="text-2xl font-extrabold">{episodes ? epsPerDay : "–"}</p><p className="text-xs text-muted">episodes per day</p></div>
        <div className="rounded-xl bg-bg-2 p-3"><p className="text-2xl font-extrabold">{weekendOnly}</p><p className="text-xs text-muted">weekends if you double up</p></div>
      </div>
    </section>
  );
}
