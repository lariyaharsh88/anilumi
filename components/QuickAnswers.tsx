import Link from "@/components/Link";

export type Answer = { q: string; a: string; href: string };

/** "At a glance": one-line answers to the questions each guide page covers, linking to the full guide. */
export default function QuickAnswers({ title, items }: { title: string; items: Answer[] }) {
  if (items.length < 2) return null;
  return (
    <section className="mb-8" aria-label={`${title} at a glance`}>
      <h2 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted">{title} at a glance</h2>
      <ul className="grid gap-2 sm:grid-cols-2">
        {items.map((x) => (
          <li key={x.href}>
            <Link href={x.href} className="card group flex h-full items-center justify-between gap-3 px-3.5 py-2.5 transition hover:border-violet/60">
              <span className="min-w-0">
                <span className="block text-xs text-muted">{x.q}</span>
                <span className="block font-semibold text-ink group-hover:text-violet-2">{x.a}</span>
              </span>
              <span aria-hidden className="text-muted group-hover:text-violet-2">→</span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
