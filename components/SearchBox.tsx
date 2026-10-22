export default function SearchBox({ defaultValue = "" }: { defaultValue?: string }) {
  return (
    <form action="/search" role="search" className="relative">
      <input name="q" type="search" defaultValue={defaultValue} placeholder="Search anime…" aria-label="Search anime" className="input" style={{ paddingLeft: "2.25rem" }} autoComplete="off" />
      <svg aria-hidden className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M11 19a8 8 0 100-16 8 8 0 000 16z" />
      </svg>
    </form>
  );
}
