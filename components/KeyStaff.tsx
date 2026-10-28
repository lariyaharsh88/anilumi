import Link from "@/components/Link";
import { personPath, type KeyStaff as KS } from "@/lib/anilist";

/** Original creator, director, writers, designer and composer, each linking to their profile. */
export default function KeyStaff({ staff, compact = false }: { staff: KS[]; compact?: boolean }) {
  if (!staff.length) return null;
  return (
    <dl className={compact ? "divide-y divide-line/60 text-sm" : "grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2 lg:grid-cols-3"}>
      {staff.map((k) => (
        <div key={k.role} className={compact ? "flex justify-between gap-3 py-2" : "card p-3"}>
          <dt className={compact ? "text-muted" : "text-xs uppercase tracking-wider text-muted"}>{k.role}</dt>
          <dd className={compact ? "text-right font-medium" : "mt-1 font-semibold"}>
            {k.people.map((p, i) => (
              <span key={p.id}>{i > 0 && ", "}<Link href={personPath(p)} className="text-violet hover:text-violet-2 hover:underline">{p.name}</Link></span>
            ))}
          </dd>
        </div>
      ))}
    </dl>
  );
}
