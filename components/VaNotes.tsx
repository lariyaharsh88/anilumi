import Link from "@/components/Link";
import { roleLine, vaNote, VA_CHECKED, VA_REVIEWED } from "@/lib/vanotes";

const fmt = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** Debut, awards, agency and best-known roles for an indexed voice actor (lib/vanotes.ts). */
export default function VaNotes({ id }: { id: number }) {
  const n = vaNote(id);
  if (!n) return null;
  const rows: [string, React.ReactNode][] = [];
  if (n.debut) rows.push(["Debut role", roleLine(n.debut)]);
  if (n.signature.length) rows.push(["Best known for", n.signature.map(roleLine).join(" · ")]);
  if (n.awards.length) rows.push(["Awards", <ul key="aw" className="space-y-0.5">{n.awards.map((a) => <li key={`${a.award}-${a.year}`}>{a.award} ({a.year})</li>)}</ul>]);
  if (n.agency) rows.push(["Agency", n.agency]);
  if (n.also.length) rows.push(["Also", n.also.join(" ")]);
  if (!rows.length) return null;
  return (
    <section className="card reveal mt-10 p-5" aria-labelledby="career-h">
      <h2 id="career-h" className="text-xs font-semibold uppercase tracking-wider text-muted">{n.name}: career facts</h2>
      <dl className="mt-3 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[9rem_1fr]">
        {rows.map(([k, v]) => <div key={k} className="contents"><dt className="text-muted">{k}</dt><dd className="min-w-0 text-ink/90">{v}</dd></div>)}
      </dl>
      <p className="mt-3 text-[11px] text-muted">{VA_REVIEWED ? "Checked" : `Draft, cross-checked${VA_CHECKED ? ` on ${fmt(VA_CHECKED)}` : ""}`} against Wikipedia, Anime News Network and agency profiles. <Link href="/how-we-check" className="underline">How we check</Link></p>
    </section>
  );
}
