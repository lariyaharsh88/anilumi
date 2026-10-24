import { BRAND, CRESCENT, SPARKLE, DOT } from "@/lib/brand";

/** Brand mark: a crescent moon holding an anime sparkle, on a pink→violet tile (same geometry as the favicon). */
export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 64 64" aria-hidden="true" className="shrink-0 drop-shadow-[0_0_12px_rgba(193,60,240,.45)]">
      <defs>
        <linearGradient id="al-bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor={BRAND.pink} />
          <stop offset=".55" stopColor={BRAND.magenta} />
          <stop offset="1" stopColor={BRAND.violet} />
        </linearGradient>
        <linearGradient id="al-moon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff" /><stop offset="1" stopColor="#ffe3ee" /></linearGradient>
        <linearGradient id="al-star" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#fff6dc" /><stop offset="1" stopColor={BRAND.gold} /></linearGradient>
        <radialGradient id="al-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stopColor="#fff" stopOpacity=".45" /><stop offset="1" stopColor="#fff" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width="64" height="64" rx="15" fill="url(#al-bg)" />
      <circle cx="45" cy="19" r="11" fill="url(#al-glow)" />
      <path d={CRESCENT} fill="url(#al-moon)" />
      <path d={SPARKLE} fill="url(#al-star)" className="logo-twinkle" />
      <circle cx={DOT.cx} cy={DOT.cy} r={DOT.r} fill="#fff" fillOpacity=".85" />
    </svg>
  );
}
