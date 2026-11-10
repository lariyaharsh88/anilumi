import Link from "@/components/Link";
import { AUTHOR } from "@/lib/author";
import { editorWatched } from "@/lib/editor";

/** "✓ Harsh has watched this series": shown only for series on the editor's own watch list. */
export default function EditorWatched({ anime, className = "" }: { anime: { id: string; slug: string }; className?: string }) {
  if (!editorWatched(anime)) return null;
  return (
    <p className={`inline-flex items-center gap-1.5 rounded-full border border-emerald-500/40 bg-emerald-500/10 px-2.5 py-0.5 text-xs text-emerald-300 ${className}`}>
      <span aria-hidden>✓</span>
      <span><Link href={AUTHOR.path} rel="author" className="font-semibold underline decoration-emerald-500/40 underline-offset-2 hover:text-emerald-200">{AUTHOR.name.split(" ")[0]}</Link> has watched this series</span>
    </p>
  );
}
