/**
 * AniLumi brand mark: a crescent moon (lumi = light; new episodes air late at night in Japan) holding a
 * four-point sparkle, on a pink→violet tile. One source of truth for the header logo, favicons, app icons
 * and social images. The crescent is drawn as a single path (no masks) so every renderer agrees, from
 * browsers to Satori/resvg and sharp/librsvg.
 *
 * Geometry (64×64): outer circle C(28,35) r17, bite circle C(36,28) r14; they cross at
 * (26.09,18.10) and (44.49,39.13). The sparkle sits inside the bite, clear of the crescent.
 */
export const BRAND = {
  pink: "#ff4d6d",
  magenta: "#c13cf0",
  violet: "#6c5ce7",
  gold: "#ffd88a",
  ink: "#0b0d13",
};

export const CRESCENT = "M26.09 18.1A17 17 0 1 0 44.49 39.13A14 14 0 0 1 26.09 18.1Z";
export const SPARKLE = "M45 10.5Q46.3 17.7 53.5 19Q46.3 20.3 45 27.5Q43.7 20.3 36.5 19Q43.7 17.7 45 10.5Z";
export const DOT = { cx: 52.5, cy: 33, r: 2 };

type Opts = {
  /** "tile" = rounded square (favicons, UI); "bleed" = full square (apple-touch, OS masks it); "maskable" = full square with the mark inside the 80% safe zone. */
  shape?: "tile" | "bleed" | "maskable";
  size?: number;
  /** Prefix for gradient ids when several marks share a document. */
  id?: string;
};

/** Standalone SVG markup for the mark. */
export function markSvg({ shape = "tile", size = 64, id = "al" }: Opts = {}): string {
  const bg = shape === "tile" ? `<rect width="64" height="64" rx="15" fill="url(#${id}-bg)"/>` : `<rect width="64" height="64" fill="url(#${id}-bg)"/>`;
  const art = `<circle cx="45" cy="19" r="11" fill="url(#${id}-glow)"/><path d="${CRESCENT}" fill="url(#${id}-moon)"/><path d="${SPARKLE}" fill="url(#${id}-star)"/><circle cx="${DOT.cx}" cy="${DOT.cy}" r="${DOT.r}" fill="#fff" fill-opacity=".85"/>`;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 64 64">
<defs>
<linearGradient id="${id}-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${BRAND.pink}"/><stop offset=".55" stop-color="${BRAND.magenta}"/><stop offset="1" stop-color="${BRAND.violet}"/></linearGradient>
<linearGradient id="${id}-moon" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffffff"/><stop offset="1" stop-color="#ffe3ee"/></linearGradient>
<linearGradient id="${id}-star" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#fff6dc"/><stop offset="1" stop-color="${BRAND.gold}"/></linearGradient>
<radialGradient id="${id}-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>
</defs>
${bg}${shape === "maskable" ? `<g transform="translate(9.6 9.6) scale(.7)">${art}</g>` : art}
</svg>`;
}

export const markDataUri = (o: Opts = {}) => `data:image/svg+xml;base64,${Buffer.from(markSvg(o)).toString("base64")}`;
