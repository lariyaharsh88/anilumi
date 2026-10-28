import { fmtSec, spanSec, type SkipTimes } from "@/lib/skip";
import { timecode } from "@/lib/scene";

/** Opening / ending / recap times for one episode (AniSkip community data). */
export default function SkipGuide({ s, episode }: { s: SkipTimes; episode: number }) {
  const rows = ([["Previously on (recap)", s.recap], ["Opening", s.op], ["Ending", s.ed]] as const).filter(([, v]) => v);
  const total = spanSec(s.op) + spanSec(s.ed) + spanSec(s.recap);
  return (
    <section className="card mt-5 p-4" aria-labelledby={`skip-h-${episode}`}>
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <h2 id={`skip-h-${episode}`} className="font-semibold text-ink">⏭ Skip guide</h2>
        <p className="text-xs text-muted">Skipping all of it saves about <strong className="text-ink">{fmtSec(total)}</strong></p>
      </div>
      <dl className="mt-3 divide-y divide-line text-sm">
        {rows.map(([label, v]) => (
          <div key={label} className="flex items-center justify-between gap-3 py-2">
            <dt className="text-ink/85">{label}</dt>
            <dd className="text-right tabular-nums text-ink">
              ~{timecode(v!.start)}–{timecode(v!.end)} <span className="ml-1 text-xs text-muted">({fmtSec(spanSec(v))})</span>
            </dd>
          </div>
        ))}
      </dl>
      <p className="mt-2 text-xs text-muted">Community timestamps from <a href="https://aniskip.com" target="_blank" rel="noopener" className="underline">AniSkip</a>; they can be a few seconds off depending on the streaming service.</p>
    </section>
  );
}
