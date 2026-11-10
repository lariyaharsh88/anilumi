import Link from "@/components/Link";
import { AUTHOR } from "@/lib/author";

/** Who compiles a page and how: the person, the method in one line, and the date it was last checked. */
export default function MadeBy({ method, date, className = "" }: { method: string; date?: string | null; className?: string }) {
  const when = date ? new Date(`${date.slice(0, 10)}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : null;
  return (
    <p className={`text-xs text-muted ${className}`}>
      Compiled by <Link href={AUTHOR.path} rel="author" className="text-ink/90 underline decoration-line underline-offset-2 hover:text-violet-2">{AUTHOR.name}</Link>. {method}{when ? ` Last checked ${when}.` : ""} <Link href="/how-we-check" className="underline decoration-line underline-offset-2 hover:text-ink">How we check</Link>
    </p>
  );
}
