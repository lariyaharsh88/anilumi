import Link from "@/components/Link";
import { officialRatings, RATINGS_CHECKED, RATINGS_REVIEWED } from "@/lib/ageratings";

const fmt = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** The official ratings platforms give this show, with their stated reasons and a link to each (lib/ageratings.ts). */
export default function OfficialRatings({ slug, title }: { slug: string; title: string }) {
  const e = officialRatings(slug);
  if (!e) return null;
  return (
    <section className="card reveal mt-8 p-5" aria-labelledby="official-h">
      <h2 id="official-h" className="text-xs font-semibold uppercase tracking-wider text-muted">{title}: official age ratings</h2>
      <ul className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
        {e.ratings.map((r) => (
          <li key={r.body} className="rounded-lg border border-line p-3">
            <p className="flex items-baseline justify-between gap-2"><span className="text-muted">{r.body === "TV (US)" ? "US TV rating" : r.body}</span><strong className="text-lg text-ink">{r.rating}</strong></p>
            {r.reasons && <p className="mt-1 text-xs text-ink/80">{r.reasons}</p>}
            <a href={r.url} target="_blank" rel="noopener nofollow" className="mt-1 inline-block text-[11px] text-violet hover:underline">Source ↗</a>
          </li>
        ))}
      </ul>
      {e.notes && <p className="mt-2 text-xs text-muted">{e.notes}</p>}
      <p className="mt-3 text-[11px] text-muted">India ratings: U/A 7+, 13+ and 16+ mean suitable from that age with parental guidance; A is adults only. {RATINGS_REVIEWED ? "Checked" : `Draft, checked${RATINGS_CHECKED ? ` on ${fmt(RATINGS_CHECKED)}` : ""}`} on each platform&apos;s page. <Link href="/how-we-check" className="underline">How we check</Link></p>
    </section>
  );
}
