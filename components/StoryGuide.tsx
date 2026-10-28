import Link from "@/components/Link";
import type { FillerInfo } from "@/lib/filler";
import type { ContinueEntry } from "@/data/filler";
import { formatRanges, fillerSource } from "@/lib/filler";
import { amazonSearch, affiliateRel } from "@/lib/affiliate";

const Badge = ({ label, tone }: { label: string; tone: "ok" | "draft" }) => (
  <span className={`ml-2 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase ${tone === "draft" ? "bg-[#fab219]/15 text-[#fab219]" : "bg-emerald-400/15 text-emerald-300"}`}>{label}</span>
);
const Draft = () => <Badge label="Draft · being verified" tone="draft" />;
const hours = (min: number) => (min >= 120 ? `${Math.round(min / 60)} hours` : `${Math.round(min)} minutes`);

/** Filler summary and "continue the story" card for the anime page. */
export default function StoryGuide({ title, animeHref, filler, episodeLength, cont }: { title: string; animeHref: string; filler: FillerInfo | null; episodeLength: number | null; cont: ContinueEntry | null }) {
  if (!filler && !cont) return null;
  return (
    <section className="mt-8 grid gap-3 lg:grid-cols-2" aria-label="Filler and source material">
      {filler && (
        <div className="card p-4">
          <h2 className="font-semibold">Filler guide<Badge {...fillerSource(filler.entry)} /></h2>
          <p className="mt-1 text-sm text-ink/90">
            <strong>{filler.count}</strong> of {filler.total} episodes are filler ({filler.share.toFixed(0)}%)
            {episodeLength ? `. Skipping them saves about ${hours(filler.count * episodeLength)}.` : "."}
          </p>
          {filler.entry.note && <p className="mt-1 text-sm text-muted">{filler.entry.note}</p>}
          <details className="mt-2 text-sm">
            <summary className="cursor-pointer text-violet hover:underline">Filler episode numbers</summary>
            <p className="mt-1 text-muted">{formatRanges(filler.filler)}{filler.mixed.size ? ` · mixed canon/filler: ${formatRanges(filler.mixed)}` : ""}</p>
          </details>
          <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-sm">
            <Link href={`${animeHref}/filler-list`} className="text-violet hover:underline">Full filler list →</Link>
            <Link href={`${animeHref}/episodes`} className="text-violet hover:underline">Episodes with filler marked</Link>
          </p>
          {fillerSource(filler.entry).tone === "draft" && <p className="mt-2 text-xs text-muted">This list hasn&apos;t been fully checked yet. Double-check before skipping a long run of episodes.</p>}
        </div>
      )}
      {cont && (
        <div className="card p-4">
          <h2 className="font-semibold">Continue the story{!cont.reviewed && <Draft />}</h2>
          <p className="mt-1 text-sm text-ink/90">
            Finished {title}? The {cont.medium} continues from <strong>{cont.chapter ? `chapter ${cont.chapter}` : `volume ${cont.volume}`}</strong>.
          </p>
          {cont.note && <p className="mt-1 text-sm text-muted">{cont.note}</p>}
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <a href={amazonSearch(cont.search)} target="_blank" rel={affiliateRel} className="btn-outline">📚 Get the {cont.medium}</a>
            <Link href={`${animeHref}/manga`} className="text-sm text-violet hover:underline">Where the anime ends →</Link>
          </div>
          {!cont.reviewed && <p className="mt-2 text-xs text-muted">Chapter numbers are being verified against the {cont.medium}.</p>}
        </div>
      )}
    </section>
  );
}
