/** Circular score gauge (0–10). Pure SVG + CSS; the arc sweeps in once on load unless motion is reduced. */
export default function ScoreRing({ score, size = 64, label = "Score" }: { score: number; size?: number; label?: string }) {
  const r = 26, c = 2 * Math.PI * r, pct = Math.max(0, Math.min(1, score / 10));
  return (
    <div className="relative grid shrink-0 place-items-center" style={{ width: size, height: size }} role="img" aria-label={`${label} ${score.toFixed(1)} out of 10`}>
      <svg viewBox="0 0 64 64" width={size} height={size} className="-rotate-90">
        <defs>
          <linearGradient id="ring-g" x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor="#ffd88a" />
            <stop offset="1" stopColor="#ff7a8f" />
          </linearGradient>
        </defs>
        <circle cx="32" cy="32" r={r} fill="none" stroke="rgba(255,255,255,.1)" strokeWidth="6" />
        <circle cx="32" cy="32" r={r} fill="none" stroke="url(#ring-g)" strokeWidth="6" strokeLinecap="round" className="ring-arc"
          strokeDasharray={c} strokeDashoffset={c * (1 - pct)} style={{ ["--ring-from" as string]: `${c}`, ["--ring-to" as string]: `${c * (1 - pct)}` }} />
      </svg>
      <span className="absolute text-base font-black text-ink">{score.toFixed(1)}</span>
    </div>
  );
}
