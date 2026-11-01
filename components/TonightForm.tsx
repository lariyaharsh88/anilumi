"use client";

import { TIMES, type TonightValues } from "@/lib/tonight";
import SearchSelect from "@/components/SearchSelect";

const FORMATS = [{ value: "any", label: "Series or movies" }, { value: "series", label: "Series only" }, { value: "movies", label: "Movies only" }];
const SCORES = [{ value: "0", label: "Any score" }, { value: "7", label: "7.0 or higher" }, { value: "8", label: "8.0 or higher" }];
const field = (title: string, control: React.ReactNode) => (
  <div className="text-sm"><span className="mb-1 block text-xs font-semibold uppercase tracking-wider text-muted">{title}</span>{control}</div>
);

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
        {field("Genre", <SearchSelect name="genre" label="Genre" defaultValue={v.genre} submitOnChange options={[{ value: "", label: "Any genre" }, ...genres.map((g) => ({ value: g.slug, label: g.title }))]} />)}
        {field("Format", <SearchSelect name="type" label="Format" defaultValue={v.type} submitOnChange options={FORMATS} />)}
        {field("Minimum score", <SearchSelect name="min" label="Minimum score" defaultValue={String(v.min)} submitOnChange options={SCORES} />)}
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
