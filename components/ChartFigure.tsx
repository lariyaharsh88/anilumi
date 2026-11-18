import type { Chart } from "@/lib/charts";

/** A page's chart image (lib/charts.ts) with its caption; 1200×630, so it doubles as the share image. */
export default function ChartFigure({ chart, caption, className = "" }: { chart: Chart; caption: string; className?: string }) {
  return (
    <figure className={`reveal ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- a static file in public/, already sized and compressed */}
      <img src={chart.src} alt={chart.alt} width={1200} height={630} loading="lazy" decoding="async" className="h-auto w-full max-w-3xl rounded-2xl border border-line" />
      <figcaption className="mt-2 text-xs text-muted">{caption}</figcaption>
    </figure>
  );
}
