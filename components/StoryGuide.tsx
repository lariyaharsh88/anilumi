import Link from "@/components/Link";
import type { FillerInfo } from "@/lib/filler";
import type { ContinueEntry } from "@/data/filler";
import { formatRanges } from "@/lib/filler";
import { amazonSearch, affiliateRel } from "@/lib/affiliate";

const Draft = () => <span className="ml-2 rounded bg-[#fab219]/15 px-1.5 py-0.5 text-[10px] font-semibold uppercase text-[#fab219]">Draft · being verified</span>;
const hours = (min: number) => (min >= 120 ? `${Math.round(min / 60)} hours` : `${Math.round(min)} minutes`);

/** Filler summary and "continue the story" card for the anime page. */
export default function StoryGuide({ title, episodesHref, filler, episodeLength, cont }: { title: string; episodesHref: string; filler: FillerInfo | null; episodeLength: number | null; cont: ContinueEntry | null }) {
  if (!filler && !cont) return null;
  return (
    <section className="mt-8 grid gap-3 lg:grid-cols-2" aria-label="Filler and source material">
      {filler && (
        <div className="card p-4">
          <h2 className="font-semibold">Filler guide{!filler.entry.reviewed && <Draft />}</h2>
          <p className="mt-1 text-sm text-ink/90">
            <strong>{filler.count}</strong> of {filler.total} episodes are filler ({filler.share.toFixed(0)}%)
            {episodeLength ? `. Skipping them saves about ${hours(filler.count * episodeLength)}.` : "."}
          </p>
          {filler.entry.note && <p className="mt-1 text-sm text-muted">{filler.entry.note}</p>}
          <details className="mt-2 text-sm">
            <summary className="cursor-pointer text-violet hover:underline">Filler episode numbers</summary>
            <p className="mt-1 text-muted">{formatRanges(filler.filler)}{filler.mixed.size ? ` · mixed canon/filler: ${formatRanges(filler.mixed)}` : ""}</p>
          </details>
          <Link href={episodesHref} className="mt-2 inline-block text-sm text-violet hover:underline">Episode list with filler marked →</Link>
          {!filler.entry.reviewed && <p className="mt-2 text-xs text-muted">This list hasn&apos;t been fully checked yet. Double-check before skipping a long run of episodes.</p>}
        </div>
      )}
      {cont && (
        <div className="card p-4">
          <h2 className="font-semibold">Continue the story{!cont.reviewed && <Draft />}</h2>
          <p className="mt-1 text-sm text-ink/90">
            Finished {title}? The {cont.medium} continues from <strong>{cont.chapter ? `chapter ${cont.chapter}` : `volume ${cont.volume}`}</strong>.
          </p>
          {cont.note && <p className="mt-1 text-sm text-muted">{cont.note}</p>}
          <a href={amazonSearch(cont.search)} target="_blank" rel={affiliateRel} className="btn-outline mt-3">📚 Get the {cont.medium}</a>
          {!cont.reviewed && <p className="mt-2 text-xs text-muted">Chapter numbers are being verified against the {cont.medium}.</p>}
        </div>
      )}
    </section>
  );
}
