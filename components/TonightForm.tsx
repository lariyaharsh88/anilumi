"use client";

import { TIMES, type TonightValues } from "@/lib/tonight";

/** GET form: works without JS; with JS it re-submits as soon as any control changes. */
export default function TonightForm({ v, genres }: { v: TonightValues; genres: { slug: string; title: string }[] }) {
  return (
    <form method="get" action="/tonight" className="card mt-6 space-y-4 p-4" onChange={(e) => e.currentTarget.requestSubmit()}>
      <fieldset>
        <legend className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted">How much time do you have?</legend>
        <div className="flex flex-wrap gap-2">
          {TIMES.map((t) => (
            <label key={t.m} className={`chip cursor-pointer ${v.minutes === t.m ? "chip-active" : ""}`}>
              <input type="radio" name="minutes" value={t.m} defaultChecked={v.minutes === t.m} className="sr-only" />
              {t.label}
            </label>
          ))}
        </div>
      </fieldset>
      <div className="grid gap-3 sm:grid-cols-3">
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Genre</span>
          <select name="genre" defaultValue={v.genre} className="input">
            <option value="">Any genre</option>
            {genres.map((g) => <option key={g.slug} value={g.slug}>{g.title}</option>)}
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Format</span>
          <select name="type" defaultValue={v.type} className="input">
            <option value="any">Series or movies</option>
            <option value="series">Series only</option>
            <option value="movies">Movies only</option>
          </select>
        </label>
        <label className="text-sm">
          <span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">Minimum score</span>
          <select name="min" defaultValue={String(v.min)} className="input">
            <option value="0">Any score</option>
            <option value="7">7.0 or higher</option>
            <option value="8">8.0 or higher</option>
          </select>
        </label>
      </div>
      <div className="flex flex-wrap items-center justify-between gap-3">
        <label className="flex items-center gap-2 text-sm text-muted">
          <input type="checkbox" name="all" value="1" defaultChecked={v.all} className="accent-[#8b7cff]" /> Include shows still airing
        </label>
        <noscript><button type="submit" className="btn-primary">Find anime</button></noscript>
      </div>
    </form>
  );
}
