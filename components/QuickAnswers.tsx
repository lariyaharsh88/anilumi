import Link from "@/components/Link";

export type Answer = { q: string; a: string; href: string };

/** "At a glance": one-line answers to the questions each guide page covers, linking to the full guide. */
export default function QuickAnswers({ title, items, className = "" }: { title: string; items: Answer[]; className?: string }) {
  if (items.length < 2) return null;
  return (
    <section className={`flex flex-col rounded-2xl border border-white/10 bg-card/70 p-4 backdrop-blur sm:p-5 ${className}`} aria-labelledby="h-glance">
      <h2 id="h-glance" className="flex items-center gap-2 text-lg font-bold text-ink"><span aria-hidden>⚡</span> At a glance</h2>
      <ul className="mt-3 grid flex-1 auto-rows-fr gap-2 sm:grid-cols-2">
        {items.map((x) => (
          <li key={x.href}>
            <Link href={x.href} className="group flex h-full items-center justify-between gap-3 rounded-xl bg-white/5 px-3 py-2 transition hover:bg-white/10" title={`${title}: ${x.q.toLowerCase()}`}>
              <span className="min-w-0">
                <span className="block text-[11px] text-muted">{x.q}</span>
                <span className="block text-sm font-semibold text-ink group-hover:text-violet-2">{x.a}</span>
              </span>
              <span aria-hidden className="text-muted group-hover:text-violet-2">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
