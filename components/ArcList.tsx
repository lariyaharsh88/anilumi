import Link from "@/components/Link";
import { arcRange, type Arc } from "@/lib/arcs";

/** Domain of a source URL, for the "checked against" line. */
const host = (u: string) => { try { return new URL(u).hostname.replace(/^www\./, ""); } catch { return u; } };

/**
 * A show's story arcs in order with episode ranges, each linking to its first episode; filler arcs marked.
 * `href(n)` builds an episode link. Short classes (globals.css): One Piece has 53 rows. Server component.
 */
export default function ArcList({ title, arcs, href, checked, reviewed, sources, className = "" }: { title: string; arcs: Arc[]; href: (n: number) => string; checked: string | null; reviewed: string | null; sources: string[]; className?: string }) {
  const canon = arcs.filter((a) => !a.filler).length;
  const when = (d: string) => new Date(`${d}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  return (
    <section id="arcs" className={`scroll-mt-32 ${className}`} aria-labelledby="arcs-h">
      <h2 id="arcs-h" className="h-section mb-1">{title} arcs in order</h2>
      <p className="mb-3 text-sm text-muted">{arcs.length} arcs{canon < arcs.length ? `, ${arcs.length - canon} of them filler` : ""}. Tap one to start at its first episode.</p>
      <ol className="grid gap-1.5 sm:grid-cols-2">
        {arcs.map((a, i) => (
          <li key={`${a.from}-${a.name}`}>
            <Link href={href(a.from)} className="arc-row">
              <span className="arc-n">{i + 1}</span>
              <span className="arc-name">{a.name}{a.filler && <span className="tag-xs">Filler</span>}</span>
              <span className="arc-ep">Ep {arcRange(a)}</span>
            </Link>
          </li>
        ))}
      </ol>
      <p className="mt-2 text-xs text-muted">
        {reviewed ? `Checked on ${when(reviewed)}` : `Draft${checked ? `, cross-checked on ${when(checked)}` : ""}`}
        {sources.length ? ` against ${sources.slice(0, 3).map(host).join(", ")}` : ""}. Episode numbers follow the TV broadcast.
      </p>
    </section>
  );
}
