import Link from "@/components/Link";
import type { EditorNote as Note } from "@/data/notes";
import CheckedBy, { DraftLabel } from "./CheckedBy";

/**
 * A short spoiler-free note, where to start, and three similar shows. "In short" (premise and facts) until the
 * author signs it off; a signed-off note is "AniLumi's take", the author's own view.
 */
export default function EditorNote({ title, note }: { title: string; note: Note }) {
  const label = note.reviewed ? "AniLumi's take" : "In short";
  return (
    <aside className="card mb-8 border-violet/30 p-4 sm:p-5" aria-label={`${label} on ${title}`}>
      <p className="text-xs font-semibold uppercase tracking-wider text-violet-2">{label}</p>
      <p className="mt-2 text-[15px] leading-7 text-ink/90">{note.take}</p>
      {note.start && (
        <p className="mt-3 text-sm leading-6 text-ink/85"><strong className="text-ink">Where to start:</strong> {note.start}</p>
      )}
      <p className="mt-3 flex flex-wrap items-center gap-2 text-sm">
        <span className="text-muted">If you like it, try</span>
        {note.next.map(([slug, t]) => <Link key={slug} href={`/anime/${slug}`} className="chip">{t}</Link>)}
      </p>
      {note.checked ? <CheckedBy date={note.checked} className="mt-3" /> : <DraftLabel className="mt-3" />}
    </aside>
  );
}
