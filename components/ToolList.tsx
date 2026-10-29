import Link from "@/components/Link";
import Image from "next/image";
import { posterUrl, type Anime } from "@/lib/kitsu";

export type ToolRow = { a: Anime; href: string; value: string; sub?: string };

/** Numbered poster rows linking to a per-title tool page (runtime, parents' guide). */
export default function ToolList({ title, subtitle, rows }: { title: string; subtitle?: string; rows: ToolRow[] }) {
  if (!rows.length) return null;
  return (
    <section className="reveal">
      <h2 className="h-section">{title}</h2>
      {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      <ol className="card mt-3 divide-y divide-line">
        {rows.map((r, i) => (
          <li key={r.a.id}>
            <Link href={r.href} className="group flex items-center gap-3 p-2.5 transition hover:bg-white/[.03]">
              <span className="w-6 text-right text-sm font-bold text-muted tabular-nums">{i + 1}</span>
              <span className="relative h-14 w-10 shrink-0 overflow-hidden rounded-md bg-bg-2">{posterUrl(r.a, "tiny") && <Image src={posterUrl(r.a, "tiny")!} alt="" fill sizes="40px" className="object-cover" />}</span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-semibold group-hover:text-violet-2">{r.a.title}</span>
                {r.sub && <span className="block truncate text-xs text-muted">{r.sub}</span>}
              </span>
              <span className="shrink-0 text-right text-sm font-bold text-ink tabular-nums">{r.value}</span>
            </Link>
          </li>
        ))}
      </ol>
    </section>
  );
}
