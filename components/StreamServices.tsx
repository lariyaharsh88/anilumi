import { audioLine, KIND_LABEL, safeUrl, servicesIn, type Region, type ServiceKind, type Streams } from "@/lib/streams";

export const STREAM_KIND_CLASS: Record<ServiceKind, string> = {
  free: "border-emerald-500/40 bg-emerald-500/10 text-emerald-300",
  subscription: "border-violet/40 bg-violet/10 text-violet-2",
  buy: "border-line bg-white/[.04] text-muted",
};

/** One country's legal services for a franchise: name, how you pay, audio, what it covers. */
export default function StreamServices({ e, r, compact = false }: { e: Streams; r: Region; compact?: boolean }) {
  const list = servicesIn(e, r);
  if (!list.length) return <p className="text-sm text-muted">No legal streaming service found in this country when we checked.</p>;
  return (
    <ul className={compact ? "space-y-1" : "space-y-2.5"}>
      {list.map((x) => {
        const url = safeUrl(x.url);
        const audio = audioLine(x);
        return (
          <li key={x.service + x.scope} className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
            {url
              ? <a href={url} target="_blank" rel="noopener nofollow" className="font-semibold text-ink hover:text-violet-2 hover:underline">{x.service} ↗</a>
              : <span className="font-semibold text-ink">{x.service}</span>}
            <span className={`rounded-full border px-2 py-0.5 text-[11px] font-medium ${STREAM_KIND_CLASS[x.kind]}`}>{KIND_LABEL[x.kind]}</span>
            {audio && <span className="text-ink/80">{audio}</span>}
            {!compact && x.scope && <span className="text-muted">· {x.scope}</span>}
            {x.confidence === "medium" && <span className="text-[11px] text-muted" title="Confirmed by one source only">· one source</span>}
          </li>
        );
      })}
    </ul>
  );
}
