/** Brand mark: a lumi (light) burst over a gradient tile. */
export default function Logo({ size = 28 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" className="shrink-0 drop-shadow-[0_0_10px_rgba(255,77,109,.45)]">
      <defs>
        <linearGradient id="lg-tile" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ff4d6d" />
          <stop offset="1" stopColor="#6c5ce7" />
        </linearGradient>
        <radialGradient id="lg-glow" cx=".5" cy=".42" r=".5">
          <stop offset="0" stopColor="#fff" stopOpacity=".95" />
          <stop offset="1" stopColor="#fff" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="32" height="32" rx="9" fill="url(#lg-tile)" />
      <circle cx="16" cy="13.5" r="7" fill="url(#lg-glow)" />
      <path d="M16 6.5l1.6 4.9 4.9 1.6-4.9 1.6L16 19.5l-1.6-4.9-4.9-1.6 4.9-1.6z" fill="#fff" />
      <path d="M9.5 25.5h13" stroke="#fff" strokeOpacity=".85" strokeWidth="2" strokeLinecap="round" />
    </svg>
  );
}
