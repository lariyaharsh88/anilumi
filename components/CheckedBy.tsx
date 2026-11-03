import Link from "@/components/Link";
import { site } from "@/lib/site";

/** "✓ Checked by <founder> on <date>" for guides a person has reviewed, linking to how guides are checked. */
export default function CheckedBy({ date, className = "" }: { date: string; className?: string }) {
  const when = new Date(`${date}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
  return (
    <p className={`flex flex-wrap items-center gap-x-1.5 gap-y-0.5 text-xs text-muted ${className}`}>
      <svg aria-hidden viewBox="0 0 24 24" className="h-3.5 w-3.5 text-emerald-400" fill="none" stroke="currentColor" strokeWidth={2.4} strokeLinecap="round" strokeLinejoin="round"><path d="M20 6 9 17l-5-5" /></svg>
      <span>Checked by <a href={site.founder.url} rel="author" className="text-ink/90 underline decoration-line underline-offset-2 hover:text-violet-2">{site.founder.name}</a> on <time dateTime={date}>{when}</time></span>
      <span aria-hidden>·</span>
      <Link href="/about#how-guides-are-checked" className="underline decoration-line underline-offset-2 hover:text-ink">How we check guides</Link>
    </p>
  );
}
