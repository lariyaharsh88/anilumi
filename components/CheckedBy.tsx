import Link from "@/components/Link";
import { AUTHOR } from "@/lib/author";

/** "✓ Checked by <author> on <date>" for guides a person has reviewed, linking to the author page and how guides are checked. */
export default function CheckedBy({ date, className = "" }: { date: string; className?: string }) {
  const when = new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  return (
    <p className={`flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted ${className}`}>
      <svg aria-hidden viewBox="0 0 24 24" className="h-3.5 w-3.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
      <span>Checked by <Link href={AUTHOR.path} rel="author" className="text-ink/90 underline decoration-line underline-offset-2 hover:text-violet-2">{AUTHOR.name}</Link> on <time dateTime={date}>{when}</time></span>
      <span aria-hidden>·</span>
      <Link href="/how-we-check" className="underline decoration-line underline-offset-2 hover:text-ink">How we check guides</Link>
    </p>
  );
}

/** The label on a guide no person has checked yet (see /how-we-check). */
export function DraftLabel({ className = "" }: { className?: string }) {
  return (
    <p className={`text-xs text-muted ${className}`}>
      Draft: not yet checked by a person · <Link href="/how-we-check" className="underline decoration-line underline-offset-2 hover:text-ink">How we check guides</Link>
    </p>
  );
}
