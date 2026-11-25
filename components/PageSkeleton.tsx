/**
 * The loading screen for anime and character pages, shown by NavSkeleton on in-site clicks while an uncached page
 * renders (3-4 s on a first render). Browser-only: it is never part of a page's HTML. Same grid as the real hero
 * (poster beside the title on phones, below the breadcrumb on desktop) so nothing jumps when the page arrives.
 */
const Bar = ({ className = "" }: { className?: string }) => <div className={`rounded-md bg-ink/10 ${className}`} />;

export default function PageSkeleton({ kind }: { kind: "anime" | "character" }) {
  const poster = kind === "anime" ? "aspect-[2/3]" : "aspect-[3/4]";
  return (
    <div role="status" aria-live="polite" aria-busy="true" className="motion-safe:animate-pulse">
      <span className="sr-only">Loading…</span>
      <div className="container-x pb-8 pt-6 max-md:grid max-md:grid-cols-[6.5rem_1fr] max-md:items-center max-md:gap-x-4 sm:max-md:grid-cols-[8.5rem_1fr] lg:pt-10">
        <div className="max-md:col-span-2"><Bar className="h-4 w-48" /></div>
        <div className="mt-2 flex flex-col gap-6 max-md:contents md:flex-row md:items-end lg:gap-10">
          <div className={`w-full shrink-0 rounded-2xl bg-ink/10 max-md:row-span-3 max-md:self-start md:w-52 lg:w-60 ${poster}`} />
          <div className="min-w-0 flex-1 space-y-3 max-md:mt-3">
            <Bar className="h-5 w-56" />
            <Bar className="h-10 w-3/4 max-w-md" />
            <Bar className="h-4 w-40" />
            <div className="flex flex-wrap gap-2 pt-2 max-md:col-span-2">
              <Bar className="h-11 w-36 rounded-xl" />
              <Bar className="h-11 w-28 rounded-xl" />
              <Bar className="h-11 w-36 rounded-xl" />
            </div>
          </div>
        </div>
      </div>
      <div className="container-x space-y-4 pb-10">
        <div className="card space-y-3 p-5">
          <Bar className="h-5 w-40" />
          <Bar className="h-4 w-full" />
          <Bar className="h-4 w-11/12" />
          <Bar className="h-4 w-2/3" />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="card h-40" />
          <div className="card h-40" />
        </div>
      </div>
    </div>
  );
}
