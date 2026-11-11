import Link from "@/components/Link";
import { characterNote, debutInShow, linkedArcs, NOTES_CHECKED, NOTES_REVIEWED } from "@/lib/charnotes";

const fmt = (iso: string) => new Date(`${iso}T12:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

/** Role, first appearance, key arcs, affiliations and family for a top character (lib/charnotes.ts). */
export default function CharacterNotes({ slug, show }: { slug: string; show: { slug: string; title: string } | null }) {
  const n = characterNote(slug);
  if (!n) return null;
  const arcs = linkedArcs(n, show?.slug);
  const d = n.debut;
  const epLink = d && show && debutInShow(n, show.title) ? `/anime/${show.slug}/episode/${d.episode}` : null;
  const rows: [string, React.ReactNode][] = [];
  if (n.role) rows.push(["Role", n.role]);
  if (d?.anime && (d.episode || d.episodeTitle)) rows.push(["First appears", <>{epLink ? <Link href={epLink} className="text-violet-2 hover:underline">{d.anime} episode {d.episode}</Link> : `${d.anime}${d.episode ? ` episode ${d.episode}` : ""}`}{d.episodeTitle ? <span className="text-muted">: “{d.episodeTitle}”</span> : null}</>]);
  else if (d?.anime) rows.push(["First appears", d.anime]);
  if (d?.source && (d.chapter || d.volume)) rows.push([d.source === "manga" ? "In the manga" : "In the light novel", d.chapter ? `chapter ${d.chapter}` : `volume ${d.volume}`]);
  if (arcs.length) rows.push(["Key arcs", <span key="arcs" className="flex flex-wrap gap-1.5">{arcs.map((a) => a.arc && show ? <Link key={a.name} href={`/anime/${show.slug}/episodes${Math.ceil(a.arc.from / 20) > 1 ? `/page/${Math.ceil(a.arc.from / 20)}` : ""}#ep-${a.arc.from}`} className="chip">{a.name}</Link> : <span key={a.name} className="chip">{a.name}</span>)}</span>]);
  if (n.affiliations.length) rows.push(["Affiliations", n.affiliations.join(" · ")]);
  if (n.relatives.length) rows.push(["Family", n.relatives.map((r) => `${r.name} (${r.relation})`).join(" · ")]);
  if (n.abilities) rows.push(["Abilities", n.abilities]);
  if (n.hindiVoice) rows.push(["Hindi voice", <>{n.hindiVoice.name} <span className="text-muted">({n.hindiVoice.dub})</span></>]);
  if (!rows.length) return null;
  return (
    <section className="card reveal p-5" aria-labelledby="notes-h">
      <h2 id="notes-h" className="text-xs font-semibold uppercase tracking-wider text-muted">{n.name}: in the story</h2>
      <dl className="mt-3 grid gap-x-4 gap-y-2 text-sm sm:grid-cols-[9rem_1fr]">
        {rows.map(([k, v]) => <div key={k} className="contents"><dt className="text-muted">{k}</dt><dd className="min-w-0 text-ink/90">{v}</dd></div>)}
      </dl>
      {n.fate && (
        <details className="mt-3 rounded-xl border border-line bg-white/[.03] p-3 text-sm">
          <summary className="cursor-pointer font-medium text-ink">Does {n.name} die? <span className="text-muted">(spoiler, tap to reveal)</span></summary>
          <p className="mt-2 text-ink/90"><strong>{n.fate.status === "alive" ? "No." : n.fate.status === "dies" ? "Yes." : "It's unclear."}</strong> {n.fate.detail} <span className="text-muted">(As of the {n.fate.basis}.)</span></p>
        </details>
      )}
      <p className="mt-3 text-[11px] text-muted">{NOTES_REVIEWED ? "Checked" : `Draft, cross-checked${NOTES_CHECKED ? ` on ${fmt(NOTES_CHECKED)}` : ""}`} against the series wiki and Wikipedia. <Link href="/how-we-check" className="underline">How we check</Link></p>
    </section>
  );
}
